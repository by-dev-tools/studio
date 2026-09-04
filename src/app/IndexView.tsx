import { blueprintsFor, canvasesFor, explorationsFor, projects, statusLabel } from '../registry'

export function IndexView() {
  return (
    <div className="pc">
      <header className="pc-head">
        <h1 className="pc-title">Studio</h1>
        <p className="pc-tagline">
          Prototypes for the projects in <code>~/dev</code>. Each project owns its blueprints,
          its token scope, and its brief. Nothing here has a backend or touches real data.
        </p>
      </header>

      <section className="pc-section">
        <div className="pc-section-head">
          <h2 className="pc-section-title">Projects</h2>
          <span className="pc-count">{projects.length}</span>
        </div>

        <ul className="lst">
          {projects.map((p) => {
            const status = statusLabel(p.status)
            const parts = [
              plural(blueprintsFor(p.id).length, 'blueprint'),
              plural(canvasesFor(p.id).length, 'canvas', 'canvases'),
              plural(explorationsFor(p.id).length, 'exploration'),
            ]
            return (
              <li key={p.id}>
                <a className="lst-row" href={`#/p/${p.id}`}>
                  <span className="sb-avatar" style={{ background: p.accent ?? 'var(--ink-faint)' }}>
                    {p.name.slice(0, 1)}
                  </span>
                  <span className="lst-main">
                    <span className="lst-name">{p.name}</span>
                    {p.tagline && <span className="lst-sub">{p.tagline}</span>}
                  </span>
                  <span className="lst-meta">{status ?? parts.join(' · ')}</span>
                </a>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}
