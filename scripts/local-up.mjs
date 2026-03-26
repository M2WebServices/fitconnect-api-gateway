import fs from "fs";
import path from "path";
import net from "net";
import { spawn, spawnSync } from "child_process";

const ROOT = process.cwd();
const STATE_FILE = path.join(ROOT, ".local-services.json");

const SERVICES = [
  { name: "auth", script: "auth:dev" },
  { name: "community", script: "community:dev" },
  { name: "planning", script: "planning:dev" },
  { name: "challenge", script: "challenge:dev" },
  { name: "chatnotif", script: "chatnotif:dev" },
  { name: "gateway", script: "gateway:dev" },
];

const REQUIRED_PORTS = [4100, 4101, 4102, 4103, 4104, 4105, 5101, 5102, 5103, 5104, 5105, 5106];

const run = (command) => {
  const result = spawnSync(command, {
    cwd: ROOT,
    shell: true,
    stdio: "inherit",
    env: process.env,
  });
  return result.status ?? 1;
};

const runCapture = (command) => {
  const result = spawnSync(command, {
    cwd: ROOT,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
    encoding: "utf8",
  });

  return {
    status: result.status ?? 1,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
  };
};

const ensureContainer = ({ name, createCommand }) => {
  const inspect = runCapture(`docker container inspect ${name}`);
  if (inspect.status !== 0) {
    console.log(`[local-up] Creating missing container: ${name}`);
    const created = run(createCommand);
    if (created !== 0) {
      throw new Error(`Failed to create Docker container ${name}`);
    }
  }
};

const waitForPostgres = () => {
  for (let i = 0; i < 20; i += 1) {
    const ready = runCapture("docker exec -i fitconnect-planning-db pg_isready -U postgres");
    if (ready.status === 0) {
      return;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
  }

  throw new Error("Postgres container is not ready");
};

const ensureDockerInfra = () => {
  ensureContainer({
    name: "fitconnect-redis",
    createCommand: "docker run -d --name fitconnect-redis -p 6379:6379 redis:7-alpine",
  });

  ensureContainer({
    name: "fitconnect-planning-db",
    createCommand:
      "docker run -d --name fitconnect-planning-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=postgres -p 5432:5432 postgres:16-alpine",
  });

  console.log("[local-up] Starting Docker services (redis + postgres)...");
  const started = run("docker start fitconnect-redis fitconnect-planning-db");
  if (started !== 0) {
    throw new Error("Failed to start Docker infrastructure");
  }

  waitForPostgres();

  console.log("[local-up] Ensuring databases and schema...");
  const planningDb = run(
    'docker exec -i fitconnect-planning-db sh -lc "psql -U postgres -d postgres -tAc \"SELECT 1 FROM pg_database WHERE datname=\\\'planning_service\\\'\" | grep -q 1 || psql -U postgres -d postgres -c \"CREATE DATABASE planning_service;\""'
  );
  const communityDb = run(
    'docker exec -i fitconnect-planning-db sh -lc "psql -U postgres -d postgres -tAc \"SELECT 1 FROM pg_database WHERE datname=\\\'fitconnect_community\\\'\" | grep -q 1 || psql -U postgres -d postgres -c \"CREATE DATABASE fitconnect_community;\""'
  );
  const schema = run(
    'docker exec -i fitconnect-planning-db psql -U postgres -d fitconnect_community -c "CREATE SCHEMA IF NOT EXISTS community;"'
  );

  if (planningDb !== 0 || communityDb !== 0 || schema !== 0) {
    throw new Error("Failed to initialize PostgreSQL databases/schemas");
  }
};

const startService = (service) => {
  const child = spawn("npm", ["run", service.script], {
    cwd: ROOT,
    shell: true,
    detached: true,
    stdio: "ignore",
    env: process.env,
  });
  child.unref();
  return { ...service, pid: child.pid };
};

const isPortBusy = (port) =>
  new Promise((resolve) => {
    const tester = net
      .createServer()
      .once("error", (error) => {
        resolve(error?.code === "EADDRINUSE");
      })
      .once("listening", () => {
        tester.close(() => resolve(false));
      })
      .listen(port, "0.0.0.0");
  });

const checkPortsAvailability = async () => {
  const checks = await Promise.all(
    REQUIRED_PORTS.map(async (port) => ({
      port,
      busy: await isPortBusy(port),
    }))
  );

  const busyPorts = checks.filter((item) => item.busy).map((item) => item.port);
  if (busyPorts.length > 0) {
    console.error(
      `[local-up] Refused to start: ports already in use -> ${busyPorts.join(", ")}`
    );
    console.error("[local-up] Run: npm run local:down (or kill stale processes) then retry.");
    process.exit(1);
  }
};

const main = async () => {
  await checkPortsAvailability();
  ensureDockerInfra();

  console.log("[local-up] Starting local services in background...");
  const started = SERVICES.map(startService);

  fs.writeFileSync(STATE_FILE, JSON.stringify({ startedAt: new Date().toISOString(), services: started }, null, 2));

  console.log("[local-up] Services started. PIDs:");
  for (const service of started) {
    console.log(`  - ${service.name}: ${service.pid}`);
  }
  console.log("[local-up] Next step: npm run local:smoke");
};

main().catch((error) => {
  console.error("[local-up] Failed to start local stack", error);
  process.exit(1);
});
