/**
 * One-command launcher: `npm run app` (or `run.cmd` from the project root).
 *
 *   1. checks Node, installs dependencies when node_modules is missing/stale
 *   2. checks .env.local (creates it from .env.example if absent)
 *   3. optionally syncs the DB schema + seeds         (--setup)
 *   4. starts Next (dev by default, production with --prod) on a free port
 *   5. waits for the app + /api/health, then opens the browser
 *
 * Flags:  --setup   drizzle-kit push + idempotent seed (no wipe) before starting
 *         --prod    next build && next start instead of next dev
 *         --port N  preferred port (default 3000; next free one is used if taken)
 *         --no-open don't open the browser
 *
 * Plain Node, no dependencies — it has to run before `npm install` has.
 */
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, statSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const portArg = args.indexOf("--port");
const preferredPort = portArg >= 0 ? Number(args[portArg + 1]) : 3000;
const prod = flag("--prod");
const isWin = process.platform === "win32";

const c = (code) => (s) => (process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s);
const green = c(32), yellow = c(33), red = c(31), dim = c(2), bold = c(1);
const step = (msg) => console.log(`${bold("›")} ${msg}`);
const ok = (msg) => console.log(`  ${green("✓")} ${msg}`);
const warn = (msg) => console.log(`  ${yellow("!")} ${msg}`);
const fail = (msg) => {
  console.error(`  ${red("✗")} ${msg}`);
  process.exit(1);
};

/** npm/npx are .cmd shims on Windows, so commands go through the shell as one string. */
const sh = (cmd, cmdArgs) => [cmd, ...cmdArgs].join(" ");

/** Run a command to completion with inherited output; exit on failure. */
function run(cmd, cmdArgs, label) {
  const res = spawnSync(sh(cmd, cmdArgs), { stdio: "inherit", shell: true });
  if (res.status !== 0) fail(`${label} failed (exit ${res.status ?? res.signal})`);
}

function portFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => srv.close(() => resolve(true)));
    srv.listen(port);
  });
}

async function findPort(start) {
  for (let p = start; p < start + 20; p++) if (await portFree(p)) return p;
  fail(`no free port between ${start} and ${start + 19}`);
}

async function waitFor(url, timeoutMs) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      return await fetch(url);
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return null;
}

function openBrowser(url) {
  const [cmd, cmdArgs] = isWin
    ? ["cmd", ["/c", "start", "", url]]
    : process.platform === "darwin"
      ? ["open", [url]]
      : ["xdg-open", [url]];
  spawn(cmd, cmdArgs, { stdio: "ignore", detached: true }).unref();
}

// --- 1. Node + dependencies ---------------------------------------------------
step("Checking Node");
const major = Number(process.versions.node.split(".")[0]);
if (major < 20) fail(`Node ${process.versions.node} is too old — install Node 20 or newer`);
ok(`Node ${process.versions.node}`);

step("Checking dependencies");
const installedMarker = path.join(root, "node_modules", ".package-lock.json");
const stale =
  !existsSync(installedMarker) ||
  statSync(path.join(root, "package-lock.json")).mtimeMs > statSync(installedMarker).mtimeMs;
if (stale) {
  warn("node_modules missing or out of date — running npm install");
  run("npm", ["install"], "npm install");
}
ok("dependencies installed");

// --- 2. Environment -----------------------------------------------------------
step("Checking .env.local");
if (!existsSync(".env.local")) {
  copyFileSync(".env.example", ".env.local");
  warn("created .env.local from .env.example — fill in DATABASE_URL, then re-run");
}
try {
  process.loadEnvFile(".env.local");
} catch {
  /* unreadable — handled by the checks below */
}
const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING;
const backend = process.env.NEXT_PUBLIC_DATA_BACKEND;
if (backend === "db" && !dbUrl?.startsWith("postgres")) {
  fail("NEXT_PUBLIC_DATA_BACKEND=db but DATABASE_URL is not set in .env.local");
}
ok(backend === "db" ? `database backend (${process.env.DB_DRIVER || "neon"})` : "browser localStorage backend");

// --- 3. Optional DB setup -----------------------------------------------------
if (flag("--setup")) {
  if (!dbUrl) fail("--setup needs DATABASE_URL in .env.local");
  step("Syncing database schema (drizzle-kit push)");
  run("npx", ["drizzle-kit", "push"], "drizzle-kit push");
  step("Seeding database (keeps existing data)");
  run("npx", ["tsx", "scripts/seed.ts", "--keep"], "seed");
}

// --- 4. Start Next ------------------------------------------------------------
// Next refuses a second dev server for the same folder — if ours is already
// up, point at it instead of failing. (/api/health's `backend` field marks it as this app.)
const existing = await fetch(`http://localhost:${preferredPort}/api/health`, { signal: AbortSignal.timeout(3000) })
  .then((r) => r.json())
  .catch(() => null);
if (existing && "backend" in existing) {
  const url = `http://localhost:${preferredPort}`;
  console.log(`\n  ${green("●")} ${bold("SpinTTRatings is already running →")} ${url}`);
  console.log(dim("    stop it (Ctrl+C in its terminal) to restart\n"));
  if (!flag("--no-open")) openBrowser(url);
  process.exit(0);
}

const port = await findPort(preferredPort);
if (port !== preferredPort) warn(`port ${preferredPort} is busy — using ${port}`);

if (prod) {
  step("Building for production (next build)");
  run("npx", ["next", "build"], "next build");
}

step(`Starting Next ${prod ? "(production)" : "(dev)"} on port ${port}`);
const server = spawn(sh("npx", ["next", prod ? "start" : "dev", "-p", String(port)]), {
  stdio: "inherit",
  shell: true,
});
server.on("exit", (code) => process.exit(code ?? 0));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => server.kill(sig));

// --- 5. Health check + browser ------------------------------------------------
const base = `http://localhost:${port}`;
const home = await waitFor(base, 180_000);
if (!home) {
  warn(`app did not answer on ${base} within 3 minutes — check the output above`);
} else {
  if (dbUrl) {
    const health = await waitFor(`${base}/api/health`, 60_000);
    const body = health ? await health.json().catch(() => null) : null;
    if (body?.ok) ok(`database connected (${body.driver}, ${body.latencyMs} ms)`);
    else warn(`database health check failed: ${body?.error ?? body?.reason ?? "no response"}`);
  }
  console.log(`\n  ${green("●")} ${bold("SpinTTRatings is running →")} ${base}`);
  console.log(dim("    Ctrl+C to stop\n"));
  if (!flag("--no-open")) openBrowser(base);
}
