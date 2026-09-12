import { Phone } from '../kit/device'
import { ExplorationMetaLine } from './Meta'
import {
  briefs,
  canvasEntriesFor,
  projectById,
  statusLabel,
  type CanvasEntry,
  type Project,
  type ViewEntry,
} from '../registry'

/**
 * A project's root: every canvas in it, as entry points.
 *
 * This is the home page's shape scoped to one product. A workspace holding
 * several independent projects and a workspace holding one product's sub-areas
 * want the same thing here — a list of the surfaces being worked on, each
 * showing enough of itself to be recognised.
 */
export function ProjectRoot({ id, onOpenDoc }: { id: string; onOpenDoc: (label: string, md: string) => void }) {
  const project = projectById(id)
  if (!project) {
    return <p className="empty-page">No project registered as <code>{id}</code>.</p>
  }

  const entries = canvasEntriesFor(id)
  const brief = briefs.find((b) => b.scope.kind === 'project' && b.scope.project === id)
  const status = statusLabel(project.status)

  return (
    <div className="ix">
      <header className="ix-head">
        <div className="ix-band-title" style={{ marginBottom: 10 }}>
          <span className="sb-avatar" style={{ background: project.accent ?? 'var(--ink-faint)' }}>
            {project.name.slice(0, 1)}
          </span>
          <h1 style={{ margin: 0 }}>{project.name}</h1>
        </div>
        {project.tagline && <p>{project.tagline}</p>}
        <p className="ix-band-facts" style={{ marginTop: 14 }}>
          {project.sourceRepo && <span className="ix-fact ix-fact-quiet">{project.sourceRepo}</span>}
          {status && <span className="ix-fact ix-fact-quiet">{status}</span>}
          {brief && (
            <button
              className="ix-linkish"
              onClick={(e) => {
                e.preventDefault()
                onOpenDoc('Project brief', brief.markdown)
              }}
            >
              Project brief →
            </button>
          )}
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="ix-nothing" style={{ marginTop: 32 }}>
          Nothing here yet. Ask the agent to port a blueprint from{' '}
          <code>{project.sourceRepo}</code>, or to start an exploration.
        </p>
      ) : (
        entries.map((entry) => <CanvasBand key={entry.id} entry={entry} project={project} />)
      )}
    </div>
  )
}

function CanvasBand({ entry, project }: { entry: CanvasEntry; project: Project }) {
  const past = entry.exploration && !entry.exploration.isLive

  return (
    <a className="ix-band" href={`#/c/${entry.id}`} data-past={past ? '' : undefined}>
      <div className="ix-band-text">
        <div className="ix-band-title">
          <h2>{entry.title}</h2>
        </div>

        {entry.exploration ? (
          <div style={{ marginTop: 10 }}>
            <ExplorationMetaLine exploration={entry.exploration} />
          </div>
        ) : (
          <p className="ix-band-facts" style={{ marginTop: 10 }}>
            <span className="ix-fact">
              {entry.frames.length} screen{entry.frames.length === 1 ? '' : 's'}
            </span>
          </p>
        )}

        {(entry.question || entry.lede) && (
          <p className="ix-band-tagline">{truncate(entry.question ?? entry.lede ?? '', 190)}</p>
        )}
      </div>

      <div className="ix-band-frames" aria-hidden>
        {entry.frames.slice(0, 4).map((v, i) => (
          <Thumb key={`${v.id}-${i}`} view={v} project={project} />
        ))}
      </div>
    </a>
  )
}

function Thumb({ view, project }: { view: ViewEntry; project: Project }) {
  const { Component } = view
  return (
    <div className="ix-thumb">
      <Phone
        device={view.meta.device ?? project.device ?? 'iphone-16'}
        mode={view.meta.mode ?? project.defaultMode ?? 'light'}
        scale={0.26}
        screenClassName={project.tokenScope}
      >
        <Component />
      </Phone>
    </div>
  )
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n)) + '…'
}
