```
     ██████╗  █████╗ ██╗   ██╗███╗   ██╗████████╗██╗     ███████╗████████╗
    ██╔════╝ ██╔══██╗██║   ██║████╗  ██║╚══██╔══╝██║     ██╔════╝╚══██╔══╝
    ██║  ███╗███████║██║   ██║██╔██╗ ██║   ██║   ██║     █████╗     ██║   
    ██║   ██║██╔══██║██║   ██║██║╚██╗██║   ██║   ██║     ██╔══╝     ██║   
    ╚██████╔╝██║  ██║╚██████╔╝██║ ╚████║   ██║   ███████╗███████╗   ██║   
     ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚══════╝   ╚═╝  
```

Run an idea through a gauntlet of **independent skeptic subagents**, each attacking it from a different angle, so the flaw surfaces *before* you commit.

<p align="center">
  <img height="360" alt="gauntlet meme" src="https://github.com/user-attachments/assets/f0f4480e-4fb6-4285-8fa0-a4f646e00502" />
</p>

Most "get a second opinion" tools converge toward agreement. Gauntlet does the opposite: it spawns several agents that don't see each other's reasoning, each trying to break your idea on its own terms. When two of them independently land on the same flaw, that's signal — not noise.

Works in **Claude Code, Codex, Gemini CLI, Cursor, and Opencode** — from one source.

## What it's for

- **Choosing between candidate solutions** when you can't cleanly pick — run each option through, see which survives the most attacks.
- **Vetting one design** you're attached to, before confirmation bias locks it in.
- **Pressure-testing anything irreversible** — a lint/CI rule, a DB schema or migration, an API contract, an IaC/k8s config, an auth boundary.

## The agents

Five standing personas, each a read-only subagent — they can ground critique in your code but never modify it:

| Agent | Angle |
|---|---|
| `gauntlet-formalist` | Structure, logic, invariants — are the categories actually orthogonal? |
| `gauntlet-practitioner` | The year-one maintainer — what gets painful, who gets paged? |
| `gauntlet-consumer-advocate` | The downstream consumer — what breaks for them, what's surprising? |
| `gauntlet-historian` | Prior art — who tried this, why did it break? |
| `gauntlet-threat-modeler` | Security — where's the abuse case, the blast radius? |

Need a different angle? `custom-adversary.md` (beside the skill) is a template — paste it into a generic read-only subagent to spin up a bespoke lens (cost/FinOps, accessibility, compliance…).

# Installation

## Let your agent install it

Paste this to any coding agent (Claude Code, Codex, Gemini CLI, Cursor, Opencode):

```
Read https://raw.githubusercontent.com/Rebel028/gauntlet/master/INSTALL.md and install gauntlet for the tool you're running in.
```

## Do it yourself

### Helper script

Full matrix in **[INSTALL.md](./INSTALL.md)**. The short version — no clone needed, runs via `npx`:

```bash
# interactive picker
npx -y github:Rebel028/gauntlet

# all five tools
npx -y github:Rebel028/gauntlet --all

# or a single tool
npx -y github:Rebel028/gauntlet --codex

# verify a global installation against the current repository version
npx -y github:Rebel028/gauntlet --codex --user --verify
```

Verification is read-only and exits nonzero when an installed file is missing or differs. Pin a release, for example `github:Rebel028/gauntlet#v1.2.0`, to verify against that exact version. See [INSTALL.md](./INSTALL.md) for project-local and all-tool examples.

### Claude Code

```
/plugin marketplace add Rebel028/gauntlet
/plugin install gauntlet@gauntlet-marketplace
```

### Gemini CLI
```
gemini extensions install https://github.com/Rebel028/gauntlet
```

# Usage

Invoke it explicitly:

> "Run this caching design through the gauntlet."
> "I'm torn between optimistic and pessimistic locking here — gauntlet it."
> "Attack this migration plan before I write it."

Or let it trigger proactively when you're stuck, choosing between options, or about to set something in concrete.

Behind the scenes, the skill picks the 2–4 sharpest angles for your decision, spawns them **in parallel** (so they stay independent), tells each one to *attack, not agree*, then synthesizes: convergence on a flaw is a red flag; disagreement surfaces both sides for you to weigh; a clean pass is real evidence the idea holds.

## How it's built

One canonical source in `src/`; a zero-dependency Node generator emits a native package per tool into `dist/`.

```
gauntlet/
├── src/                     # SINGLE SOURCE OF TRUTH — edit here
│   ├── meta.json            #   plugin/skill/agent metadata (descriptions live here)
│   ├── agents/*.md          #   the 5 agent bodies (system prompts)
│   └── skill/               #   SKILL.md + custom-adversary.md
├── scripts/build.mjs        # generator: src/ -> dist/<tool>/
├── dist/                    # GENERATED — do not hand-edit
│   ├── claude/  cursor/  gemini/  opencode/  codex/
├── bin/install.js           # uniform file-copy installer (run via npx)
├── .claude-plugin/          # root marketplace pointer (Claude)
└── .agents/plugins/         # root marketplace pointer (Codex)
```

Edit a prompt or description once in `src/`, run `npm run build`, and every tool's files update together. CI (`.github/workflows/build.yml`) regenerates `dist/` on every push to `src/`.

**Adding a tool or changing a format?** It's all in `scripts/build.mjs` — one `agentFm.<tool>` entry per format.

## Credits

The original concept and the first draft — a `skeptic-agents` skill — were written by [@Tellexxii](https://github.com/Tellexxii). This project is the rewrite and repackaging of that idea: restructured around real read-only subagents, trimmed, and shipped across five agent tools.

## License

MIT
