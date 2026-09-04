import { useCallback, useEffect, useRef, useState } from 'react'

export type Viewport = { x: number; y: number; z: number }
export type Rect = { x: number; y: number; w: number; h: number }

const MIN_Z = 0.04
const MAX_Z = 2
/** Fitting never zooms past 1:1 — a phone larger than life lies about type size. */
const MAX_FIT_Z = 1
/** Below this, "fit" stops being useful and becomes a picture of a board. */
const MIN_READABLE_Z = 0.26

/**
 * Pan/zoom for an infinite canvas.
 *
 * Trackpad conventions, matching Figma: two-finger scroll pans, pinch (which
 * the browser reports as ctrl+wheel) zooms at the cursor, and dragging empty
 * space pans. Zoom is anchored to the pointer so the thing under the cursor
 * stays under the cursor — anchoring to the centre instead is the single
 * fastest way to make a canvas feel wrong.
 */
export function useViewport(getBounds: () => Rect | null) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [vp, setVp] = useState<Viewport>({ x: 0, y: 0, z: 0.4 })
  const [panning, setPanning] = useState(false)
  const vpRef = useRef(vp)
  vpRef.current = vp

  /**
   * Jumps are ANIMATED. Teleporting to a container loses the relationship
   * between where you were and where you landed, which on an infinite plane is
   * the only thing keeping you oriented. Direct pan and zoom stay instant —
   * those track the hand and must not lag it.
   */
  const anim = useRef<number | null>(null)

  const stopAnimation = useCallback(() => {
    if (anim.current !== null) {
      cancelAnimationFrame(anim.current)
      anim.current = null
    }
  }, [])

  const animateTo = useCallback(
    (to: Viewport) => {
      stopAnimation()
      if (prefersReducedMotion()) {
        setVp(to)
        return
      }
      const from = vpRef.current
      const dur = 420
      const t0 = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur)
        const k = easeInOutCubic(t)
        setVp({
          x: from.x + (to.x - from.x) * k,
          y: from.y + (to.y - from.y) * k,
          // Interpolate zoom geometrically — linear zoom reads as a lurch,
          // because equal steps of scale are not equal steps of perceived size.
          z: from.z * Math.pow(to.z / from.z, k),
        })
        anim.current = t < 1 ? requestAnimationFrame(step) : null
      }
      anim.current = requestAnimationFrame(step)
    },
    [stopAnimation],
  )

  useEffect(() => stopAnimation, [stopAnimation])

  /**
   * Fit everything — but never below a zoom where the board is still readable.
   *
   * A wide board in a narrow window fits at 8%, which shows you the shape of
   * something you cannot read. Past MIN_READABLE_Z it is better to open at a
   * usable zoom anchored to the top-left corner and let the person pan: seeing
   * everything is only worth it while "everything" is still legible.
   */
  const fit = useCallback(() => {
    const el = ref.current
    const b = getBounds()
    if (!el || !b || b.w <= 0 || b.h <= 0) return

    const pad = 72
    const ideal = Math.min(
      MAX_FIT_Z,
      Math.min((el.clientWidth - pad * 2) / b.w, (el.clientHeight - pad * 2) / b.h),
    )

    if (ideal >= MIN_READABLE_Z) {
      animateTo({
        z: ideal,
        x: el.clientWidth / 2 - (b.x + b.w / 2) * ideal,
        y: el.clientHeight / 2 - (b.y + b.h / 2) * ideal,
      })
      return
    }

    const z = MIN_READABLE_Z
    animateTo({ z, x: pad - b.x * z, y: pad - b.y * z })
  }, [getBounds, animateTo])

  /** Bring a world rect into view — used by the sidebar's jump links. */
  const focus = useCallback(
    (r: Rect) => {
      const el = ref.current
      if (!el) return
      const pad = 70
      const z = Math.max(
        MIN_Z,
        Math.min(MAX_FIT_Z, Math.min((el.clientWidth - pad * 2) / r.w, (el.clientHeight - pad * 2) / r.h)),
      )
      animateTo({
        z,
        x: el.clientWidth / 2 - (r.x + r.w / 2) * z,
        y: el.clientHeight / 2 - (r.y + r.h / 2) * z,
      })
    },
    [animateTo],
  )

  const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
    setVp((v) => {
      const z = Math.max(MIN_Z, Math.min(MAX_Z, v.z * factor))
      const k = z / v.z
      return { z, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k }
    })
  }, [])

  const zoomBy = useCallback(
    (factor: number) => {
      const el = ref.current
      if (!el) return
      zoomAt(factor, el.clientWidth / 2, el.clientHeight / 2)
    },
    [zoomAt],
  )

  const zoomToScale = useCallback((z: number) => {
    const el = ref.current
    if (!el) return
    setVp((v) => {
      const cx = el.clientWidth / 2
      const cy = el.clientHeight / 2
      const k = z / v.z
      return { z, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k }
    })
  }, [])

  // Wheel must be a native non-passive listener; React's synthetic wheel is
  // passive, so preventDefault there is ignored and the page scrolls instead.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      stopAnimation()
      if (e.ctrlKey || e.metaKey) {
        const rect = el.getBoundingClientRect()
        zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - rect.left, e.clientY - rect.top)
      } else {
        setVp((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomAt, stopAnimation])

  // Space-drag pans anywhere, including over a live prototype — dragging on the
  // background alone is not enough once frames fill the screen.
  const spaceRef = useRef(false)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTyping(e.target)) {
        spaceRef.current = true
        document.body.classList.add('canvas-grab')
        e.preventDefault()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault()
        fit()
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceRef.current = false
        document.body.classList.remove('canvas-grab')
      }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      document.body.classList.remove('canvas-grab')
    }
  }, [fit])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Panning is the DEFAULT gesture. Only live prototypes and selectable
    // prose opt out, because a drag on those means something else there.
    const protectedTarget = (e.target as HTMLElement).closest('[data-nopan]') !== null
    const middle = e.button === 1
    if (protectedTarget && !spaceRef.current && !middle) return

    e.preventDefault()
    stopAnimation()
    const start = { px: e.clientX, py: e.clientY, ...vpRef.current }
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    setPanning(true)

    const move = (ev: PointerEvent) => {
      setVp({ z: start.z, x: start.x + (ev.clientX - start.px), y: start.y + (ev.clientY - start.py) })
    }
    const done = () => {
      setPanning(false)
      el.releasePointerCapture(e.pointerId)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', done)
      el.removeEventListener('pointercancel', done)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', done)
    el.addEventListener('pointercancel', done)
  }, [stopAnimation])

  return { ref, vp, panning, fit, focus, zoomBy, zoomToScale, onPointerDown }
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}
