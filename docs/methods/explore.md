# Method — divergent exploration

Generating five variants immediately is the fast way to five variants of the
same idea. The order below costs one extra round trip and is the difference
between exploring and decorating.

## 1. Ask before generating

Do not start until these are settled. Ask the human; do not assume.

- **How many** variants — a number, not "a few".
- **What varies** — most usefully, each variant is a different *structural bet*,
  not a restyle of one layout.
- **Scope** — which surface, and how much surrounding context is needed to judge
  it. A filter redesign shown without the results it filters is unjudgeable.
- **Where it lands** — usually a new section on an existing canvas.

## 2. Describe the approaches in text first

Before any UI: name each bet in a sentence or two and what it costs. Text is far
faster to read than a rendered screen, and a bet that is directionally wrong is
obvious in prose. Get agreement on the set, then build.

## 3. Ground it in the project's own language

Read `../<project>/core-docs/design-language.md`. If a variant violates a stated
axiom, that is either a bug in the variant or an argument to amend the axiom —
say which. Never silently break one.

## 4. Build at the fidelity that matches the question

Low fidelity is a first-class answer, not a rough draft. Use it when the question
is structural — where things go, what the surface is *for*. Reach for production
fidelity only when the question is about the surface's finish, because
almost-but-not-quite production fidelity reads as a promise the prototype is not
making.

## 5. Say what each variant costs

Every frame's `meta.note` should carry the tradeoff, not a description. "Filters
in a left panel" describes; "a left panel is a hard pass from engineering" is
the note worth writing down.

## 6. Include the cases that bend it

Every design reads well on its best case. Add frames for the ones that decide
it: the empty case, the several-at-once case, the failure case. That is usually
where the choice actually gets made.
