# Studio brief

Applies to everything in this repo. A project brief or an exploration brief can
add to this or overrule it; where they say nothing, this holds.

## What a prototype here is for

Answering a question, not producing an asset. Every exploration should be
traceable to something genuinely undecided — a roadmap item, an open question in
a design language, a critique finding. If you cannot name the question, the
prototype does not know when it is finished.

## Fidelity follows the question

Low fidelity is a first-class answer, not a rough draft. Use it when the question
is structural: where things go, what the surface is *for*, what it refuses to do.
Reach for production fidelity only when the question is about finish — because
almost-but-not-quite production fidelity reads as a promise the prototype is not
making, and people review it as if it were the real thing.

## Include the case that bends it

Every design reads well on its best case. A set of variants that only shows the
happy path has not been explored, it has been illustrated. Add the empty case,
the several-at-once case, the failure case — that is usually where the decision
actually gets made.

## Say what it costs

A frame's note should carry the tradeoff, not a description. "Filters in a left
panel" describes. "A left panel is a hard pass from engineering" is worth
writing down. If a variant is cheap to build and expensive to retrofit, say so.

## Honesty rules

- **Mock data only**, on a frozen clock. Never `new Date()`; export one `NOW`.
  Frames must compare design decisions, not the minute the page loaded.
- **Deliberately shallow flows say so.** A stub that pretends to work teaches
  people the prototype is finished. Have it announce itself.
- **Never invent a token.** If a value is not in the project's design language,
  either add it there first or flag that you are proposing a new one.

## Resources

- `AGENTS.md` — conventions, routing, and the laws that hold on every route
- `docs/methods/explore.md` — how to run a divergent exploration
- `docs/methods/critique.md` — how to score a surface against its own language
- `docs/methods/handoff.md` — how to prepare work for an engineer's agent
