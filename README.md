# Studio

A prototyping playground where design work lives in code, on an infinite canvas,
next to the product it's for.

```bash
npm install
npm run dev     # http://localhost:5177
```

A fresh clone runs against **Onward**, an invented departures app in
`examples/`, so you can see what a blueprint, a token scope, a brief and a
canvas of variants look like together before writing any of your own.

## What it is

Each **project** owns its blueprints — production-faithful screens to branch
from — its token scope, and its **brief**, which tells the agent how to
prototype for that product. **Explorations** live under a contributor folder. A
**canvas** is one infinite surface per project where all of it sits together.

Prototypes render **live at true size**: a 393pt phone is 393 units wide in
world space, and zoom is the viewport's job, so type keeps its real ratios at
every scale. Frames stay interactive — each has a reset above it to return the
prototype to its default state. Documents sit on the canvas as small objects and
expand over it.

There is no backend, no user system, and no real data. It builds to a static
bundle and would deploy anywhere unchanged.

## Your own work stays private

The tool is public; your projects don't have to be. Content lives in a **separate
repo** checked out at `workspace/`, which this repo gitignores — git here
physically cannot see it, so it can't be published by accident.

```
studio/                ← this repo, public: the tool
├── src/ scripts/ docs/
├── examples/onward/    ← the public specimen
└── workspace/          ← your private repo. Gitignored.
    ├── projects/
    └── contributors/
```

```bash
git clone <your-private-content-repo> workspace
npm run dev
```

Both roots are read, so the example and your real projects appear side by side.
Two histories, deliberately: this repo records how the tool evolved, yours
records how your design thinking did — which round came first, when a brief
changed, what was decided and rejected. That second history is the one with
compounding value, and the one you don't want indexed.

## The two axes

Project is the axis of navigation — what you're working on. Contributor is the
axis of write scope — whose work is safe to break. Keeping them separate is what
lets one layout serve a solo builder with six products and a design team with
one product and six designers.

> You can break your own stuff, but you can't break other people's stuff.

## Briefs inherit

`docs/brief.md` → the project's `brief.md` → the exploration's own. The agent
reads them broadest first; the most specific wins. Each is editable in the same
place it's read. Their **Resources** sections point at whatever is worth loading
— design languages, research, prior design rounds — usually as local sibling
paths, since the primary reader is the agent.

## Time, and what shipped

Dates come from `git log`; shipping status comes from the pull requests an
exploration declares in `exploration.json`, read through `gh`. Neither is
hand-maintained — `npm run sync` refreshes both and runs automatically before
dev and build. It degrades rather than fails when `gh` is missing or offline.

Live work sits open on the canvas, most recently moved first. Shipped, parked
and archived work is kept, not deleted — a decision made a year ago stays
findable next to the pull request that implemented it.

## Canvas

Drag or two-finger scroll to pan, pinch or ⌘-scroll to zoom, ⌘0 to fit, space to
pan over a live prototype. Clicking a frame's label expands it; clicking *into*
the phone drives the prototype.

## Publishing back to a project

```bash
npm run publish -- --list
npm run publish -- <canvas-id> --to ../<project>/design
```

Renders a canvas to a self-contained HTML record and writes it into the
project's own repo — one file, no external references, frames as rendered markup
rather than screenshots. Nothing is imported across that boundary in either
direction; Studio just writes a file. The loop closes on the other side, where
the pull request that lands it becomes the ref in `exploration.json` and Studio
reads its state back.

## Scripts

```bash
npm run build         # tsc -b && vite build
npm run sync          # refresh git dates + PR state
npm run check:tokens  # no raw colour outside a token declaration
npm run publish       # export a canvas into a project repo
```

Conventions live in **[AGENTS.md](AGENTS.md)** — the single source of truth for
how to work in this repo, and what every agent entry point points at.
