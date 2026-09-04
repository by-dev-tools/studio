import { Board } from '../../../../components/Board'

export const meta = {
  name: 'B · the revised time',
  project: 'onward',
  note: 'Strikes the scheduled time and shows the new one. Answers the actual question — when do I board — but a revised time reads as a promise, and revisions move again.',
}

export default function RevisedTime() {
  return <Board voice="revised-time" />
}
