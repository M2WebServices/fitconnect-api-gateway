import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const ROOT = process.cwd();
const STATE_FILE = path.join(ROOT, ".local-services.json");

const isProcessRunning = (pid) => {
  if (!pid) return false;

  if (process.platform === "win32") {
    const result = spawnSync(`tasklist /FI "PID eq ${pid}"`, {
      cwd: ROOT,
      shell: true,
      stdio: "pipe",
      encoding: "utf8",
      env: process.env,
    });

    if (result.status !== 0) return false;
    return result.stdout.includes(String(pid));
  }

  const result = spawnSync(`kill -0 ${pid}`, {
    cwd: ROOT,
    shell: true,
    stdio: "ignore",
    env: process.env,
  });
  return result.status === 0;
};

const main = () => {
  if (!fs.existsSync(STATE_FILE)) {
    console.log("[local-status] No state file found. Run: npm run local:up");
    process.exit(0);
  }

  const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  const services = Array.isArray(data.services) ? data.services : [];

  console.log(`[local-status] Started at: ${data.startedAt || "unknown"}`);
  for (const service of services) {
    const running = isProcessRunning(service.pid);
    console.log(`  - ${service.name}: PID ${service.pid} -> ${running ? "running" : "stopped"}`);
  }
};

main();
