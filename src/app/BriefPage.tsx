import { Markdown } from './Markdown'
import { briefById } from '../registry'

export function BriefPage() {
  const brief = briefById('studio')
  return (
    <div className="pc">
      <header className="pc-head">
        <h1 className="pc-title">Studio brief</h1>
        <p className="pc-tagline">
          Applies to everything in this repo. A project or exploration brief can add to it or
          overrule it; where they say nothing, this holds.
        </p>
      </header>
      <div className="doc">
        {brief ? <Markdown>{brief.markdown}</Markdown> : <p className="empty">No studio brief yet.</p>}
      </div>
    </div>
  )
}
