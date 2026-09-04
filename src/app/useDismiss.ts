import { useCallback, useEffect, useState } from 'react'

const EXIT_MS = 180

function reduced(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Overlay enter/exit, plus a deferred mount for the contents.
 *
 * `ready` is the important part. An overlay whose body is a live prototype (or
 * a freshly parsed markdown document) does a lot of synchronous work the moment
 * it mounts, and that work lands on exactly the frames the dimmer needs to
 * animate — so the fade stutters and the whole thing reads as a jump cut.
 * Painting the scrim and the panel first, then mounting the body one frame
 * later, keeps the transition smooth and costs nothing perceptible.
 */
export function useDismiss(onClose: () => void) {
  const [leaving, setLeaving] = useState(false)
  const [ready, setReady] = useState(reduced())

  useEffect(() => {
    if (ready) return
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
    return () => cancelAnimationFrame(id)
  }, [ready])

  const dismiss = useCallback(() => {
    if (reduced()) {
      onClose()
      return
    }
    setLeaving(true)
    window.setTimeout(onClose, EXIT_MS)
  }, [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismiss()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dismiss])

  return { leaving, ready, dismiss }
}
