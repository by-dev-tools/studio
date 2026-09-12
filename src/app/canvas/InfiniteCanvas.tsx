import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Phone } from '../../kit/device'
import { ExplorationMetaLine } from '../Meta'
import { viewById } from '../../registry'
import { Markdown } from '../Markdown'
import { buildLayout, type Placed } from './layout'
import { useViewport } from './useViewport'
import { originOf, type Origin } from '../useFlip'

/**
 * The canvas is the base surface. Prototypes render LIVE and inline at true
 * size; documents sit on it as compact objects and expand over it.
 */
export function InfiniteCanvas({
  canvasId,
  onOpenFrame,
  onOpenDoc,
}: {
  canvasId: string
  onOpenFrame: (viewId: string, origin: Origin) => void
  onOpenDoc: (label: string, markdown: string, origin: Origin) => void
}) {
  const layout = useMemo(() => buildLayout(canvasId), [canvasId])
  const getBounds = useCallback(() => layout.bounds, [layout])
  const { ref, vp, panning, fit, zoomBy, onPointerDown } = useViewport(getBounds)

  /** Bumping a frame's key remounts it, returning the prototype to step zero. */
  const [resets, setResets] = useState<Record<string, number>>({})
  const resetFrame = (id: string) => setResets((r) => ({ ...r, [id]: (r[id] ?? 0) + 1 }))

  /**
   * Fit once the viewport actually HAS a size. Fitting on mount is a race: the
   * flex child can still be 0×0 on the first frame, and fitting against a zero
   * height clamps straight to the minimum zoom.
   */
  const fitted = useRef<string | null>(null)
  useEffect(() => {
    fitted.current = null
  }, [canvasId])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const maybeFit = () => {
      if (fitted.current === canvasId) return
      if (el.clientWidth < 40 || el.clientHeight < 40) return
      fitted.current = canvasId
      fit()
    }
    maybeFit()
    const ro = new ResizeObserver(maybeFit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [canvasId, fit, ref])

  return (
    <div
      ref={ref}
      className={`cv-viewport${panning ? ' is-panning' : ''}`}
      onPointerDown={onPointerDown}
    >
      <div
        className="cv-world"
        style={{ transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.z})` }}
      >
        {layout.items.map((item) => (
          <Item
            key={item.id}
            item={item}
            zoom={vp.z}
            resetKey={resets[item.id] ?? 0}
            onReset={() => resetFrame(item.id)}
            onOpenFrame={onOpenFrame}
            onOpenDoc={onOpenDoc}
          />
        ))}
      </div>

      <div className="cv-hud">
        <button className="hud-btn" onClick={() => zoomBy(1 / 1.25)} aria-label="Zoom out">
          −
        </button>
        <button className="hud-btn hud-fit" onClick={fit} title="Fit (⌘0)">
          {Math.round(vp.z * 100)}%
        </button>
        <button className="hud-btn" onClick={() => zoomBy(1.25)} aria-label="Zoom in">
          +
        </button>
      </div>
    </div>
  )
}

function Item({
  item,
  zoom,
  resetKey,
  onReset,
  onOpenFrame,
  onOpenDoc,
}: {
  item: Placed
  zoom: number
  resetKey: number
  onReset: () => void
  onOpenFrame: (viewId: string, origin: Origin) => void
  onOpenDoc: (label: string, markdown: string, origin: Origin) => void
}) {
  const style = {
    left: item.rect.x,
    top: item.rect.y,
    width: item.rect.w,
  } as React.CSSProperties

  if (item.kind === 'title') {
    return (
      <div className="cvi cvi-title" style={style}>
        <h1>{item.text}</h1>
        {item.note && <p>{item.note}</p>}
      </div>
    )
  }

  if (item.kind === 'divider') {
    return (
      <div className="cvi cvi-divider" style={style}>
        <span>{item.text}</span>
      </div>
    )
  }

  if (item.kind === 'container') {
    return (
      <section
        className="cvi cvi-box"
        style={{ ...style, height: item.rect.h }}
        data-level={item.level}
        data-past={item.past ? '' : undefined}
        id={`box-${item.id}`}
      >
        <header className="cvi-box-head" style={{ minHeight: item.headH }}>
          <h2 className="cvi-box-title">
            {item.eyebrow && <span className="cvi-box-eyebrow">{item.eyebrow} /</span>}
            {item.title}
          </h2>
          {item.exploration && (
            <div className="cvi-box-meta">
              <ExplorationMetaLine exploration={item.exploration} />
            </div>
          )}
          {item.note && <p className="cvi-box-note">{item.note}</p>}
        </header>
      </section>
    )
  }

  if (item.kind === 'empty') {
    return (
      <div className="cvi cvi-empty" style={{ ...style, height: item.rect.h }}>
        {item.text}
      </div>
    )
  }

  if (item.kind === 'doc') {
    return (
      <button
        className="cvi cvi-doc"
        style={{ ...style, height: item.rect.h }}
        data-nopan
        onClick={(e) => onOpenDoc(item.label, item.markdown, originOf(e.currentTarget))}
      >
        <span className="cvi-doc-label">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M4 2.5h6.5L13 5v8.5H4z" strokeLinejoin="round" />
            <path d="M6 7h5M6 9.5h5" strokeLinecap="round" />
          </svg>
          {item.label}
        </span>

        {/* A real excerpt, rendered — headings, emphasis and all — clipped with
            a fade rather than an ellipsis, so it reads as a page continuing
            rather than a string that was cut. */}
        <span className="cvi-doc-body">
          <Markdown>{excerpt(item.markdown)}</Markdown>
        </span>
        <span className="cvi-doc-more">Open</span>
      </button>
    )
  }

  const entry = viewById(item.viewId)
  if (!entry) return null
  const { Component } = entry

  return (
    <figure className="cvi cvi-frame" style={style} data-nopan id={`box-${item.id}`}>
      {/* Frames are LIVE, not pictures of screens — clicking into the phone
          drives the prototype. So the controls live above it: the name expands,
          and reset remounts the component back to this step's default state. */}
      <div className="cvi-frame-bar">
        <button
          className="cvi-frame-label"
          onClick={(e) =>
            onOpenFrame(
              item.viewId,
              // Grow from the PHONE, not the label — the phone is the thing
              // being expanded, so that is where the eye expects it to come from.
              originOf(e.currentTarget.closest('.cvi-frame')?.querySelector('.sd-device') ?? e.currentTarget),
            )
          }
        >
          {item.name}
          <span className="cvi-expand" aria-hidden>⤢</span>
        </button>
        <button className="cvi-frame-reset" onClick={onReset} title="Reset to default state">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M13 8a5 5 0 1 1-1.6-3.7" />
            <path d="M13 2.4V5h-2.6" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <Phone
        key={resetKey}
        device={item.device}
        mode={item.mode ?? 'light'}
        screenClassName={item.tokenScope}
      >
        <Component />
      </Phone>

      {/* Captions counter-scale so they stay readable when zoomed out — the
          frame is what is being judged at true size, not its label. */}
      {item.caption && (
        <figcaption
          className="cvi-frame-cap"
          style={{ fontSize: `${Math.min(19, 13 / Math.max(zoom, 0.12))}px` }}
        >
          {item.caption}
        </figcaption>
      )}
    </figure>
  )
}

/**
 * Enough of the document to be worth reading, and no more.
 *
 * Cut at a line boundary rather than a character count so a heading is never
 * sliced in half, and drop the top-level title — the card already carries it,
 * and repeating it wastes the first and most visible line.
 */
function excerpt(md: string, maxLines = 26): string {
  const lines = md.split('\n')
  const start = lines.findIndex((l) => l.trim() && !l.startsWith('# '))
  const body = lines.slice(start === -1 ? 0 : start)

  const out: string[] = []
  for (const line of body) {
    if (out.length >= maxLines) break
    out.push(line)
  }
  return out.join('\n')
}
