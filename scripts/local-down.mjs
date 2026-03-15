import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const ROOT = process.cwd();
const STATE_FILE = path.join(ROOT, ".local-services.json");

const run = (command) => {
  spawnSync(command, {
    cwd: ROOT,
    shell: true,
    stdio: "inherit",
    env: process.env,
  });
};

const stopPid = (pid) => {
  if (process.platform === "win32") {
    run(`taskkill /PID ${pid} /F`);
    return;
  }
  run(`kill -9 ${pid}`);
};

const main = () => {
  if (!fs.existsSync(STATE_FILE)) {
    console.log("[local-down] No state file found. Nothing to stop.");
    return;
  }

  const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  const services = Array.isArray(data.services) ? data.services : [];

  console.log("[local-down] Stopping background services...");
  for (const service of services) {
    if (!service?.pid) continue;
    console.log(`  - ${service.name}: ${service.pid}`);
    stopPid(service.pid);
  }

  fs.unlinkSync(STATE_FILE);
  console.log("[local-down] Done.");
};

main();
