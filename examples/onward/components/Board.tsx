import './board.css'
import { departures, NOW, shift, type Departure } from '../data/departures'

export type DelayVoice = 'status-word' | 'revised-time' | 'minutes-late'

/**
 * Shared board. Lives in components/, not blueprints/, because the registry
 * treats every file under blueprints/ as a registered view — a shared piece
 * there would appear on the index as a phantom screen.
 */
export function Board({ voice = 'status-word' }: { voice?: DelayVoice }) {
  return (
    <>
      <header className="ow-head">
        <h1 className="ow-station">London Bridge</h1>
        <p className="ow-now">Departures · {NOW}</p>
      </header>
      <div className="ow-list">
        {departures.map((d) => (
          <Row key={d.id} d={d} voice={voice} />
        ))}
      </div>
    </>
  )
}

function Row({ d, voice }: { d: Departure; voice: DelayVoice }) {
  const late = d.status === 'delayed' && d.delayMinutes ? d.delayMinutes : 0
  const revised = late ? shift(d.scheduled, late) : null

  return (
    <article className={`ow-row${d.status === 'cancelled' ? ' ow-strike' : ''}`}>
      <div className="ow-row-top">
        <span className="ow-dest">{d.destination}</span>
        <span className="ow-time">
          {voice === 'revised-time' && revised && (
            <span className="ow-time-was">{d.scheduled}</span>
          )}
          {voice === 'revised-time' && revised ? revised : d.scheduled}
        </span>
      </div>
      <div className="ow-row-bottom">
        <span className="ow-calling">{d.calling.join(' · ')}</span>
        <span className="ow-plat">{d.platform ? `Plat ${d.platform}` : 'Plat —'}</span>
        <span className="ow-status" data-s={d.status}>
          {label(d, voice)}
        </span>
      </div>
    </article>
  )
}

/**
 * The one rule this example exists to demonstrate: an unknown is never dressed
 * up as a number. When the operator has told us nothing, the row says so.
 */
function label(d: Departure, voice: DelayVoice): string {
  if (d.status === 'cancelled') return 'Cancelled'
  if (d.status === 'unknown') return 'No update'
  if (d.status === 'ontime') return 'On time'
  const late = d.delayMinutes ?? 0
  if (voice === 'minutes-late') return `${late} min late`
  if (voice === 'revised-time') return 'Delayed'
  return 'Delayed'
}
