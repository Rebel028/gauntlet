# Installing gauntlet

Gauntlet ships one skill + five read-only skeptic agents (`gauntlet-formalist`, `-practitioner`, `-consumer-advocate`, `-historian`, `-threat-modeler`) to **Claude Code, Codex, Gemini CLI, Cursor, and Opencode**. Every tool's files are generated from a single source into `dist/<tool>/`.

This file is written for **AI agents** installing gauntlet on the user's behalf. Humans: the same commands work for you; the manual-copy tables are at the bottom.

---

## For AI agents — do this

1. **Identify the tool you're running in** (Claude Code, Codex, Gemini CLI, Cursor, or Opencode). If unsure, ask the user which tool(s) to install for.
2. **Pick scope:** `--user` (global, default — recommended) or `--project` (this repo only).
3. **Run the one command for that tool** from the table below. Prefer the helper (works for every tool, no clone, non-interactive). Use the native command instead only if the user asks.
4. **Tell the user to restart / reload the tool**, then confirm the `gauntlet` skill and `gauntlet-*` agents appear.

Requirements: Node.js ≥ 18 (for the helper) and `git` (for native Codex/Gemini installs).

### Install command per tool

The helper needs no clone — `npx` fetches and runs it straight from GitHub.

| Tool | Recommended (helper, no clone) | Native alternative |
|---|---|---|
| **Claude Code** | `npx -y github:Rebel028/gauntlet --claude --user` | In-CLI: `/plugin marketplace add Rebel028/gauntlet` then `/plugin install gauntlet@gauntlet-marketplace` |
| **Codex** | `npx -y github:Rebel028/gauntlet --codex --user` | `codex plugin marketplace add Rebel028/gauntlet` then `/plugins` → install (skill only; the helper also copies the `.toml` agents) |
| **Gemini CLI** | `npx -y github:Rebel028/gauntlet --gemini --user` | `gemini extensions install https://github.com/Rebel028/gauntlet` (pulls the latest GitHub Release) |
| **Cursor** | `npx -y github:Rebel028/gauntlet --cursor --user` | none — file copy only |
| **Opencode** | `npx -y github:Rebel028/gauntlet --opencode --user` | none — file copy only |

Install for everything at once: `npx -y github:Rebel028/gauntlet --all --user`.

### Notes for the agent

- The command is **non-interactive** with flags — safe to run unattended. Add `--dry-run` first to show the plan without writing.
- **Codex agents:** `codex plugin ...` installs only the skill (Codex plugins can't ship agents). The helper (`--codex`) additionally copies the five `.toml` agents into `~/.codex/agents/`. Run the helper if the user wants the named agents.
- **Gemini native** requires a published GitHub Release; if it fails, fall back to the helper.
- Don't run `npx` if the user has said not to — instead clone and run `node bin/install.js --<tool> --user` (see below).

### Verify / uninstall

```bash
# from a clone:
node bin/install.js --list                 # show target dirs per tool/scope
node bin/install.js --codex --user --verify
node bin/install.js --all --user --uninstall
# via helper (no clone):
npx -y github:Rebel028/gauntlet --codex --user --verify
npx -y github:Rebel028/gauntlet --all --uninstall
```

Uninstall removes the `gauntlet-*` agent files and the `skills/gauntlet/` dir; other config is untouched.

Verification is read-only. It hashes every expected installed file and reports `ok`, `missing`, or `modified`, exiting nonzero if anything differs. It verifies the files fetched by `npx`, not live agent dispatch or whether a running client has reloaded them. The GitHub command checks against the current repository revision; pin a release such as `github:Rebel028/gauntlet#v1.2.0` to verify against a specific version.

---

## Helper flags (full reference)

| Flag | Meaning |
|---|---|
| `--claude --codex --gemini --cursor --opencode` | pick tools (repeatable) |
| `--all` | all five |
| `--user` | install globally (`~`), default |
| `--project` | install into the current repo only |
| `--list` | show target dirs and exit |
| `--dry-run` | print what would happen, write nothing |
| `--verify` | compare installed files with this package; requires a tool flag or `--all` |
| `--uninstall` | remove gauntlet files |
| `--help` | usage |

No flags → interactive checkbox picker (needs a TTY; run `npx -y github:Rebel028/gauntlet` directly, not piped).

---

## For humans — from a clone

```bash
git clone https://github.com/Rebel028/gauntlet
cd gauntlet
node bin/install.js                    # interactive picker
node bin/install.js --cursor --user    # or explicit flags (dependency-free)
```

### Manual copy (no script)

Everything is plain files under `dist/<tool>/`. Copy them into the tool's config dir.

| Tool | Copy from | Agents → | Skill → |
|---|---|---|---|
| Claude | `dist/claude/` | `~/.claude/agents/` | `~/.claude/skills/gauntlet/` |
| Cursor | `dist/cursor/` | `~/.cursor/agents/` | `~/.cursor/skills/gauntlet/` |
| Gemini | `dist/gemini/` | `~/.gemini/agents/` | `~/.gemini/skills/gauntlet/` |
| Codex | `dist/codex/` | `~/.codex/agents/` (`.toml`) | `~/.agents/skills/gauntlet/` |
| Opencode | `dist/opencode/` | `~/.config/opencode/agents/` | `~/.config/opencode/skills/gauntlet/` |

For project scope, drop the same files into the repo-local dir instead (`.claude/`, `.cursor/`, `.gemini/`, `.codex/` + `.agents/skills/`, `.opencode/`).
