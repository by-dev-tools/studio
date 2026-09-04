import { statusText, timeAgo, type Exploration, type PullRequest } from '../registry'

/** Status + when it last moved + where it landed. One quiet line. */
export function ExplorationMetaLine({ exploration }: { exploration: Exploration }) {
  const when = timeAgo(exploration.activity.updated)
  const prs = exploration.activity.prs

  return (
    <span className="meta-line">
      <StatusPill status={exploration.status} />
      {when && <span className="meta-when">updated {when}</span>}
      {prs.map((pr) => (
        <PrLink key={pr.ref} pr={pr} />
      ))}
    </span>
  )
}

export function StatusPill({ status }: { status: Exploration['status'] }) {
  return (
    <span className="pill" data-status={status}>
      <span className="pill-dot" />
      {statusText(status)}
    </span>
  )
}

function PrLink({ pr }: { pr: PullRequest }) {
  if (pr.error) {
    return (
      <span className="meta-when" title={pr.error}>
        {pr.ref} · unreachable
      </span>
    )
  }
  return (
    <a className="meta-pr" href={pr.url} target="_blank" rel="noreferrer" title={pr.title}>
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M5 3.5a1.5 1.5 0 1 0-2 1.415V11.1a1.5 1.5 0 1 0 1 0V4.915A1.5 1.5 0 0 0 5 3.5Zm7.5 7.585V6.5A2.5 2.5 0 0 0 10 4H8.7l1.15-1.15-.7-.7L6.79 4.5l2.36 2.35.7-.7L8.7 5H10a1.5 1.5 0 0 1 1.5 1.5v4.585a1.5 1.5 0 1 0 1 0Z" />
      </svg>
      #{pr.number ?? pr.ref}
      {pr.state && <span className="meta-pr-state" data-state={pr.state}>{pr.state.toLowerCase()}</span>}
    </a>
  )
}
