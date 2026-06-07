import { readFileSync, appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const logPath = join(root, "debug-2e6470.log");
const endpoint =
  "http://127.0.0.1:7792/ingest/d8b5dd27-4a5d-456e-ab44-bc32a12c283a";

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const payload = {
  sessionId: "2e6470",
  runId: "verify-dev",
  hypothesisId: "H1",
  location: "scripts/debug-verify-dev.mjs",
  message: "package.json scripts audit before dev",
  data: {
    hasScripts: Boolean(pkg.scripts),
    devScript: pkg.scripts?.dev ?? null,
    hasNextDep: Boolean(pkg.dependencies?.next),
    nextInNodeModules: (() => {
      try {
        readFileSync(join(root, "node_modules/next/package.json"), "utf8");
        return true;
      } catch {
        return false;
      }
    })(),
  },
  timestamp: Date.now(),
};

appendFileSync(logPath, `${JSON.stringify(payload)}\n`);

await fetch(endpoint, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Debug-Session-Id": "2e6470",
  },
  body: JSON.stringify(payload),
}).catch(() => {});
