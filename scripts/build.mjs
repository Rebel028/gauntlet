#!/usr/bin/env node
// Generate per-tool packages under dist/<tool>/ from the single source in src/.
// Zero-dep. Run: npm run build  (or: node scripts/build.mjs)
// SSOT: edit src/meta.json (descriptions) + src/agents/*.md (bodies) + src/skill/*.
// Everything under dist/ and the root marketplace pointers are DERIVED — never hand-edit.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "src");
const DIST = join(root, "dist");

const meta = JSON.parse(readFileSync(join(SRC, "meta.json"), "utf8"));
const body = (slug) => readFileSync(join(SRC, "agents", `${slug}.md`), "utf8").trimEnd() + "\n";
const skillBody = readFileSync(join(SRC, "skill", "SKILL.md"), "utf8").trimEnd() + "\n";
const customAdversary = readFileSync(join(SRC, "skill", "custom-adversary.md"), "utf8");

// ── helpers ──────────────────────────────────────────────────────────────
const yq = (s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`; // YAML/JSON double-quoted scalar
const write = (p, c) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, c); };
const fm = (lines, bodyText) => `---\n${lines.join("\n")}\n---\n\n${bodyText}`;
const json = (o) => JSON.stringify(o, null, 2) + "\n";

// ponytail: all five gauntlet agents are read-only skeptics (Read/Grep/Glob, model inherit).
// The read-only profile is hardcoded per tool below rather than carried in meta.json — the
// invariant IS the concept. Add a `tools` field to meta.json only if a non-read-only agent appears.

// ── skill (identical across tools; frontmatter from meta.json) ────────────
const skillFile = fm([`name: ${meta.skill.name}`, `description: ${yq(meta.skill.description)}`], skillBody);
function emitSkill(toolDir) {
  write(join(toolDir, "skills", meta.skill.name, "SKILL.md"), skillFile);
  write(join(toolDir, "skills", meta.skill.name, "custom-adversary.md"), customAdversary);
}

// ── per-tool agent frontmatter ────────────────────────────────────────────
const agentFm = {
  claude: (a) => fm([
    `name: ${a.name}`, `description: ${yq(a.description)}`,
    `tools: Read, Grep, Glob`, `model: inherit`, `color: ${a.color}`,
  ], body(a.slug)),
  cursor: (a) => fm([
    `name: ${a.name}`, `description: ${yq(a.description)}`,
    `model: inherit`, `readonly: true`,
  ], body(a.slug)),
  gemini: (a) => fm([
    `name: ${a.name}`, `description: ${yq(a.description)}`,
    `kind: local`, `tools:`, `  - read_file`, `  - grep_search`, `model: inherit`,
  ], body(a.slug)),
  opencode: (a) => fm([
    `description: ${yq(a.description)}`, `mode: subagent`,
    `permission:`, `  read: allow`, `  grep: allow`, `  glob: allow`,
    `  list: allow`, `  edit: deny`, `  bash: deny`, `  webfetch: deny`, `  websearch: deny`,
  ], body(a.slug)),
};

// Codex agents are TOML; developer_instructions uses a literal ''' string (no escaping of body).
const codexToml = (a) =>
  `name = ${yq(a.name)}\n` +
  `description = ${yq(a.description)}\n` +
  `sandbox_mode = "read-only"\n` +
  `developer_instructions = '''\n${body(a.slug).trimEnd()}\n'''\n`;

// ── manifests ─────────────────────────────────────────────────────────────
const pluginCore = {
  name: meta.name, version: meta.version, description: meta.description,
  author: meta.author, homepage: meta.homepage, repository: meta.repository,
  license: meta.license, keywords: meta.keywords,
};

// ── build ─────────────────────────────────────────────────────────────────
rmSync(DIST, { recursive: true, force: true });

// Claude: plugin auto-discovers agents/ + skills/ at plugin root.
{
  const d = join(DIST, "claude");
  write(join(d, ".claude-plugin", "plugin.json"), json(pluginCore));
  for (const a of meta.agents) write(join(d, "agents", `${a.name}.md`), agentFm.claude(a));
  emitSkill(d);
}
// Cursor: same auto-discovery; readonly enforces no-write.
{
  const d = join(DIST, "cursor");
  write(join(d, ".cursor-plugin", "plugin.json"), json({ name: meta.name, description: meta.description, version: meta.version, author: meta.author }));
  for (const a of meta.agents) write(join(d, "agents", `${a.name}.md`), agentFm.cursor(a));
  emitSkill(d);
}
// Gemini: extension manifest MUST sit beside agents/ + skills/.
{
  const d = join(DIST, "gemini");
  write(join(d, "gemini-extension.json"), json({ name: meta.name, version: meta.version, description: meta.description }));
  for (const a of meta.agents) write(join(d, "agents", `${a.name}.md`), agentFm.gemini(a));
  emitSkill(d);
}
// Opencode: no manifest; installer copies agents/ + skills/ into config dir.
{
  const d = join(DIST, "opencode");
  for (const a of meta.agents) write(join(d, "agents", `${a.name}.md`), agentFm.opencode(a));
  emitSkill(d);
}
// Codex: plugin ships the skill; agents are TOML supplement (plugins can't ship agents).
{
  const d = join(DIST, "codex");
  write(join(d, ".codex-plugin", "plugin.json"), json({ ...pluginCore, skills: "./skills/" }));
  for (const a of meta.agents) write(join(d, "agents", `${a.name}.toml`), codexToml(a));
  emitSkill(d);
}

// ── root marketplace pointers (only where a native installer reads them) ───
const repoGit = meta.repository.replace(/\/?$/, "") + ".git";
write(join(root, ".claude-plugin", "marketplace.json"), json({
  $schema: "https://json.schemastore.org/claude-code-marketplace.json",
  name: `${meta.name}-marketplace`, version: "1.0.0",
  description: `Marketplace for the ${meta.name} plugin.`,
  owner: meta.author,
  plugins: [{ name: meta.name, description: meta.description, source: "./dist/claude", category: "development" }],
}));
write(join(root, ".agents", "plugins", "marketplace.json"), json({
  name: `${meta.name}-marketplace`,
  plugins: [{
    name: meta.name, description: meta.description, category: "development",
    source: { source: "git-subdir", url: repoGit, path: "./dist/codex", ref: "master" },
    policy: { installation: "AVAILABLE" },
  }],
}));

console.log(`built dist/ for 5 tools + root marketplaces (v${meta.version})`);
