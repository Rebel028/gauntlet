#!/usr/bin/env node
// Generate every agent-format variant of gauntlet from src/ — single source of truth.
// No deps. `--check` regenerates in memory and fails on drift (CI gate + self-test).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const check = process.argv.includes('--check');

// --- source parsing -------------------------------------------------------
function splitFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('missing frontmatter');
  const fm = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { fm, body: m[2].replace(/^\n+/, ''), raw: md };
}

const personas = fs.readdirSync(path.join(SRC, 'personas'))
  .filter(f => f.endsWith('.md'))
  .map(f => ({ file: f, ...splitFrontmatter(fs.readFileSync(path.join(SRC, 'personas', f), 'utf8')) }));

const skill = splitFrontmatter(fs.readFileSync(path.join(SRC, 'skill.md'), 'utf8'));
const customAdversary = fs.readFileSync(path.join(SRC, 'custom-adversary.md'), 'utf8');

const slug = p => p.fm.name.replace(/^gauntlet-/, ''); // formalist, practitioner, ...
const tomlStr = s => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

// --- spawn snippets (replace {{SPAWN}} in the skill body, per agent) -------
const SPAWN = {
  claude: `4. **Spawn them in parallel, in one turn.** Independence is the whole point — the agents must not see each other's reasoning. Issue all the Task tool calls in a single block so they run concurrently and can't influence one another.

5. Invoke each persona as its named subagent — \`@agent-gauntlet-formalist\`, or just name it and let Claude delegate. A bare delegation works because each agent's body already encodes its angle: "have gauntlet-threat-modeler attack this migration: <full context>". For a bespoke angle, spawn a \`general-purpose\` subagent with the custom-adversary template, restricted to read-only tools (\`Read, Grep, Glob, LSP, WebFetch, WebSearch\`).`,

  opencode: `4. **Spawn them in parallel.** Independence is the whole point — the agents must not see each other's reasoning. Delegate to all the subagents in one turn (via the Task tool) so they run concurrently and can't influence one another.

5. Invoke each persona by name with \`@gauntlet-formalist\` (or let the primary agent delegate based on the description). Each subagent is defined with \`mode: subagent\` and read-only permissions (\`edit: deny\`, \`bash: deny\`). For a bespoke angle, paste the custom-adversary template into a one-off subagent with the same read-only permissions.`,

  gemini: `4. **Spawn them in parallel.** Independence is the whole point — the agents must not see each other's reasoning. Ask Gemini to delegate to all the subagents at once so they run concurrently and can't influence one another.

5. Invoke each persona with \`@gauntlet-formalist\` (or let the main agent delegate based on the description). Each subagent is read-only — its \`tools\` are limited to read/search only. For a bespoke angle, paste the custom-adversary template into a one-off subagent restricted to read-only tools.`,

  codex: `4. **Spawn them in parallel.** Independence is the whole point — the agents must not see each other's reasoning. Tell Codex to spawn one subagent per angle and wait for all results before consolidating, e.g. "spawn these agents in parallel and wait for all: gauntlet-formalist, gauntlet-practitioner, gauntlet-historian — each attacking <full context>."

5. Each persona is a custom agent (\`~/.codex/agents/*.toml\`) with \`sandbox_mode = "read-only"\`, so it can read code but never modify it. For a bespoke angle, spawn a read-only agent with the custom-adversary template as its instructions.`,

  cursor: `4. **Spawn them in parallel.** Independence is the whole point — the agents must not see each other's reasoning. Delegate to all the subagents in one turn so they run concurrently and can't influence one another.

5. Invoke each persona with \`/gauntlet-formalist\` (or let Cursor delegate based on the description). Each subagent is defined with \`readonly: true\`, so it can read and analyze but never write. For a bespoke angle, paste the custom-adversary template into a one-off \`readonly\` subagent.`,
};

const SKILL_DESC = 'Run an idea or design through a gauntlet of independent skeptic subagents, each attacking from a different angle so the flaw surfaces before you commit.';
const skillBody = t => skill.body.replace('{{SPAWN}}', SPAWN[t]);

// --- per-agent persona emitters -------------------------------------------
const persona = {
  claude: p => `---\nname: ${p.fm.name}\ndescription: ${p.fm.description}\ntools: Read, Grep, Glob, LSP, WebFetch, WebSearch\nmodel: inherit\ncolor: ${p.fm.color}\n---\n\n${p.body}`,
  opencode: p => `---\ndescription: ${p.fm.description}\nmode: subagent\npermission:\n  edit: deny\n  bash: deny\n---\n\n${p.body}`,
  gemini: p => `---\nname: ${p.fm.name}\ndescription: ${p.fm.description}\nkind: local\ntools:\n  - read_file\n  - read_many_files\n  - grep\n  - glob\n  - list_directory\n  - web_fetch\n  - google_web_search\n---\n\n${p.body}`,
  cursor: p => `---\nname: ${p.fm.name}\ndescription: ${p.fm.description}\nmodel: inherit\nreadonly: true\n---\n\n${p.body}`,
  codex: p => `name = ${tomlStr(p.fm.name)}\ndescription = ${tomlStr(p.fm.description)}\nsandbox_mode = "read-only"\ndeveloper_instructions = '''\n${p.body}'''\n`,
};

// --- build the file map ----------------------------------------------------
const out = {}; // repo-relative path -> content

function emit(dir, agentsDir, ext, skillPath, skillWrap, customPath, t) {
  for (const p of personas) out[`${dir}/${agentsDir}/${slug(p)}.${ext}`] = persona[t](p);
  out[`${dir}/${skillPath}`] = skillWrap;
  out[`${dir}/${customPath}`] = customAdversary;
}

// claude: keep marketplace at repo root; plugin lives under claude/
emit('claude', 'agents', 'md', 'skills/gauntlet/SKILL.md',
  skill.raw.replace('{{SPAWN}}', SPAWN.claude), 'skills/gauntlet/custom-adversary.md', 'claude');

emit('opencode', 'agents', 'md', 'command/gauntlet.md',
  `---\ndescription: ${SKILL_DESC}\n---\n\n${skillBody('opencode')}`, 'custom-adversary.md', 'opencode');

emit('gemini', 'agents', 'md', 'commands/gauntlet.toml',
  `description = ${tomlStr(SKILL_DESC)}\nprompt = '''\n${skillBody('gemini')}'''\n`, 'custom-adversary.md', 'gemini');

emit('codex', 'agents', 'toml', 'prompts/gauntlet.md',
  `---\ndescription: ${SKILL_DESC}\n---\n\n${skillBody('codex')}`, 'custom-adversary.md', 'codex');

emit('cursor', 'agents', 'md', 'commands/gauntlet.md',
  `---\ndescription: ${SKILL_DESC}\n---\n\n${skillBody('cursor')}`, 'custom-adversary.md', 'cursor');

// --- prune orphans in fully-generated dirs (persona rename/removal) --------
// agents/ dirs contain ONLY generated personas, so anything not in `out` is stale.
const pruneDirs = ['claude', 'opencode', 'gemini', 'codex', 'cursor'].map(d => `${d}/agents`);
let drift = 0;
for (const dir of pruneDirs) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const f of fs.readdirSync(abs)) {
    const rel = `${dir}/${f}`;
    if (out[rel]) continue;
    if (check) { console.error(`ORPHAN: ${rel}`); drift++; continue; }
    fs.rmSync(path.join(abs, f));
    console.log(`removed ${rel}`);
  }
}

// --- write or check --------------------------------------------------------
for (const [rel, content] of Object.entries(out)) {
  const abs = path.join(ROOT, rel);
  const current = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
  if (current === content) continue;
  if (check) { console.error(`DRIFT: ${rel}`); drift++; continue; }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
  console.log(`wrote ${rel}`);
}

if (check && drift) {
  console.error(`\n${drift} file(s) out of date — run \`node scripts/generate.mjs\` and commit.`);
  process.exit(1);
}
console.log(check ? 'up to date' : `generated ${Object.keys(out).length} files`);
