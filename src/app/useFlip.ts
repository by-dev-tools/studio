import { useEffect, useRef } from 'react'

export type Origin = { x: number; y: number; w: number; h: number }

const IN_MS = 260
const OUT_MS = 190
const EASE = 'cubic-bezier(0.22, 0.9, 0.24, 1)'

function reduced(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Grow an overlay OUT OF the thing that opened it, and collapse it back.
 *
 * A panel that fades in from nowhere tells you a panel appeared. A panel that
 * expands from the card you just clicked tells you *that card* is what you are
 * now looking at, and where it will go when you close it — which is the whole
 * job of the transition. The body is mounted a frame late (see useDismiss), so
 * the panel is near-empty while it scales and the distortion never shows.
 */
export function useFlip(origin: Origin | undefined, leaving: boolean) {
  const ref = useRef<HTMLDivElement | null>(null)
  const played = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || !origin || played.current || reduced()) return
    played.current = true
    const to = el.getBoundingClientRect()
    if (to.width === 0 || to.height === 0) return
    el.animate([{ transform: invert(origin, to), opacity: 0.6 }, { transform: 'none', opacity: 1 }], {
      duration: IN_MS,
      easing: EASE,
      fill: 'both',
    })
  }, [origin])

  useEffect(() => {
    const el = ref.current
    if (!el || !leaving || !origin || reduced()) return
    const from = el.getBoundingClientRect()
    el.animate([{ transform: 'none', opacity: 1 }, { transform: invert(origin, from), opacity: 0.4 }], {
      duration: OUT_MS,
      easing: EASE,
      fill: 'both',
    })
  }, [leaving, origin])

  return ref
}

/**
 * The transform that places `to` roughly over `from`.
 *
 * Deliberately a UNIFORM scale, taken from the width. A true FLIP scales each
 * axis independently, and when the origin and the panel have very different
 * proportions — a 104×33 card growing into a 500×830 sheet — that reads as the
 * panel being squashed and stretched rather than moving. Matching width and
 * keeping the centres aligned still says "it came from there", without the skew.
 */
function invert(from: Origin, to: DOMRect): string {
  const s = Math.min(1, Math.max(0.04, from.w / to.width))
  const dx = from.x + from.w / 2 - (to.left + to.width / 2)
  const dy = from.y + from.h / 2 - (to.top + to.height / 2)
  return `translate(${dx}px, ${dy}px) scale(${s})`
}

/** Capture an element's viewport rect as a transition origin. */
export function originOf(el: Element): Origin {
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
}
