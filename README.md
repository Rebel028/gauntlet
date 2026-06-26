# Gauntlet

Run an idea through a gauntlet of **independent skeptic subagents**, each attacking it from a different angle, so the flaw surfaces *before* you commit.

<p align="center">
  <img height="480" alt="gauntlet meme" src="https://github.com/user-attachments/assets/f0f4480e-4fb6-4285-8fa0-a4f646e00502" />
</p>

Most "get a second opinion" tools converge toward agreement. Gauntlet does the opposite: it spawns several agents that don't see each other's reasoning, each trying to break your idea on its own terms. When two of them independently land on the same flaw, that's signal — not noise.


## What it's for

- **Choosing between candidate solutions** when you can't cleanly pick — run each option through, see which survives the most attacks.
- **Vetting one design** you're attached to, before confirmation bias locks it in.
- **Pressure-testing anything irreversible** — a lint/CI rule, a DB schema or migration, an API contract, an IaC/k8s config, an auth boundary.

## The agents

Five standing personas, each a **read-only** subagent — they can read code, grep/glob, and search the web (prior art, CVEs), but never write, edit, or run shell commands:

| Agent | Angle |
|---|---|
| `gauntlet-formalist` | Structure, logic, invariants — are the categories actually orthogonal? |
| `gauntlet-practitioner` | The year-one maintainer — what gets painful, who gets paged? |
| `gauntlet-consumer-advocate` | The downstream consumer — what breaks for them, what's surprising? |
| `gauntlet-historian` | Prior art — who tried this, why did it break? |
| `gauntlet-threat-modeler` | Security — where's the abuse case, the blast radius? |

A sixth file, `custom-adversary.md`, is a *template* — it ships beside the skill, never registering as an agent. Paste it into a one-off read-only subagent to spin up a bespoke angle — a cost/FinOps lens, an accessibility lens, a compliance lens — when the standing five don't fit.

## Install

Gauntlet ships for five coding agents. Each agent's ready-to-install files live in its own top-level directory, all generated from one source (see [How it's built](#how-its-built)).

| Agent | Install |
|---|---|
| **Claude Code** | `/plugin marketplace add Rebel028/gauntlet` then `/plugin install gauntlet@gauntlet-marketplace` |
| **Gemini CLI** | `gemini extensions install https://github.com/Rebel028/gauntlet` *(see caveat below)* |
| **OpenCode** | copy `opencode/agents/` and `opencode/command/` into `~/.config/opencode/` (or your project's `.opencode/`) |
| **Codex** | copy `codex/agents/` (→ `~/.codex/agents/`) and `codex/prompts/` (→ `~/.codex/prompts/`) |
| **Cursor** | copy `cursor/agents/` and `cursor/commands/` into your project's `.cursor/` (or `~/.cursor/`) |

> **Gemini caveat:** `gemini extensions install <url>` expects the extension manifest at the repo root, but here it lives under `gemini/`. Until that's split into its own repo/branch, install by cloning and pointing at the subdir: `git clone https://github.com/Rebel028/gauntlet && gemini extensions install ./gauntlet/gemini`, or copy `gemini/agents/` → `~/.gemini/agents/` and `gemini/commands/` → `~/.gemini/commands/` manually.

## Usage

Invoke it explicitly:

> "Run this caching design through the gauntlet."
> "I'm torn between optimistic and pessimistic locking here — gauntlet it."
> "Attack this migration plan before I write it."

Or let it trigger proactively when you're stuck, choosing between options, or about to set something in concrete.

Behind the scenes, the skill picks the 2–4 sharpest angles for your decision, spawns them **in parallel** (so they stay independent), tells each one to *attack, not agree*, then synthesizes: convergence on a flaw is a red flag; disagreement surfaces both sides for you to weigh; a clean pass is real evidence the idea holds.

## How it's built

The persona bodies and orchestration text are **identical** across all five agents — only frontmatter, file format (markdown vs TOML), and directory differ. So there's one source of truth in `src/`, and a dependency-free Node script regenerates every agent's layout. No file is hand-duplicated.

```
gauntlet/
├── src/                        # the ONLY files humans edit
│   ├── personas/*.md           #   five skeptic personas (neutral frontmatter + body)
│   ├── custom-adversary.md     #   bespoke-angle template
│   └── skill.md                #   orchestration; {{SPAWN}} placeholder per agent
├── scripts/generate.mjs        # Node, no deps; `--check` fails on drift
├── .github/workflows/build.yml # PRs: drift check · master: regenerate + commit
│
├── .claude-plugin/marketplace.json   # stays at repo root; source → ./claude
├── claude/    .claude-plugin/plugin.json, agents/*.md, skills/gauntlet/{SKILL,custom-adversary}.md
├── gemini/    gemini-extension.json, agents/*.md, commands/gauntlet.toml, custom-adversary.md
├── opencode/  agents/*.md, command/gauntlet.md, custom-adversary.md
├── codex/     agents/*.toml, prompts/gauntlet.md, custom-adversary.md
└── cursor/    agents/*.md, commands/gauntlet.md, custom-adversary.md
```

Everything under `claude/ gemini/ opencode/ codex/ cursor/` is **generated** — edit `src/`, run `node scripts/generate.mjs`, and all five trees update. CI does this automatically on push to `master`.

## Credits

The original concept and the first draft — a Russian-language `skeptic-agents` skill — were written by [@Tellexxii](https://github.com/Tellexxii). This plugin is the English rewrite and repackaging of that idea: restructured around real read-only subagents, trimmed, and shipped as an installable Claude Code plugin.

## License

MIT

