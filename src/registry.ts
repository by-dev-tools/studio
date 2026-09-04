/**
 * The registry — discovered, never hand-maintained.
 *
 * Vite's `import.meta.glob` walks the conventions below, so there is no index to
 * update and no generation step to run. Add a file, it appears.
 *
 * TWO AXES, deliberately separate:
 *   · PROJECT is the axis of navigation — what you are working on.
 *   · CONTRIBUTOR is the axis of write scope — whose work it is safe to break.
 * Conflating them is what makes a playground stop scaling: a solo builder has
 * many projects and one contributor; a design team has one product and many
 * contributors. The same layout has to serve both, so the path carries both.
 *
 *   <root>/projects/<project>/project.json    the product
 *   <root>/projects/<project>/tokens.css      its token scope
 *   <root>/projects/<project>/blueprints/*.tsx  production-faithful views
 *   <root>/projects/<project>/brief.md        how to prototype for this product
 *   <root>/contributors/<who>/<project>/<slug>/views/*.tsx
 *   <root>/contributors/<who>/<project>/<slug>/*.canvas.json
 *   <root>/contributors/<who>/<project>/<slug>/brief.md
 *   docs/brief.md                             the studio-wide brief
 *
 * TWO ROOTS. `examples/` ships with the tool so a fresh clone runs and shows
 * what a blueprint and a brief look like. `workspace/` is a separate, private
 * checkout holding real work — gitignored here, so it cannot be published by
 * accident. Both are globbed; whichever exists contributes.
 *
 * import.meta.glob needs literal patterns, so each root is spelled out rather
 * than composed from a variable. Adding a third root means adding lines here.
 */
import type { ComponentType } from 'react'
import type { DeviceId } from './kit/device'

export type ViewMeta = {
  name: string
  project?: string
  device?: DeviceId
  mode?: 'light' | 'dark'
  note?: string
}

export type Project = {
  id: string
  name: string
  tagline?: string
  platform?: string
  status?: 'active' | 'registered' | 'archived'
  sourceRepo?: string
  designLanguage?: string
  tokenScope?: string
  device?: DeviceId
  defaultMode?: 'light' | 'dark'
  accent?: string
  note?: string
}

export type CanvasFrame = {
  /** A view id from this registry. The canvas POINTS at views, never embeds them. */
  view: string
  caption?: string
  mode?: 'light' | 'dark'
  device?: DeviceId
}

export type CanvasSection = {
  title?: string
  note?: string
  rows: Array<{ frames: CanvasFrame[] }>
}

export type CanvasManifest = {
  id: string
  title: string
  lede?: string
  project?: string
  device?: DeviceId
  mode?: 'light' | 'dark'
  sections: CanvasSection[]
}

export type Owner =
  | { kind: 'blueprint'; project: string }
  | { kind: 'exploration'; who: string; project: string; slug: string }

export type ViewEntry = {
  /** Stable slug: `onward/departures-board` or `me/onward/delay-voice/status-word`. */
  id: string
  file: string
  owner: Owner
  project: string
  Component: ComponentType
  meta: ViewMeta
}

/** A scoped instruction document. Briefs INHERIT: studio → project → exploration. */
export type BriefScope =
  | { kind: 'studio' }
  | { kind: 'project'; project: string }
  | { kind: 'exploration'; who: string; project: string; slug: string }

export type Brief = {
  /** `studio`, a project id, or `<who>/<project>/<slug>`. */
  id: string
  scope: BriefScope
  label: string
  markdown: string
}

/** Declared in `contributors/<who>/<project>/<slug>/exploration.json`. */
export type ExplorationMeta = {
  title?: string
  question?: string
  /** Only ever declared to PARK or ARCHIVE; live states are derived. */
  status?: 'parked' | 'archived'
  /** `owner/repo#42` or a full PR URL. Declared, never guessed. */
  pr?: string[] | string
}

export type PullRequest = {
  ref: string
  number?: number
  title?: string
  state?: 'OPEN' | 'DRAFT' | 'MERGED' | 'CLOSED'
  url?: string
  mergedAt?: string | null
  error?: string
}

export type Activity = {
  started?: string | null
  updated?: string | null
  commits?: number
  prs: PullRequest[]
}

/**
 * Derived, except for the two states a human has to declare. `shipped` and
 * `in-review` come from the linked PR, `active` from having neither — so the
 * status cannot drift from the truth the way a hand-edited field does.
 */
export type ExplorationStatus = 'active' | 'in-review' | 'shipped' | 'parked' | 'archived'

export type Exploration = {
  /** `<who>/<project>/<slug>` */
  id: string
  who: string
  project: string
  slug: string
  title: string
  question?: string
  status: ExplorationStatus
  activity: Activity
  /** Live work is prominent; everything else is kept for the record. */
  isLive: boolean
  views: ViewEntry[]
  canvases: CanvasManifest[]
  brief?: Brief
  notes?: string
}

type ViewModule = { default: ComponentType; meta?: ViewMeta }

// Token scopes — imported for side effects so every project's CSS is present.
import.meta.glob('../examples/*/tokens.css', { eager: true })
import.meta.glob('../workspace/projects/*/tokens.css', { eager: true })

const projectModules = {
  ...import.meta.glob<{ default: Project }>('../examples/*/project.json', { eager: true }),
  ...import.meta.glob<{ default: Project }>('../workspace/projects/*/project.json', { eager: true }),
}
const blueprintModules = {
  ...import.meta.glob<ViewModule>('../examples/*/blueprints/*.tsx', { eager: true }),
  ...import.meta.glob<ViewModule>('../workspace/projects/*/blueprints/*.tsx', { eager: true }),
}
const explorationModules = {
  ...import.meta.glob<ViewModule>('../examples/*/contributors/*/*/views/*.tsx', { eager: true }),
  ...import.meta.glob<ViewModule>('../workspace/contributors/*/*/*/views/*.tsx', { eager: true }),
}
const canvasModules = {
  ...import.meta.glob<{ default: CanvasManifest }>('../examples/*/contributors/*/*/*.canvas.json', {
    eager: true,
  }),
  ...import.meta.glob<{ default: CanvasManifest }>('../workspace/contributors/*/*/*/*.canvas.json', {
    eager: true,
  }),
}
const studioBriefModules = import.meta.glob<string>('../docs/brief.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})
/**
 * NOTE: the options object must be an inline LITERAL at every call site. Vite
 * reads these statically at build time, so hoisting them into a shared const
 * silently drops `query: '?raw'` — and the markdown then gets handed to the JS
 * parser, which fails on the first em dash.
 */
const projectBriefModules = {
  ...import.meta.glob<string>('../examples/*/brief.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
  ...import.meta.glob<string>('../workspace/projects/*/brief.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
}
const explorationBriefModules = {
  ...import.meta.glob<string>('../examples/*/contributors/*/*/brief.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
  ...import.meta.glob<string>('../workspace/contributors/*/*/*/brief.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
}
const notesModules = {
  ...import.meta.glob<string>('../examples/*/contributors/*/*/notes.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
  ...import.meta.glob<string>('../workspace/contributors/*/*/*/notes.md', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
}
const explorationMetaModules = {
  ...import.meta.glob<{ default: ExplorationMeta }>('../examples/*/contributors/*/*/exploration.json', {
    eager: true,
  }),
  ...import.meta.glob<{ default: ExplorationMeta }>(
    '../workspace/contributors/*/*/*/exploration.json',
    { eager: true },
  ),
}

/**
 * Written by `scripts/sync-activity.mjs` (npm predev / prebuild), gitignored.
 * Globbed rather than imported so a missing file is an empty result, not a
 * build error — the app renders correctly before the first sync.
 */
const activityModules = import.meta.glob<{
  default: { generatedAt: string; gh: boolean; explorations: Record<string, Activity> }
}>('./generated/activity.json', { eager: true })

const activityData = Object.values(activityModules)[0]?.default
export const activityGeneratedAt: string | undefined = activityData?.generatedAt
export const githubAvailable: boolean = activityData?.gh ?? false

function slug(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function basename(path: string): string {
  return path.split('/').pop()!.replace(/\.tsx$/, '')
}

/** Project id, from either root. */
function projectOf(path: string): string {
  const ws = path.match(/workspace\/projects\/([^/]+)\//)
  if (ws) return ws[1]
  return path.match(/examples\/([^/]+)\//)![1]
}

/**
 * → `[who, project, slug]`, from either root.
 *
 * The workspace nests contributors beside projects
 * (`workspace/contributors/<who>/<project>/<slug>/`), while an example keeps
 * its own contributors inside it (`examples/<project>/contributors/<who>/<slug>/`)
 * so one example folder is a complete, self-contained specimen.
 */
function explorationParts(path: string): [string, string, string] {
  const ws = path.match(/workspace\/contributors\/([^/]+)\/([^/]+)\/([^/]+)\//)
  if (ws) return [ws[1], ws[2], ws[3]]
  const ex = path.match(/examples\/([^/]+)\/contributors\/([^/]+)\/([^/]+)\//)!
  return [ex[2], ex[1], ex[3]]
}

// --- projects ---------------------------------------------------------------

export const projects: Project[] = Object.values(projectModules)
  .map((m) => m.default)
  .sort((a, b) => {
    // Active projects first, then alphabetical — a registered-but-unported
    // project should not sit above one with real work in it.
    const rank = (p: Project) => (p.status === 'active' ? 0 : p.status === 'archived' ? 2 : 1)
    return rank(a) - rank(b) || a.name.localeCompare(b.name)
  })

/**
 * Plain-English status. "registered" was jargon that told nobody anything —
 * what it means is that the project exists here but nothing has been ported
 * from its repo yet. An active project needs no label at all.
 */
export function statusLabel(status: Project['status']): string | null {
  if (status === 'registered') return 'Nothing ported yet'
  if (status === 'archived') return 'Archived'
  return null
}

export function projectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id)
}

// --- views ------------------------------------------------------------------

export const views: ViewEntry[] = [
  ...Object.entries(blueprintModules).map(([file, mod]) => {
    const project = projectOf(file)
    const name = basename(file)
    return {
      id: `${project}/${slug(name)}`,
      file,
      owner: { kind: 'blueprint', project } as const,
      project,
      Component: mod.default,
      meta: mod.meta ?? { name },
    }
  }),
  ...Object.entries(explorationModules).map(([file, mod]) => {
    const [who, project, slugName] = explorationParts(file)
    const name = basename(file)
    return {
      id: `${who}/${project}/${slugName}/${slug(name)}`,
      file,
      owner: { kind: 'exploration', who, project, slug: slugName } as const,
      project,
      Component: mod.default,
      meta: mod.meta ?? { name },
    }
  }),
].sort((a, b) => a.id.localeCompare(b.id))

export function viewById(id: string): ViewEntry | undefined {
  return views.find((v) => v.id === id)
}

export function blueprintsFor(project: string): ViewEntry[] {
  return views.filter((v) => v.owner.kind === 'blueprint' && v.project === project)
}

// --- canvases ---------------------------------------------------------------

export const canvases: CanvasManifest[] = Object.entries(canvasModules)
  .map(([file, mod]) => {
    const [, project] = explorationParts(file)
    return { ...mod.default, project: mod.default.project ?? project }
  })
  .sort((a, b) => a.title.localeCompare(b.title))

export function canvasById(id: string): CanvasManifest | undefined {
  return canvases.find((c) => c.id === id)
}

export function canvasesFor(project: string): CanvasManifest[] {
  return canvases.filter((c) => c.project === project)
}

// --- briefs -----------------------------------------------------------------

export const briefs: Brief[] = [
  ...Object.values(studioBriefModules).map((markdown) => ({
    id: 'studio',
    scope: { kind: 'studio' } as const,
    label: 'Studio',
    markdown,
  })),
  ...Object.entries(projectBriefModules).map(([file, markdown]) => {
    const project = projectOf(file)
    return {
      id: project,
      scope: { kind: 'project', project } as const,
      label: projectById(project)?.name ?? project,
      markdown,
    }
  }),
  ...Object.entries(explorationBriefModules).map(([file, markdown]) => {
    const [who, project, slugName] = explorationParts(file)
    return {
      id: `${who}/${project}/${slugName}`,
      scope: { kind: 'exploration', who, project, slug: slugName } as const,
      label: slugName,
      markdown,
    }
  }),
]

export function briefById(id: string): Brief | undefined {
  return briefs.find((b) => b.id === id)
}

/**
 * The briefs that apply to a piece of work, broadest first. The agent reads them
 * in this order; the most specific one wins where they disagree.
 */
export function briefChain(opts: { project?: string; exploration?: string }): Brief[] {
  const chain: Brief[] = []
  const studio = briefs.find((b) => b.scope.kind === 'studio')
  if (studio) chain.push(studio)
  if (opts.project) {
    const p = briefs.find((b) => b.scope.kind === 'project' && b.scope.project === opts.project)
    if (p) chain.push(p)
  }
  if (opts.exploration) {
    const e = briefs.find((b) => b.scope.kind === 'exploration' && b.id === opts.exploration)
    if (e) chain.push(e)
  }
  return chain
}

// --- explorations -----------------------------------------------------------

function deriveStatus(meta: ExplorationMeta, prs: PullRequest[]): ExplorationStatus {
  if (meta.status === 'archived') return 'archived'
  if (meta.status === 'parked') return 'parked'
  if (prs.some((p) => p.state === 'MERGED')) return 'shipped'
  if (prs.some((p) => p.state === 'OPEN' || p.state === 'DRAFT')) return 'in-review'
  return 'active'
}

export const explorations: Exploration[] = (() => {
  const byId = new Map<string, Exploration>()

  const ensure = (who: string, project: string, slugName: string): Exploration => {
    const id = `${who}/${project}/${slugName}`
    if (!byId.has(id)) {
      byId.set(id, {
        id,
        who,
        project,
        slug: slugName,
        title: slugName,
        status: 'active',
        activity: { prs: [] },
        isLive: true,
        views: [],
        canvases: [],
      })
    }
    return byId.get(id)!
  }

  for (const v of views) {
    if (v.owner.kind !== 'exploration') continue
    ensure(v.owner.who, v.owner.project, v.owner.slug).views.push(v)
  }
  for (const [file, mod] of Object.entries(canvasModules)) {
    const [who, project, slugName] = explorationParts(file)
    ensure(who, project, slugName).canvases.push(canvasById(mod.default.id) ?? mod.default)
  }
  for (const [file, markdown] of Object.entries(notesModules)) {
    const [who, project, slugName] = explorationParts(file)
    ensure(who, project, slugName).notes = markdown
  }
  for (const b of briefs) {
    if (b.scope.kind !== 'exploration') continue
    ensure(b.scope.who, b.scope.project, b.scope.slug).brief = b
  }
  for (const [file, mod] of Object.entries(explorationMetaModules)) {
    const [who, project, slugName] = explorationParts(file)
    const e = ensure(who, project, slugName)
    const meta = mod.default ?? {}
    e.title = meta.title ?? e.slug
    e.question = meta.question
    e.activity = activityData?.explorations[e.id] ?? { prs: [] }
    e.status = deriveStatus(meta, e.activity.prs)
    e.isLive = e.status === 'active' || e.status === 'in-review'
  }

  // Anything without an exploration.json still gets its git activity.
  for (const e of byId.values()) {
    if (e.activity.prs.length === 0 && !e.activity.updated) {
      e.activity = activityData?.explorations[e.id] ?? { prs: [] }
    }
  }

  // Live work first and most recent first within it — the prominence rule.
  // Everything else is kept, ordered by when it last moved.
  const rank: Record<ExplorationStatus, number> = {
    'in-review': 0,
    active: 1,
    shipped: 2,
    parked: 3,
    archived: 4,
  }
  return [...byId.values()].sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      (b.activity.updated ?? '').localeCompare(a.activity.updated ?? '') ||
      a.id.localeCompare(b.id),
  )
})()

export function liveExplorations(project: string): Exploration[] {
  return explorations.filter((e) => e.project === project && e.isLive)
}

/** Kept for the record: shipped, parked, archived. */
export function pastExplorations(project: string): Exploration[] {
  return explorations.filter((e) => e.project === project && !e.isLive)
}

export function statusText(status: ExplorationStatus): string {
  return status === 'in-review' ? 'In review' : status[0].toUpperCase() + status.slice(1)
}

/**
 * Relative time for studio chrome. The frozen-clock rule governs PROTOTYPE
 * content, where a moving clock would make two frames incomparable; chrome
 * reporting when something last moved must use the real one.
 */
export function timeAgo(iso?: string | null): string | null {
  if (!iso) return null
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return null
  const days = Math.floor((Date.now() - then) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  const years = Math.floor(days / 365)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

export function explorationById(id: string): Exploration | undefined {
  return explorations.find((e) => e.id === id)
}

export function explorationsFor(project: string): Exploration[] {
  return explorations.filter((e) => e.project === project)
}

/** Everything registered under a project, for its overview page. */
export function projectSummary(id: string) {
  return {
    project: projectById(id),
    blueprints: blueprintsFor(id),
    explorations: explorationsFor(id),
    canvases: canvasesFor(id),
    brief: briefs.find((b) => b.scope.kind === 'project' && b.scope.project === id),
  }
}
