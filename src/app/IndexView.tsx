import { Phone } from '../kit/device'
import {
  blueprintsFor,
  briefs,
  explorationsFor,
  liveExplorations,
  projectById,
  projects,
  statusLabel,
  statusText,
  timeAgo,
  type Project,
  type ViewEntry,
} from '../registry'

/**
 * The overview shows the work, not a list of its names.
 *
 * A project's identity here is its screens — a row of names told you nothing
 * you could not have guessed from the sidebar, and everything worth seeing was
 * a click deeper. Frames render live at a small scale; they are inert on this
 * page because the whole band is a link, and a prototype that swallowed the
 * click would make the row feel broken.
 */
export function IndexView() {
  const studioBrief = briefs.find((b) => b.scope.kind === 'studio')

  return (
    <div className="ix">
      <header className="ix-head">
        <h1>Studio</h1>
        <p>
          Prototypes for the projects in <code>~/dev</code>, each on its own canvas with the
          blueprints it branches from and the brief that governs it.
          {studioBrief && (
            <>
              {' '}
              <a href="#/brief">Studio brief →</a>
            </>
          )}
        </p>
      </header>

      {byRecency(projects).map((p) => (
        <ProjectBand key={p.id} project={p} />
      ))}
    </div>
  )
}

/**
 * Most recently moved first. The registry orders projects by status then name,
 * which is right for a sidebar you scan by name and wrong for an overview:
 * the thing you touched yesterday should not sort under the thing you have not
 * opened in a month.
 */
function byRecency(list: Project[]): Project[] {
  const moved = (p: Project) =>
    explorationsFor(p.id)
      .map((e) => e.activity.updated ?? '')
      .sort()
      .at(-1) ?? ''
  return [...list].sort((a, b) => {
    const rank = (p: Project) => (p.status === 'active' ? 0 : p.status === 'archived' ? 2 : 1)
    return rank(a) - rank(b) || moved(b).localeCompare(moved(a)) || a.name.localeCompare(b.name)
  })
}

function ProjectBand({ project }: { project: Project }) {
  const blueprints = blueprintsFor(project.id)
  const live = liveExplorations(project.id)
  const all = explorationsFor(project.id)
  const shipped = all.filter((e) => e.status === 'shipped')
  const status = statusLabel(project.status)

  // Newest movement across the project, whichever exploration it came from.
  const lastMoved = all
    .map((e) => e.activity.updated)
    .filter(Boolean)
    .sort()
    .at(-1)

  return (
    <a className="ix-band" href={`#/p/${project.id}`}>
      <div className="ix-band-text">
        <div className="ix-band-title">
          <span className="sb-avatar" style={{ background: project.accent ?? 'var(--ink-faint)' }}>
            {project.name.slice(0, 1)}
          </span>
          <h2>{project.name}</h2>
        </div>
        {project.tagline && <p className="ix-band-tagline">{project.tagline}</p>}

        <p className="ix-band-facts">
          {status ? (
            <span className="ix-fact ix-fact-quiet">{status}</span>
          ) : (
            <>
              <span className="ix-fact">
                {blueprints.length} blueprint{blueprints.length === 1 ? '' : 's'}
              </span>
              {live.length > 0 && (
                <span className="ix-fact">
                  {live.length} open exploration{live.length === 1 ? '' : 's'}
                </span>
              )}
              {/* Work that reached the product is the strongest thing a project
                  can say about itself, so it belongs on the overview. */}
              {shipped.length > 0 && (
                <span className="ix-fact ix-fact-shipped">
                  {shipped.length} shipped
                </span>
              )}
              {lastMoved && <span className="ix-fact ix-fact-quiet">moved {timeAgo(lastMoved)}</span>}
            </>
          )}
        </p>

        {(live.length > 0 || shipped.length > 0) && (
          <ul className="ix-open">
            {[...live, ...shipped].slice(0, 2).map((e) => (
              <li key={e.id}>
                <span className="pill" data-status={e.status}>
                  <span className="pill-dot" />
                  {statusText(e.status)}
                </span>
                <span className="ix-open-title">{e.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="ix-band-frames" aria-hidden>
        {blueprints.length === 0 ? (
          <p className="ix-nothing">Nothing ported yet</p>
        ) : (
          blueprints.slice(0, 4).map((v) => <Thumb key={v.id} view={v} project={project} />)
        )}
      </div>
    </a>
  )
}

function Thumb({ view, project }: { view: ViewEntry; project: Project }) {
  const bp = projectById(view.project) ?? project
  const { Component } = view
  return (
    <div className="ix-thumb">
      <Phone
        device={view.meta.device ?? bp.device ?? 'iphone-16'}
        mode={view.meta.mode ?? bp.defaultMode ?? 'light'}
        scale={0.26}
        screenClassName={bp.tokenScope}
      >
        <Component />
      </Phone>
    </div>
  )
}
