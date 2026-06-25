---
name: gauntlet
description: >-
  Spawn independent skeptic subagents that attack a candidate idea or design
  from different angles, so the flaw surfaces before you commit. Use proactively
  when you're torn between solutions and can't pick, when you're stuck or going
  in circles, when you like your own idea a bit too much (confirmation-bias
  risk), or before anything irreversible — a lint/CI rule, DB schema or
  migration, API contract, IaC/k8s config, or auth boundary. Always run it when
  the user explicitly calls "/gauntlet" or asks "run this through the gauntlet",
  "attack my idea", "stress-test this", "red-team this", "poke holes in this",
  "which option is best", "help me decide between these".
  Ask user permission before running this skill.
---

# Gauntlet

A bias-check technique: spawn 2+ independent subagents, each attacking the idea from a different angle, to catch the flaw BEFORE it's set in concrete.

The name is the method: you run the idea through a gauntlet of independent attackers, each trying to stop it for a different reason. What makes it out the far side has earned your commitment. When you're choosing between options, run them all through — the one that takes the most hits and survives is usually the answer.

## When to propose this (proactively)

Suggest the gauntlet yourself, without being asked, when:

- **You're stuck** — going in circles, re-deriving the same answer, can't see past your framing.
- **You like your own idea / you're emotionally invested** → high confirmation-bias risk. The more elegant it feels, the more you need this.
- **You're about to set something in concrete** — something irreversible or expensive to change later:
  - a lint/build/CI rule that will block every future PR
  - a database schema, index, or migration
  - an API or event contract other teams depend on
  - infrastructure-as-code, a k8s manifest, a network/IAM policy
  - an auth model, trust boundary, or permission scheme
  - a public interface, a default that's hard to walk back, a data format
- **You're choosing between candidate solutions** and can't cleanly pick — two or three approaches on the table, each with pull, no obvious winner. Run the angles against each option; the one that survives the most attacks usually is the answer.

The proactive list is about *catching* these situations. None of it gates explicit requests: if the user asks to attack, stress-test, red-team, or decide between options, run it — even for a small or reversible decision.

When picking between options rather than vetting one, run each agent against all the options at once ("attack each of these three caching approaches; for each, find where it breaks") so the comparison stays apples-to-apples.

## How to run it

1. **Pick 2+ agents with DIFFERENT angles.** Not "one for / one against" — that's a weak debate. You want genuinely different optics so the attacks don't overlap. The five standing personas in `agents/` are all read-only (`Read, Grep, Glob`):
   - `gauntlet-formalist` — structure, logic, invariants. Are the categories actually orthogonal?
   - `gauntlet-practitioner` — the year-one maintainer. What gets painful, who gets paged?
   - `gauntlet-consumer-advocate` — the downstream consumer (API client, on-call). What breaks for them?
   - `gauntlet-historian` — prior art. Who tried this and why did it break?
   - `gauntlet-threat-modeler` — security. Where's the abuse case, the blast radius?

   No fit? Use the `custom-adversary` template (`custom-adversary.md`, alongside this skill) — a template you paste into a `general-purpose` call, not a registered agent.

   **Pick angles that fit the decision.** A migration → formalist + practitioner + historian. An auth change → threat-modeler + consumer-advocate + formalist. Pick the 2–4 sharpest, not all six.

2. **Give each agent the FULL idea:** what it is, what's decided, which alternatives were rejected and why, what's irreversible. Without it the attack misses.

3. **Do NOT hint at the conclusion you want.** Never write "confirm that X is good." Write "attack X, find where it breaks." A skeptic agent that's been told the desired answer is useless.

4. **Spawn them in parallel, in one turn.** Independence is the whole point — the agents must not see each other's reasoning. Issue all the Task tool calls in a single block so they run concurrently and can't influence one another.

5. Invoke each persona as its named subagent — `@agent-gauntlet-formalist`, or just name it and let Claude delegate. A bare delegation works because each agent's body already encodes its angle: "have gauntlet-threat-modeler attack this migration: <full context>". For a bespoke angle, spawn a `general-purpose` subagent with the custom-adversary template, restricted to `Read, Grep, Glob`.

## After the agents report back

Synthesize. The pattern of agreement is the signal:

- **Two+ agents independently converge on the same flaw** → red flag. Do not wave it away. Independent convergence means it's real, not an artifact of one agent's framing.
- **The agents disagree** → surface both angles to the user. The decision is theirs; your job is to make the trade-off visible, not to pick.
- **All agents fail to break it** → that's meaningful evidence the idea is sound. Report what each tried and why it held — the failed attacks are the proof.

Don't bury the result in hedging. Lead with the strongest surviving objection.
