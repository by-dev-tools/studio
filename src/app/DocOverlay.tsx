import { Markdown } from './Markdown'
import { useDismiss } from './useDismiss'
import { useFlip, type Origin } from './useFlip'

/** A document expands OVER the canvas, out of the object that opened it. */
export function DocOverlay({
  label,
  markdown,
  origin,
  onClose,
}: {
  label: string
  markdown: string
  origin?: Origin
  onClose: () => void
}) {
  const { leaving, ready, dismiss } = useDismiss(onClose)
  const sheetRef = useFlip(origin, leaving)

  return (
    <div
      className={`ov${leaving ? ' is-leaving' : ''}${origin ? ' has-origin' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className="ov-scrim" onClick={dismiss} />
      <div className="ov-sheet" ref={sheetRef}>
        <div className="ov-bar">
          <span className="ov-title">{label}</span>
          <span className="sh-bar-spacer" />
          <button className="sh-ctl ov-close" onClick={dismiss} aria-label="Close (Esc)">
            Esc
          </button>
        </div>
        <div className="ov-doc">{ready && <Markdown>{markdown}</Markdown>}</div>
      </div>
    </div>
  )
}
