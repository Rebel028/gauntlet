#!/usr/bin/env node
// Uniform file-copy installer for the gauntlet skill + 5 skeptic agents.
// Copies the right dist/<tool>/ native files into a tool's config dir.
//
//   Flags (no flags => interactive TUI):
//     tools:  --claude --codex --gemini --cursor --opencode   (repeatable)  | --all
//     scope:  --project (./ in CWD)  |  --user (~ global)
//     misc:   --list  --dry-run  --uninstall  --help
//
// Flag mode is dependency-free. Interactive mode uses @clack/prompts (installed
// automatically when run via `npx github:Rebel028/gauntlet`).

import { cpSync, rmSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const HOME = os.homedir();
const TOOLS = ["claude", "codex", "gemini", "cursor", "opencode"];

// dest dirs per tool+scope. Codex splits: agents -> .codex/agents, skills -> .agents/skills.
function dests(tool, scope) {
  const base = (...s) => join(scope === "user" ? HOME : process.cwd(), ...s);
  switch (tool) {
    case "claude": return { agents: base(".claude", "agents"), skills: base(".claude", "skills") };
    case "cursor": return { agents: base(".cursor", "agents"), skills: base(".cursor", "skills") };
    case "gemini": return { agents: base(".gemini", "agents"), skills: base(".gemini", "skills") };
    case "codex":  return { agents: base(".codex", "agents"),  skills: base(".agents", "skills") };
    case "opencode":
      return scope === "user"
        ? { agents: join(HOME, ".config", "opencode", "agents"), skills: join(HOME, ".config", "opencode", "skills") }
        : { agents: join(process.cwd(), ".opencode", "agents"),  skills: join(process.cwd(), ".opencode", "skills") };
  }
}

const tilde = (p) => p.startsWith(HOME) ? "~" + p.slice(HOME.length) : p;

// planned copy ops for a tool: [{src, dest, kind}]
function plan(tool, scope) {
  const d = dests(tool, scope);
  const td = join(DIST, tool);
  const ops = [];
  const aSrc = join(td, "agents"), sSrc = join(td, "skills");
  if (existsSync(aSrc)) for (const f of readdirSync(aSrc)) ops.push({ src: join(aSrc, f), dest: join(d.agents, f), kind: "agent" });
  if (existsSync(sSrc)) for (const f of readdirSync(sSrc)) ops.push({ src: join(sSrc, f), dest: join(d.skills, f), kind: "skill" });
  return ops;
}

function doInstall(tools, scope, { dryRun = false, uninstall = false } = {}) {
  if (!existsSync(DIST)) fail("dist/ not found — run `npm run build` first (or reinstall via npx).");
  let n = 0;
  for (const tool of tools) {
    const ops = plan(tool, scope);
    if (!ops.length) { console.log(`  ${tool}: nothing to ${uninstall ? "remove" : "install"}`); continue; }
    console.log(`\n${uninstall ? "removing" : "installing"} ${tool} (${scope}):`);
    for (const op of ops) {
      const label = `  ${op.dest.endsWith("gauntlet") ? tilde(op.dest) + "/" : tilde(op.dest)}`;
      if (dryRun) { console.log(`  [dry] ${uninstall ? "rm" : "cp"} ${tilde(op.dest)}`); continue; }
      if (uninstall) { rmSync(op.dest, { recursive: true, force: true }); }
      else { mkdirSync(dirname(op.dest), { recursive: true }); cpSync(op.src, op.dest, { recursive: true }); }
      console.log(label);
      n++;
    }
  }
  if (!dryRun) console.log(`\n${uninstall ? "removed" : "installed"} ${n} item(s). ${uninstall ? "" : "Restart the tool / reload to pick them up."}`);
}

function listAll() {
  for (const tool of TOOLS) {
    console.log(`\n${tool}:`);
    for (const scope of ["project", "user"]) {
      const d = dests(tool, scope);
      console.log(`  ${scope.padEnd(8)} agents -> ${tilde(d.agents)}   skills -> ${tilde(d.skills)}`);
    }
  }
}

function fail(msg) { console.error(`error: ${msg}`); process.exit(1); }

const HELP = `gauntlet installer

  gauntlet-install [tools] [scope] [options]

  tools:  --claude --codex --gemini --cursor --opencode   (repeatable) | --all
  scope:  --project (repo-local)  |  --user (global, default)
  options: --list  --dry-run  --uninstall  --help

  No tool flags -> interactive picker.`;

async function interactive({ uninstall }) {
  let clack;
  try { clack = await import("@clack/prompts"); }
  catch { fail("interactive mode needs @clack/prompts. Use flags instead (e.g. --all --user), or run via `npx github:Rebel028/gauntlet`."); }
  const { intro, outro, multiselect, select, isCancel, cancel } = clack;
  intro(uninstall ? "gauntlet uninstall" : "gauntlet install");
  const tools = await multiselect({
    message: "Which tools?",
    options: TOOLS.map((t) => ({ value: t, label: t })),
    required: true,
  });
  if (isCancel(tools)) { cancel("cancelled"); process.exit(0); }
  const scope = await select({
    message: "Install scope?",
    options: [
      { value: "user", label: "user (global, ~)" },
      { value: "project", label: "project (this repo)" },
    ],
  });
  if (isCancel(scope)) { cancel("cancelled"); process.exit(0); }
  doInstall(tools, scope, { uninstall });
  outro("done");
}

// ── args ──
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
if (has("--help") || has("-h")) { console.log(HELP); process.exit(0); }
if (has("--list")) { listAll(); process.exit(0); }

const scope = has("--project") ? "project" : "user";
const uninstall = has("--uninstall");
const dryRun = has("--dry-run");
let tools = has("--all") ? TOOLS : TOOLS.filter((t) => has(`--${t}`));

if (!tools.length) {
  await interactive({ uninstall });
} else {
  doInstall(tools, scope, { dryRun, uninstall });
}
