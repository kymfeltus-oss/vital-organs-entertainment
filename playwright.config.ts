import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { defineConfig, devices } from "@playwright/test";

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};

  const out: Record<string, string> = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const cwd = process.cwd();
const fileEnv = {
  ...parseEnvFile(resolve(cwd, ".env")),
  ...parseEnvFile(resolve(cwd, ".env.local")),
};

for (const [key, value] of Object.entries(fileEnv)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

process.env.NEXT_PUBLIC_E2E_BYPASS = process.env.NEXT_PUBLIC_E2E_BYPASS || "true";
process.env.OPS_ADMIN_DEV_BYPASS = process.env.OPS_ADMIN_DEV_BYPASS || "true";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      ...fileEnv,
      NODE_ENV: "test",
      NEXT_PUBLIC_E2E_BYPASS: "true",
      OPS_ADMIN_DEV_BYPASS: "true",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
