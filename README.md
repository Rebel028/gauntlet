# Gauntlet

Run an idea through a gauntlet of **independent skeptic subagents**, each attacking it from a different angle, so the flaw surfaces *before* you commit.

Most "get a second opinion" tools converge toward agreement. Gauntlet does the opposite: it spawns several agents that don't see each other's reasoning, each trying to break your idea on its own terms. When two of them independently land on the same flaw, that's signal — not noise.

## What it's for

- **Choosing between candidate solutions** when you can't cleanly pick — run each option through, see which survives the most attacks.
- **Vetting one design** you're attached to, before confirmation bias locks it in.
- **Pressure-testing anything irreversible** — a lint/CI rule, a DB schema or migration, an API contract, an IaC/k8s config, an auth boundary.

## The agents

Five standing personas, each a read-only subagent (`Read, Grep, Glob` — they can ground critique in your code but never modify it):

| Agent | Angle |
|---|---|
| `gauntlet-formalist` | Structure, logic, invariants — are the categories actually orthogonal? |
| `gauntlet-practitioner` | The year-one maintainer — what gets painful, who gets paged? |
| `gauntlet-consumer-advocate` | The downstream consumer — what breaks for them, what's surprising? |
| `gauntlet-historian` | Prior art — who tried this, why did it break? |
| `gauntlet-threat-modeler` | Security — where's the abuse case, the blast radius? |

A sixth file, `skills/gauntlet/custom-adversary.md`, is a *template* — it lives beside the skill rather than in `agents/`, so it never registers as an agent. Paste it into a `general-purpose` call to spin up a bespoke angle — a cost/FinOps lens, an accessibility lens, a compliance lens — when the standing five don't fit.

## Install

### Try it locally first

```
/plugin marketplace add /path/to/gauntlet-plugin
/plugin install gauntlet@gauntlet-marketplace
```

Or point Claude Code straight at the directory while iterating:

```
claude --plugin-dir /path/to/gauntlet-plugin
```

### From GitHub

```
/plugin marketplace add Rebel028/gauntlet
/plugin install gauntlet@gauntlet-marketplace
```

## Usage

Invoke it explicitly:

> "Run this caching design through the gauntlet."
> "I'm torn between optimistic and pessimistic locking here — gauntlet it."
> "Attack this migration plan before I write it."

Or let it trigger proactively when you're stuck, choosing between options, or about to set something in concrete.

Behind the scenes, the skill picks the 2–4 sharpest angles for your decision, spawns them **in parallel** (so they stay independent), tells each one to *attack, not agree*, then synthesizes: convergence on a flaw is a red flag; disagreement surfaces both sides for you to weigh; a clean pass is real evidence the idea holds.

## How it's built

```
gauntlet-plugin/
├── .claude-plugin/
│   ├── plugin.json        # manifest
│   └── marketplace.json   # single-plugin catalog
├── agents/                # five skeptic subagents (registered at plugin root)
└── skills/
    └── gauntlet/
        ├── SKILL.md            # the orchestration logic
        └── custom-adversary.md # template for a bespoke angle (not registered)
```

## Credits

The original concept and the first draft — a Russian-language `skeptic-agents` skill — were written by [@Tellexxii](https://github.com/Tellexxii). This plugin is the English rewrite and repackaging of that idea: restructured around real read-only subagents, trimmed, and shipped as an installable Claude Code plugin.

## License

MIT

