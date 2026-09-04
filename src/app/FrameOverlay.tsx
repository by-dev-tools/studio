import { useState } from 'react'
import { DEVICES, Phone, type DeviceId } from '../kit/device'
import { projectById, viewById } from '../registry'
import { useFitScale } from './useFitScale'
import { useDismiss } from './useDismiss'
import { useFlip, type Origin } from './useFlip'

/**
 * A frame expanded over the canvas.
 *
 * No zoom control: a prototype is being judged, so it renders at 1:1 whenever
 * the window allows and shrinks only as far as it must to fit. Offering 75% and
 * 50% here would invite reviewing type at a size it will never ship at.
 */
export function FrameOverlay({
  id,
  origin,
  onClose,
}: {
  id: string
  origin?: Origin
  onClose: () => void
}) {
  const entry = viewById(id)
  const project = entry ? projectById(entry.project) : undefined
  const device: DeviceId = entry?.meta.device ?? project?.device ?? 'iphone-16'

  const [mode, setMode] = useState<'light' | 'dark'>(
    entry?.meta.mode ?? project?.defaultMode ?? 'light',
  )
  const scale = useFitScale(DEVICES[device].height, 190)
  const { leaving, ready, dismiss } = useDismiss(onClose)
  const panelRef = useFlip(origin, leaving)

  if (!entry) return null
  const { Component } = entry

  return (
    <div
      className={`ov${leaving ? ' is-leaving' : ''}${origin ? ' has-origin' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={entry.meta.name}
    >
      <div className="ov-scrim" onClick={dismiss} />
      <div className="ov-panel" ref={panelRef}>
        <div className="ov-bar">
          <span className="ov-title">{entry.meta.name}</span>
          <span className="sh-bar-slug">{entry.id}</span>
          <span className="sh-bar-spacer" />
          {scale < 1 && <span className="sh-bar-slug">{Math.round(scale * 100)}%</span>}
          <button
            className="sh-ctl"
            aria-pressed={mode === 'dark'}
            onClick={() => setMode((m) => (m === 'light' ? 'dark' : 'light'))}
          >
            {mode === 'light' ? 'Light' : 'Dark'}
          </button>
          <button className="sh-ctl ov-close" onClick={dismiss} aria-label="Close (Esc)">
            Esc
          </button>
        </div>

        <div className="ov-stage">
          {ready && (
            <Phone
              device={device}
              mode={mode}
              scale={scale}
              screenClassName={project?.tokenScope}
              label={entry.meta.note}
            >
              <Component />
            </Phone>
          )}
        </div>
      </div>
    </div>
  )
}
