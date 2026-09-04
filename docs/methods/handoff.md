# Method — handoff

The reader is no longer only an engineer. It is an engineer **and their agent**,
who will reinterpret this rather than copy it pixel-for-pixel. Write for that.

## Mechanism

Studio is an ordinary repo. An engineer clones it, has the code locally, and
points their agent at the exploration folder. Nothing is exported.

## Produce `contributors/<who>/<slug>/handoff.md` with

- **Build from this.** The specific view files that won, by path. Not the canvas
  — the canvas holds the rejected options too.
- **Don't miss these.** The two or three details that are load-bearing and easy
  to lose in translation. Measured values where they matter, and *why* the value
  is what it is.
- **Extra context if you need it.** Links to the decisions behind the design —
  the project's `design-language.md` section, the roadmap item, the canvas with
  the alternatives.
- **Ignore these.** What is scaffolding: mock data, the frozen clock, page
  furniture, any deliberately shallow flow.

## Before writing it

Ask the agent to check the exploration against the production repo — it is a
sibling, so this is a read away. *"Does this still match `../<project>`?"*
Fidelity drifts while an exploration is open, and a handoff built on a stale
blueprint costs more than it saves.
