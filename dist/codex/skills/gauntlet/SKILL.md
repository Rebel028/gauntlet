---
name: gauntlet
description: "Spawn independent skeptic subagents that attack a candidate idea or design from different angles, so the flaw surfaces before you commit. Propose it proactively when you're torn between solutions and can't pick, when you're stuck or going in circles, when you like your own idea a bit too much (confirmation-bias risk), or before anything irreversible — a lint/CI rule, DB schema or migration, API contract, IaC/k8s config, or auth boundary — but ask permission before running. Run it without asking when the user explicitly calls \"/gauntlet\", asks to attack/stress-test/red-team an idea, or asks to decide between options."
---

# Gauntlet

A bias-check technique: spawn 2+ independent subagents, each attacking the idea from a different angle, to catch the flaw BEFORE it's set in concrete.

The name is the method: you run the idea through a gauntlet of independent attackers, each trying to stop it for a different reason. What makes it out the far side has earned your commitment. When you're choosing between options, run them all through — the one that takes the most hits and survives is usually the answer.

When picking between options rather than vetting one, run each agent against all the options at once ("attack each of these three caching approaches; for each, find where it breaks") so the comparison stays apples-to-apples.

## How to run it

1. **Pick 2+ agents with DIFFERENT angles.** Not "one for / one against" — that's a weak debate. You want genuinely different optics so the attacks don't overlap. The five standing personas are all read-only (they ground critique in your code but never modify it):
   - `gauntlet-formalist` — structure, logic, invariants. Are the categories actually orthogonal?
   - `gauntlet-practitioner` — the year-one maintainer. What gets painful, who gets paged?
   - `gauntlet-consumer-advocate` — the downstream consumer (API client, on-call). What breaks for them?
   - `gauntlet-historian` — prior art. Who tried this and why did it break?
   - `gauntlet-threat-modeler` — security. Where's the abuse case, the blast radius?

   No fit? Use the `custom-adversary` template (`custom-adversary.md`, alongside this skill) — not a registered agent; paste it into a general-purpose subagent restricted to read-only tools.

   **Pick angles that fit the decision.** A migration → formalist + practitioner + historian. An auth change → threat-modeler + consumer-advocate + formalist. Pick the 2–4 sharpest, not all six.

2. **Give each agent the FULL idea:** what it is, what's decided, which alternatives were rejected and why, what's irreversible. Without it the attack misses.

3. **Do NOT hint at the conclusion you want.** Never write "confirm that X is good." Write "attack X, find where it breaks." A skeptic agent that's been told the desired answer is useless.

4. **Spawn them concurrently and independently.** Dispatch every selected agent before awaiting any result, and never include one agent's output in another agent's prompt. Invoke each persona as its named subagent (each agent's body already encodes its angle: "have gauntlet-threat-modeler attack this migration: <full context>"). If your tool can't register named subagents, spawn generic read-only subagents and paste each persona's angle inline (see `custom-adversary.md`).

## After the agents report back

Synthesize. Classify every agent's verdict — converged on a flaw, disagreed, or failed to break it — before writing the summary; no report left unaccounted for. The pattern of agreement is the signal:

- **Two+ agents independently converge on the same flaw** → red flag. Do not wave it away. Independent convergence means it's real, not an artifact of one agent's framing.
- **The agents disagree** → surface both angles to the user. The decision is theirs; your job is to make the trade-off visible, not to pick.
- **All agents fail to break it** → that's meaningful evidence the idea is sound. Report what each tried and why it held — the failed attacks are the proof.

Don't bury the result in hedging. Lead with the strongest surviving objection.
