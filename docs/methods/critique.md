# Method — design critique

Score a surface against **its own project's** design language, not against
general taste.

## Inputs

- The view or canvas under critique.
- `../<project>/core-docs/design-language.md` — its axioms and principles. This
  is the rubric; do not substitute your own.

## Output shape

1. **One-line verdict.** The single most consequential thing that is wrong,
   stated as a claim rather than a hedge. If the surface is fine, say that.
2. **Principle by principle.** For each axiom or principle in the project's own
   document: what is working, where it breaks, and a rating. Cite the specific
   element, not the screen.
3. **Scorecard.** The ratings collected, so the shape of the problem is visible
   at a glance.
4. **How-might-we prompts.** Two to four, each pointed at a specific break found
   above — the input to `explore.md`, not a wish list.

## Rules

- Quote the axiom you are scoring against. A critique that cannot cite the rule
  it is applying is a preference.
- Distinguish *violates a stated rule* from *I would have done it differently*.
  Only the first is a finding.
- Do not propose UI in a critique. The prompts are the handoff.
