# delay-voice — exploration brief

Inherits the studio and Onward briefs.

## The question

When a train is late, what does the row say: the word, the revised time, or the
number of minutes?

## Constraints specific to this work

- **Test the no-update row in every variant.** Eastbourne is the case that
  decides this. A voice that reads beautifully for a known nine-minute delay is
  worth nothing if it makes the unknown case look like a number.
- **One number per row.** Showing both a scheduled and a revised time doubles
  what the eye has to reconcile at a glance, which is the one thing a departure
  board cannot afford.

## Out of scope

Push notifications, the detail screen after a tap, and how the delay is sourced.
Those follow the voice decision; they do not constrain it.
