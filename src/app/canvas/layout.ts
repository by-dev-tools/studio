import { DEVICES, outerSize, type DeviceId } from '../../kit/device'
import {
  blueprintsFor,
  liveExplorations,
  pastExplorations,
  projectById,
  projectSummary,
  type CanvasManifest,
  type Exploration,
  type ViewEntry,
} from '../../registry'
import type { Rect } from './useViewport'

/**
 * World-space layout.
 *
 * Two rules shape everything here:
 *
 * 1. Frames sit at TRUE size — a 393pt phone is 393 units wide — and the
 *    viewport transform does all scaling, so type keeps its real ratios at
 *    every zoom.
 * 2. Nothing floats loose. Every frame, document and annotation lives inside a
 *    CONTAINER, the way a Figma section bounds its contents. Loose objects on
 *    an infinite plane have no edges to read against, so grouping has to be
 *    inferred from proximity — which stops working the moment a board grows.
 */

const PAD = 52
const GAP_X = 64
const GAP_Y = 76
const SUB_GAP = 72
const COLUMN_GAP = 180
/**
 * Width budget before a new shelf starts, in world units. Roughly four phone
 * frames plus their gutters — wide enough that a three-candidate question stays
 * on one shelf, narrow enough that the board never becomes a corridor.
 */
const MAX_ROW_W = 5200
const SHELF_GAP = 320
const CAPTION_H = 96
const TITLE_H = 58
const META_H = 38
const DOC_CARD_W = 400
const DOC_CARD_H = 128

export type Placed =
  | {
      kind: 'container'
      id: string
      rect: Rect
      title: string
      eyebrow?: string
      note?: string
      exploration?: Exploration
      level: 1 | 2
      headH: number
    }
  | {
      kind: 'frame'
      id: string
      rect: Rect
      viewId: string
      name: string
      caption?: string
      mode?: 'light' | 'dark'
      device: DeviceId
      tokenScope?: string
    }
  | { kind: 'doc'; id: string; rect: Rect; markdown: string; label: string }
  | { kind: 'empty'; id: string; rect: Rect; text: string }
  | { kind: 'title'; id: string; rect: Rect; text: string; note?: string }

/** The navigable tree the sidebar renders. Every node can be focused. */
export type Node = {
  id: string
  label: string
  kind: 'container' | 'frame' | 'doc'
  rect: Rect
  children?: Node[]
}

export type Layout = { items: Placed[]; tree: Node[]; bounds: Rect }

/** A subtree in local coordinates, measured. */
type Built = { items: Placed[]; nodes: Node[]; w: number; h: number }

function shift(b: Built, dx: number, dy: number): Built {
  return {
    w: b.w,
    h: b.h,
    items: b.items.map((it) => ({ ...it, rect: { ...it.rect, x: it.rect.x + dx, y: it.rect.y + dy } })),
    nodes: b.nodes.map((n) => shiftNode(n, dx, dy)),
  }
}

function shiftNode(n: Node, dx: number, dy: number): Node {
  return {
    ...n,
    rect: { ...n.rect, x: n.rect.x + dx, y: n.rect.y + dy },
    children: n.children?.map((c) => shiftNode(c, dx, dy)),
  }
}

/** Stack built pieces vertically, left-aligned. */
function stack(pieces: Built[], gap: number): Built {
  const items: Placed[] = []
  const nodes: Node[] = []
  let y = 0
  let w = 0
  for (const p of pieces) {
    if (p.h === 0 && p.items.length === 0) continue
    const s = shift(p, 0, y)
    items.push(...s.items)
    nodes.push(...s.nodes)
    y += p.h + gap
    w = Math.max(w, p.w)
  }
  return { items, nodes, w, h: Math.max(0, y - gap) }
}

/**
 * Pack columns into shelves rather than one unbounded strip.
 *
 * Left-to-right forever means the board grows without limit in one dimension:
 * fine at two explorations, a long scroll right at ten, and "fit" degrades to
 * an illegible zoom because it is bound by a width nothing else uses. Wrapping
 * at a width budget keeps the board roughly square, which is the shape a
 * viewport can actually show.
 *
 * A shelf's height is its tallest column, so short columns leave space beneath
 * them. That is deliberate — the alternative is masonry packing, where adding
 * one exploration silently rearranges every other one and you lose the board
 * you had learned.
 */
function packColumns(columns: Built[]): Built {
  const items: Placed[] = []
  const nodes: Node[] = []
  let x = 0
  let y = 0
  let shelfH = 0
  let widest = 0

  for (const col of columns) {
    // Always place at least one column per shelf, however wide it is.
    if (x > 0 && x + col.w > MAX_ROW_W) {
      y += shelfH + SHELF_GAP
      x = 0
      shelfH = 0
    }
    const s = shift(col, x, y)
    items.push(...s.items)
    nodes.push(...s.nodes)
    x += col.w + COLUMN_GAP
    shelfH = Math.max(shelfH, col.h)
    widest = Math.max(widest, x - COLUMN_GAP)
  }

  return { items, nodes, w: widest, h: y + shelfH }
}

/** Lay pieces left to right, top-aligned. */
function rowOf(pieces: Built[], gap: number): Built {
  const items: Placed[] = []
  const nodes: Node[] = []
  let x = 0
  let h = 0
  for (const p of pieces) {
    const s = shift(p, x, 0)
    items.push(...s.items)
    nodes.push(...s.nodes)
    x += p.w + gap
    h = Math.max(h, p.h)
  }
  return { items, nodes, w: Math.max(0, x - gap), h }
}

/**
 * Wrap a subtree in a titled container. The header lives INSIDE the bounds so
 * the title and the things it names cannot drift apart when the board is panned.
 */
function container(
  opts: {
    id: string
    title: string
    eyebrow?: string
    note?: string
    exploration?: Exploration
    level: 1 | 2
  },
  body: Built,
): Built {
  const headH =
    TITLE_H + (opts.exploration ? META_H : 0) + (opts.note ? annotationHeight(opts.note, 1.5) : 0) + 22
  const w = Math.max(body.w, 420) + PAD * 2
  const h = headH + body.h + PAD

  const inner = shift(body, PAD, headH)
  const rect = { x: 0, y: 0, w, h }

  return {
    w,
    h,
    items: [
      {
        kind: 'container',
        id: opts.id,
        rect,
        title: opts.title,
        eyebrow: opts.eyebrow,
        note: opts.note,
        exploration: opts.exploration,
        level: opts.level,
        headH,
      },
      ...inner.items,
    ],
    nodes: [
      {
        id: opts.id,
        label: opts.title,
        kind: 'container',
        rect,
        children: inner.nodes,
      },
    ],
  }
}

// --- leaves ------------------------------------------------------------------

type Slot =
  | {
      view: ViewEntry
      device: DeviceId
      mode?: 'light' | 'dark'
      caption?: string
      tokenScope?: string
    }
  | { missing: string }

function frame(slot: Slot, key: string): Built {
  if ('missing' in slot) {
    const rect = { x: 0, y: 0, w: 393, h: 852 + CAPTION_H }
    return {
      w: rect.w,
      h: rect.h,
      items: [{ kind: 'empty', id: `m-${key}`, rect, text: `missing view: ${slot.missing}` }],
      nodes: [],
    }
  }
  const outer = outerSize(DEVICES[slot.device])
  const rect = { x: 0, y: 0, w: outer.width, h: outer.height + CAPTION_H }
  const id = `f-${key}`
  return {
    w: rect.w,
    h: rect.h,
    items: [
      {
        kind: 'frame',
        id,
        rect,
        viewId: slot.view.id,
        name: slot.view.meta.name,
        caption: slot.caption ?? slot.view.meta.note,
        mode: slot.mode,
        device: slot.device,
        tokenScope: slot.tokenScope,
      },
    ],
    nodes: [{ id, label: slot.view.meta.name, kind: 'frame', rect }],
  }
}

function docCard(id: string, label: string, markdown: string): Built {
  const rect = { x: 0, y: 0, w: DOC_CARD_W, h: DOC_CARD_H }
  return {
    w: rect.w,
    h: rect.h,
    items: [{ kind: 'doc', id, rect, markdown, label }],
    nodes: [{ id, label, kind: 'doc', rect }],
  }
}

function emptyNote(id: string, text: string, w = 520): Built {
  const h = annotationHeight(text, 1.6, w)
  return { w, h, items: [{ kind: 'empty', id, rect: { x: 0, y: 0, w, h }, text }], nodes: [] }
}

// --- the board ---------------------------------------------------------------

export function buildLayout(projectId: string): Layout {
  const project = projectById(projectId)
  const { brief } = projectSummary(projectId)

  const columns: Built[] = []
  columns.push(blueprintSection(projectId, project))
  for (const e of [...liveExplorations(projectId), ...pastExplorations(projectId)]) {
    columns.push(explorationSection(e, projectId, project))
  }
  columns.push(briefSection(projectId, brief?.markdown))

  const board = packColumns(columns)

  // The board's name sits above the strip — the only object outside a
  // container, because it names the board rather than living on it.
  const items: Placed[] = [
    {
      kind: 'title',
      id: 'board-title',
      rect: { x: 0, y: -130, w: 1200, h: 100 },
      text: project?.name ?? projectId,
      note: project?.tagline,
    },
    ...board.items,
  ]

  return { items, tree: board.nodes, bounds: boundsOf(items) }
}

function deviceFor(
  v: ViewEntry,
  project: ReturnType<typeof projectById>,
  canvas?: CanvasManifest,
  override?: DeviceId,
): DeviceId {
  return override ?? v.meta.device ?? canvas?.device ?? project?.device ?? 'iphone-16'
}

function blueprintSection(projectId: string, project: ReturnType<typeof projectById>): Built {
  const blueprints = blueprintsFor(projectId)
  const body =
    blueprints.length === 0
      ? emptyNote(
          'e-blueprints',
          `Nothing ported from ${project?.sourceRepo ?? 'the source repo'} yet.`,
        )
      : rowOf(
          blueprints.map((v) =>
            frame(
              {
                view: v,
                device: deviceFor(v, project),
                mode: v.meta.mode ?? project?.defaultMode,
                tokenScope: project?.tokenScope,
              },
              v.id,
            ),
          ),
          GAP_X,
        )

  return container({ id: 's-blueprints', title: 'Blueprints', level: 1 }, body)
}

function explorationSection(
  e: Exploration,
  projectId: string,
  project: ReturnType<typeof projectById>,
): Built {
  const blueprints = blueprintsFor(projectId)
  const placed = new Set<string>()
  const parts: Built[] = []

  for (const canvas of e.canvases) {
    // Each canvas section is its own container, laid left to right — a
    // question's candidates read ACROSS. Stacking them makes the board narrow
    // and enormously tall, which drives fit to an illegible zoom.
    const subs = canvas.sections.map((section, si) => {
      const rows = section.rows.map((row, ri) =>
        rowOf(
          row.frames.map((f, fi) => {
            placed.add(f.view)
            const v = e.views.find((x) => x.id === f.view) ?? blueprints.find((x) => x.id === f.view)
            return frame(
              v
                ? {
                    view: v,
                    device: deviceFor(v, project, canvas, f.device),
                    mode: f.mode ?? v.meta.mode ?? canvas.mode ?? project?.defaultMode,
                    caption: f.caption,
                    tokenScope: project?.tokenScope,
                  }
                : { missing: f.view },
              `${canvas.id}-${si}-${ri}-${fi}`,
            )
          }),
          GAP_X,
        ),
      )
      return container(
        {
          id: `${canvas.id}-s${si}`,
          title: section.title ?? `Section ${si + 1}`,
          note: section.note,
          level: 2,
        },
        stack(rows, GAP_Y),
      )
    })
    parts.push(rowOf(subs, SUB_GAP))
  }

  const loose = e.views.filter((v) => !placed.has(v.id))
  if (loose.length > 0) {
    parts.push(
      container(
        { id: `${e.id}-loose`, title: 'Other frames', level: 2 },
        rowOf(
          loose.map((v) =>
            frame(
              {
                view: v,
                device: deviceFor(v, project),
                mode: v.meta.mode ?? project?.defaultMode,
                tokenScope: project?.tokenScope,
              },
              v.id,
            ),
          ),
          GAP_X,
        ),
      ),
    )
  }

  const docs = ([['Brief', e.brief?.markdown], ['Notes', e.notes]] as const).filter(([, md]) =>
    Boolean(md),
  )
  if (docs.length > 0) {
    parts.push(
      container(
        { id: `${e.id}-docs`, title: 'Writing', level: 2 },
        rowOf(
          docs.map(([label, md]) => docCard(`${e.id}-${label}`, label, md!)),
          GAP_X,
        ),
      ),
    )
  }

  const lede = e.canvases.find((c) => c.lede)?.lede

  return container(
    {
      id: `s-${e.slug}`,
      title: e.title,
      eyebrow: e.who,
      note: [e.question, lede].filter(Boolean).join('\n\n'),
      exploration: e,
      level: 1,
    },
    stack(parts.length > 0 ? parts : [emptyNote(`${e.id}-empty`, 'No frames yet.')], SUB_GAP),
  )
}

function briefSection(projectId: string, markdown?: string): Built {
  const body = markdown
    ? docCard('d-brief', 'Project brief', markdown)
    : emptyNote(
        'e-brief',
        `No project brief. Add projects/${projectId}/brief.md — it is the first thing read before any exploration here.`,
      )
  return container({ id: 's-brief', title: 'Brief', level: 1 }, body)
}

// --- measurement -------------------------------------------------------------

/** Rough prose height, so a container reserves plausible space before render. */
function annotationHeight(text: string, lineHeight = 1.6, width = 760): number {
  const charsPerLine = Math.max(20, Math.floor(width / 9.4))
  const lines = text
    .split('\n')
    .reduce((n, line) => n + Math.max(1, Math.ceil(line.length / charsPerLine)), 0)
  return Math.ceil(lines * 18 * lineHeight) + 8
}

function boundsOf(items: Placed[]): Rect {
  if (items.length === 0) return { x: 0, y: 0, w: 1, h: 1 }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const it of items) {
    minX = Math.min(minX, it.rect.x)
    minY = Math.min(minY, it.rect.y)
    maxX = Math.max(maxX, it.rect.x + it.rect.w)
    maxY = Math.max(maxY, it.rect.y + it.rect.h)
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}
