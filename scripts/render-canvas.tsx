/**
 * SSR entry for `npm run publish`.
 *
 * Renders a canvas's frames to static markup so a published record contains the
 * actual screens, not screenshots of them — the markup stays diffable, scales
 * with the reader's zoom, and needs no committed image assets.
 *
 * The published artifact is STATIC. Prototypes here are live React, and none of
 * that survives; the record says so in as many words rather than letting a
 * reader discover it by tapping something that does nothing.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { BEZEL, DEVICES, Phone, type DeviceId } from '../src/kit/device'
import {
  canvasById,
  canvases,
  explorationById,
  projectById,
  viewById,
  type CanvasManifest,
} from '../src/registry'

export type RenderedFrame = {
  name: string
  caption?: string
  html: string
  width: number
  height: number
}

export type RenderedSection = { title?: string; note?: string; rows: RenderedFrame[][] }

export type RenderedCanvas = {
  id: string
  title: string
  lede?: string
  projectName: string
  projectId: string
  tokenScope?: string
  explorationTitle?: string
  question?: string
  who?: string
  brief?: string
  notes?: string
  sections: RenderedSection[]
}

export function listCanvases(): Array<{ id: string; title: string; project?: string }> {
  return canvases.map((c) => ({ id: c.id, title: c.title, project: c.project }))
}

export function renderCanvas(canvasId: string): RenderedCanvas {
  const canvas = canvasById(canvasId)
  if (!canvas) throw new Error(`No canvas "${canvasId}"`)

  const project = projectById(canvas.project ?? '')
  const parts = canvas.id.split('/')
  const exploration = parts.length >= 3 ? explorationById(parts.slice(0, 3).join('/')) : undefined

  return {
    id: canvas.id,
    title: canvas.title,
    lede: canvas.lede,
    projectId: project?.id ?? canvas.project ?? '',
    projectName: project?.name ?? canvas.project ?? '',
    tokenScope: project?.tokenScope,
    explorationTitle: exploration?.title,
    question: exploration?.question,
    who: exploration?.who,
    brief: exploration?.brief?.markdown,
    notes: exploration?.notes,
    sections: canvas.sections.map((section) => ({
      title: section.title,
      note: section.note,
      rows: section.rows.map((row) =>
        row.frames.map((f) => renderFrame(f.view, f.caption, f.mode, f.device, canvas, project)),
      ),
    })),
  }
}

function renderFrame(
  viewId: string,
  caption: string | undefined,
  mode: 'light' | 'dark' | undefined,
  device: DeviceId | undefined,
  canvas: CanvasManifest,
  project: ReturnType<typeof projectById>,
): RenderedFrame {
  const entry = viewById(viewId)
  if (!entry) {
    return { name: viewId, caption: 'missing view', html: '', width: 393, height: 852 }
  }
  const d: DeviceId = device ?? entry.meta.device ?? canvas.device ?? project?.device ?? 'iphone-16'
  const m = mode ?? entry.meta.mode ?? canvas.mode ?? project?.defaultMode ?? 'light'
  const preset = DEVICES[d]

  const html = renderToStaticMarkup(
    createElement(
      Phone,
      { device: d, mode: m, screenClassName: project?.tokenScope },
      createElement(entry.Component),
    ),
  )

  return {
    name: entry.meta.name,
    caption: caption ?? entry.meta.note,
    html,
    width: preset.width + BEZEL * 2,
    height: preset.height + BEZEL * 2,
  }
}
