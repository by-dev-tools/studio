/**
 * Mock data on a FROZEN clock. Every frame renders at the same instant, so a
 * canvas of variants compares design decisions rather than the minute the page
 * happened to load. Never `new Date()` in prototype content.
 */
export type Status = 'ontime' | 'delayed' | 'cancelled' | 'unknown'

export type Departure = {
  id: string
  destination: string
  platform: string | null
  /** Scheduled departure, "HH:MM". */
  scheduled: string
  /** Minutes late. 0 when on time; null when the operator has told us nothing. */
  delayMinutes: number | null
  status: Status
  calling: string[]
}

export const NOW = '14:32'

export const departures: Departure[] = [
  {
    id: '1',
    destination: 'Brighton',
    platform: '4',
    scheduled: '14:38',
    delayMinutes: 0,
    status: 'ontime',
    calling: ['Croydon', 'Gatwick', 'Haywards Heath'],
  },
  {
    id: '2',
    destination: 'Lewes',
    platform: '2',
    scheduled: '14:41',
    delayMinutes: 9,
    status: 'delayed',
    calling: ['Croydon', 'Wivelsfield'],
  },
  {
    id: '3',
    destination: 'Eastbourne',
    platform: null,
    scheduled: '14:47',
    delayMinutes: null,
    status: 'unknown',
    calling: ['Gatwick', 'Lewes', 'Polegate'],
  },
  {
    id: '4',
    destination: 'Hastings',
    platform: '6',
    scheduled: '14:52',
    delayMinutes: null,
    status: 'cancelled',
    calling: ['Tunbridge Wells', 'Battle'],
  },
  {
    id: '5',
    destination: 'Littlehampton',
    platform: '1',
    scheduled: '15:03',
    delayMinutes: 0,
    status: 'ontime',
    calling: ['Horsham', 'Arundel'],
  },
]

/** Add minutes to an "HH:MM" string. */
export function shift(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = (h * 60 + m + minutes + 1440) % 1440
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
