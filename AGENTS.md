# Studio — agent instructions

Studio is a prototyping playground for the projects in `~/dev`. It is a dev
environment built for design work, so assume the human never edits a file
directly — you do everything on their behalf.

Every entry point (`CLAUDE.md`, `.cursor/rules/`, `.github/copilot-instructions.md`)
points here. This file is the source of truth for *how the repo works*. What to
build and to what standard comes from **briefs** — see Rule 2.

---

## The two axes

Everything below follows from this, so read it before the rules.

- **Project** is the axis of **navigation** — what you are working on.
- **Contributor** is the axis of **write scope** — whose work it is safe to break.

They are deliberately separate, because the same layout has to serve two shapes
of team. A solo builder has many projects and one contributor. A design team has
one product and many contributors. The path carries both, so neither case has to
be retrofitted later.

### Two content roots

Real work is PRIVATE and lives in a separate repo checked out at `workspace/`,
which this repo gitignores — so it cannot be published by accident. `examples/`
ships with the tool so a fresh clone runs and shows what the conventions look
like.

```
workspace/                             ← private checkout. Real work goes here.
├── projects/<project>/
│   ├── project.json                   manifest — repo, platform, device, accent
│   ├── brief.md                       how to prototype for THIS product
│   ├── tokens.css                     its token scope, class .bp-<project>
│   ├── blueprints/*.tsx               production-faithful reference views
│   ├── components/*.tsx               shared pieces — NOT registered as views
│   ├── data/*.ts                      mock data, shaped like the real model
│   └── lib/*.ts                       ported domain logic
└── contributors/<who>/<project>/<slug>/
    ├── views/*.tsx                    one variant per file
    ├── <name>.canvas.json             arranges frames for comparison
    ├── exploration.json               title, question, PR links
    ├── brief.md                       scopes THIS exploration (optional)
    └── notes.md                       the question, tradeoffs, what was cut

examples/<project>/                    ← public specimen, same shape
├── project.json · brief.md · tokens.css · blueprints/ · components/ · data/
└── contributors/<who>/<slug>/         nested INSIDE, so one folder is complete

docs/brief.md                          the studio-wide brief
```

**Default to `workspace/`.** Only touch `examples/` when the request is about
the example itself, or about the tool's own documentation. Real design work
never goes in `examples/` — it would be published.

If `workspace/` is missing, say so rather than putting work in `examples/`:
the person needs to clone their content repo into it first.

Discovery is by convention (`src/registry.ts`, via `import.meta.glob`). There is
**no index to update and no script to run** — add the file, it appears. Both
roots are globbed; whichever exists contributes.

One trap: `import.meta.glob`'s options object must be an inline LITERAL at every
call site. Vite reads it statically, so hoisting it into a shared constant
silently drops `query: '?raw'` and hands markdown to the JS parser.

> Anything under `blueprints/` is registered as a view. Shared components go in
> `components/`, or they show up on the index as phantom screens.

---

## Rule 1 — Route by what is being worked on

Decide this first; it selects everything below.

| Route | Trigger | Where work lands |
|---|---|---|
| **Exploration** | "prototype / explore / try / variants of X" | `workspace/contributors/<who>/<project>/<slug>/` |
| **Blueprint** | "port / add a reference screen from project P" | `workspace/projects/<p>/blueprints/` |
| **New project** | "add project P to studio" | `workspace/projects/<p>/` |
| **Studio itself** | "add a device / fix the canvas / change the shell" | `src/` |

When the request is ambiguous, it is an **exploration**. That is the cheap,
reversible option and the one the human almost always means.

If the project is not obvious from the request, **ask** — do not guess. Filing
work under the wrong project is the one mistake this structure cannot
self-correct.

## Rule 2 — Read the brief chain before building

Briefs are the standing instructions for a scope, and they **inherit**:

```
docs/brief.md                                  applies to everything
  └── projects/<project>/brief.md              applies to that product
        └── contributors/<who>/<project>/<slug>/brief.md   applies to this work
```

Read them **broadest first**; where two disagree, the more specific one wins.
`briefChain()` in `src/registry.ts` computes the applicable set, and each brief
is visible in the UI at `#/b/<id>` so the human can see and edit the rules the
same way you read them.

A brief carries the things that make prototypes for that product *good* and
*consistent* — what the product is, its non-negotiables, what is already locked,
what is genuinely open — plus a **Resources** section pointing at material worth
reading: the project's design language, research, brand guidelines, prior rounds.
Those links are frequently local sibling paths (`../../<project>/core-docs/...`,
relative to `workspace/`). Follow
them; they are there because someone decided they were worth your context.

**When a brief is missing**, say so before building rather than inventing house
style. When you learn something during the work that the brief should have told
you, add it to the brief in the same change.

## Rule 3 — Conventions for the route

### Exploration

A view file needs only a default export and a `meta`:

```tsx
import { LockScreen, Notification } from '@/kit/ios'

export const meta = {
  name: 'B · novelty, named',   // shown on the index and under the frame
  project: 'onward',            // which token scope to render inside
  mode: 'dark' as const,        // optional default
  note: 'One sentence on what this bet is and what it costs.',
}

export default function NoveltyNamed() { … }
```

A canvas points at views by id and never embeds them, so a view can appear on
several canvases and is only ever edited in one place.

### Blueprint

A blueprint is a *production-faithful reference screen to branch from*, not a
recreation of the app. Port the specific views that get designed against.

- **Read the source repo.** `project.json` records where it lives, usually a
  sibling checkout. Read its design language for tokens and its model files for
  data shape. Do not invent either.
- **Port domain rules into `lib/`, not into views.** If the product has honesty
  contracts — a rule about what it may claim to know — they live in one function
  that views call, not restated in each view. `examples/onward` shows the shape:
  an unknown departure is never rendered as a number, and that rule lives in one
  place. A view must not be able to re-litigate it.
- **Mock data only, on a frozen clock.** Export a single `NOW` or `POSITION`;
  never `new Date()`. Frames must compare design decisions, not the minute the
  page loaded.
- **Rip out production-only logic** — form plumbing, persistence, network. It
  exists to stop the app breaking, which is the opposite of what a prototype
  needs. If porting starts producing shims and workarounds around production
  constraints, stop and rebuild the component from scratch instead.

### New project

Create `project.json` and `tokens.css`, then **stop and write `brief.md`** before
porting anything. A project with blueprints and no brief produces work that
drifts from the product, and the drift is invisible until someone who knows the
product looks at it. Registering a project without porting is a legitimate
state, and a common one: a design language with no token table that can be
lifted mechanically leaves nothing trustworthy to port yet.

### Studio itself

Higher bar. Changes here affect everyone's work — see Rule 4. Keep the shell a
*rendering surface*: there are no product actions in studio chrome, because the
interaction model is talking to the agent, not clicking.

## Rule 4 — Time and shipping status are DERIVED, not written

An exploration's dates and status come from `scripts/sync-activity.mjs`, which
runs automatically before `npm run dev` and `npm run build`:

- **When it started and last moved** — from `git log` over its folder. Never add
  an "updated" field. A hand-written date goes stale the first time someone
  forgets it, and a stale date is worse than none because it gets believed.
- **Whether it shipped** — from the PRs the exploration DECLARES in
  `exploration.json`, enriched through `gh`. The state is read from GitHub;
  `shipped` means a linked PR is merged, `in review` means one is open.

```json
{
  "title": "What the digest is allowed to say",
  "question": "The one question this exists to answer.",
  "pr": ["owner/repo#42"]
}
```

The **only** statuses a human declares are `"status": "parked"` and
`"status": "archived"` — work that stopped for a reason no commit records.
Never write `active` or `shipped`; they are computed, and writing them would let
the label drift from the truth.

**Link PRs, do not guess them.** Inferring the connection from a slug appearing
in PR text would be confidently wrong sometimes, and this is the field people
will trust most. When work from an exploration lands, add the PR ref to
`exploration.json` in the same change.

Prominence follows from this: live work sits open on the canvas, most recently
moved first; shipped, parked and archived work folds into "Kept for the record".
Nothing is ever deleted — the point is that a decision made a year ago can still
be found, with the PR that implemented it attached.

`src/generated/activity.json` is a gitignored cache. The app renders correctly
without it, so never commit it and never hand-edit it — run `npm run sync`.

## Rule 5 — Contributor scope

- Inside `workspace/contributors/<you>/` — open range. Break anything.
- `workspace/projects/`, `src/`, `docs/`, `examples/`, config — shared. Changing
  these affects other people's frames, so say what you are about to change and
  why before doing it.
- `examples/` is PUBLIC. Nothing about a real product belongs in it.

> **You can break your own stuff, but you can't break other people's stuff.**

Default contributor is `ben` (see `studio.config.json`).

## Rule 6 — Keep these rules current

If you find yourself working around something this file gets wrong, or
discovering a convention it does not record, **update this file in the same
change**. Stale agent rules are the failure mode that quietly degrades
everything else. The same goes for briefs.

---

## Laws that hold on every route

**Real fonts, self-hosted.** A project's faces come from `@fontsource/*`,
imported at the top of its `tokens.css` as latin subsets. Self-hosted rather
than a Google CDN link, for two reasons: a prototype has to render offline, and
a published record has to be one file that opens anywhere — a CDN `@import`
breaks both. Install the package at the repo root and import it from the scope
that uses it; `publish` inlines the faces a record needs as data URIs and drops
the rest.

**Tokens.** No raw hex outside a token declaration — `npm run check:tokens`
enforces it. Studio chrome reads `src/index.css`; prototype content reads its
project's scope (`<root>/<project>/tokens.css`). A prototype must never read studio
tokens: if it can see `--panel`, the frame is lying about what the app looks
like. The one narrow exemption is a project's `data/`, for mock **content**
whose colour the real product derives at runtime — album artwork is the
worked example. It does not extend to chrome.

**The device is the frame.** Mobile work goes inside `<Phone>` from
`@/kit/device`. It supplies real logical dimensions, safe-area insets, the iOS
font stack and touch behaviour, so prototypes are honest by construction.
Available: `iphone-16` (393×852), `iphone-16-pro`, `iphone-16-pro-max`,
`iphone-se`, `ipad-mini`.

**Page furniture stays outside the screen.** Variant labels, mode switches,
replay controls — these go in `meta.note` or the canvas caption, never inside the
phone. A control rendered inside the screen reads as app UI, because that is what
the frame is for.

---

## Publishing back to a project

`npm run publish -- <canvas-id> --to ../<project>/design` renders a canvas to a
**self-contained HTML record** and writes it into that project's own repo.

```bash
npm run publish -- --list                       # what can be published
npm run publish -- <canvas-id> --to ../<project>/design
npm run publish -- <canvas-id> --to ../<project>/design --as proposals-d4
```

`--as` names the file. The target repo's convention wins over the canvas slug —
a project that numbers its design rounds should not have to adopt Studio's ids.

This is the seam, and it is deliberately thin: nothing is imported across the
boundary in either direction, so neither repo can break the other. Studio writes
an ordinary file into an ordinary repo; the loop closes on the other side, where
the pull request that lands that file is the ref you put in `exploration.json`
and Studio reads its state back through `gh`.

The record is **static**. Frames are rendered markup rather than screenshots —
diffable, and they scale with the reader's zoom — but the live prototypes are
interactive and none of that survives. The page says so; do not let a reader
discover it by tapping something inert.

Publish when an exploration reaches a decision worth keeping next to the code,
not on every change. **Check the target repo's push gate before you commit
there** — a project with a pre-push hook may run its full build and test suite
for a doc-only file, which is slow but is still its gate. Do not reach for
`--no-verify`; that is the repo owner's call, not yours. Regenerating overwrites the file, so the exploration in
Studio stays the source and the record stays a snapshot of it.

## Methods

On-demand playbooks in `docs/methods/`. Load one when the task matches; do not
load them all.

- `critique.md` — score a surface against its project's design language
- `explore.md` — generate divergent variants
- `handoff.md` — prepare an exploration for an engineer and their agent

---

## Running it

```bash
# One-time: clone the private content repo into workspace/
git clone <your-workspace-repo> workspace

npm run dev          # http://localhost:5177 (syncs activity first)
npm run build        # tsc -b && vite build — static, deployable as-is
npm run sync         # refresh git dates + PR state
npm run check:tokens # fails on raw hex outside a token declaration
```

**A canvas is one FEATURE's surface, and it is what you open.**

```
#/                 every project
#/p/<project>      every canvas in one project
#/c/<canvas>       one feature's canvas
```

The first two are indexes; only the last is a working surface. A project used
to be a single canvas holding every exploration, which does not survive a real
project — at six features it is a wall, and the thing you came for is somewhere
in it. A project's blueprints get their own canvas at `<project>/blueprints` so
they are reachable the same way without pretending to be an exploration.

This shape serves both workspace kinds: several independent projects, or one
product whose sub-areas are the projects.

**The canvas itself is infinite.** Pan by dragging, two-finger scroll, or
holding space; zoom with pinch or ⌘-scroll; ⌘0 fits. Frames render LIVE at true
size in world coordinates — a 393pt phone is 393 units wide — and the viewport
transform does all scaling, so type keeps its real ratios at every zoom.

Layout is generated from the content, not authored by hand
(`src/app/canvas/layout.ts`):

- Each **top-level section** is a column, left to right: blueprints, then one
  per exploration, then the brief.
- Inside an exploration, each **canvas.json section** is a sub-column, so a
  question's candidates read ACROSS rather than down. Stacking everything makes
  the board narrow and enormously tall, which drives fit to an illegible zoom.
- **Documents** sit on the canvas as compact objects and expand OVER it. Laying
  long prose out inline turns the canvas back into the document it replaced.
  Short annotation — a section note, an exploration's question, a canvas lede —
  stays inline, because that is caption, not document.
- Clicking a frame's **label** expands it; clicking INTO the phone reaches the
  prototype, which is live. Never wrap a frame in a button.

Do not add a fourth level. If something needs to be reachable, it belongs on a
canvas with a jump link in the sidebar — a jump pans and zooms to it rather
than navigating.

**Prototypes are live, so build them live.** A frame is a running React tree and
the canvas passes clicks through to it; a view whose controls do nothing is a
picture of a screen, which is the thing this repo exists to avoid. If the
product has locked an interaction, implement it as locked — `projects/ripe`'s
swipe-to-resolve is the worked example, with the drag driving the drain, the
exhale, the slip, and an undo that plays the whole thing backwards.

**Documents show their content.** A doc object on the canvas renders a real
excerpt, clipped with a fade. A one-line preview is the worst of both — it looks
like a document and delivers a caption, so the only way to get value is to open
it, and the object on the board becomes furniture.
