/**
 * Builds NestJS backend into web/backend-dist for same-Vercel deployment.
 * Vercel clones full repo — ../backend is available during build.
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "..");
const backendRoot = join(webRoot, "..", "backend");
const dest = join(webRoot, "backend-dist");

if (!existsSync(backendRoot)) {
  console.warn("backend/ not found — skipping Nest build (demo mode only)");
  process.exit(0);
}

console.log("Building NestJS API…");
execSync("npm install", { cwd: backendRoot, stdio: "inherit" });
execSync("npm run build", { cwd: backendRoot, stdio: "inherit" });

if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(join(backendRoot, "dist", "src"), dest, { recursive: true });
console.log("NestJS copied to web/backend-dist");
