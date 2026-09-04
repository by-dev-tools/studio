import { Board } from '../components/Board'

export const meta = {
  name: 'Departures board',
  project: 'onward',
  note: 'The screen everything branches from. Five departures covering all four states: on time, delayed, cancelled, and no update at all.',
}

export default function Departures() {
  return <Board />
}
