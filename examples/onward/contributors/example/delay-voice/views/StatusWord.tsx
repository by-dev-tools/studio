import { Board } from '../../../../components/Board'

export const meta = {
  name: 'A · the word only',
  project: 'onward',
  note: 'Says "Delayed" and leaves the scheduled time standing. Honest and cheap, but it makes you do the arithmetic it already knows the answer to.',
}

export default function StatusWord() {
  return <Board voice="status-word" />
}
