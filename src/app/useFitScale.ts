import { useEffect, useState } from 'react'

/**
 * A 393×852pt phone is taller than most laptop viewports. Rather than make the
 * page scroll to see a whole frame, fit it — and recompute on resize.
 * `chrome` is the vertical space the studio bar and stage padding occupy.
 */
export function useFitScale(deviceHeight: number, chrome = 150): number {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const compute = () => {
      const available = window.innerHeight - chrome
      // Never scale up past 1:1 — a phone rendered larger than life is a lie
      // about how big the type is.
      setScale(Math.min(1, Math.max(0.4, available / deviceHeight)))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [deviceHeight, chrome])

  return scale
}
