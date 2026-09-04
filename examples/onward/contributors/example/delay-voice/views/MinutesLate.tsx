import { Board } from '../../../../components/Board'

export const meta = {
  name: 'C · minutes late',
  project: 'onward',
  note: 'States the delta and lets the scheduled time stand. Keeps one number on screen instead of two, and degrades honestly when the size of the delay is all the operator knows.',
}

export default function MinutesLate() {
  return <Board voice="minutes-late" />
}
