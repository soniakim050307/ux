import { useMediaUrl } from '../media'
import type { Moment } from '../types'

// Pin positions (% of the stage). Up to 8 moments are shown at once.
const SLOTS = [
  { x: 63, y: 24 },
  { x: 34, y: 46 },
  { x: 78, y: 56 },
  { x: 50, y: 66 },
  { x: 20, y: 62 },
  { x: 88, y: 34 },
  { x: 56, y: 40 },
  { x: 30, y: 76 },
]

interface PinProps {
  moment: Moment
  x: number
  y: number
  selected: boolean
  onSelect: () => void
}

function Pin({ moment, x, y, selected, onSelect }: PinProps) {
  const url = useMediaUrl(moment.type === 'photo' ? moment.id : null)
  return (
    <button
      type="button"
      className={`pin ${selected ? 'selected' : ''}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={onSelect}
      aria-label={`Moment ${moment.type}`}
    >
      <span
        className="pin-head"
        style={url ? { backgroundImage: `url(${url})` } : undefined}
      />
      <span className="pin-stem" />
      <span className="pin-foot" />
    </button>
  )
}

interface Props {
  moments: Moment[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function Vinyl({ moments, selectedId, onSelect }: Props) {
  return (
    <div className="vinyl-stage">
      <div className="vinyl-wrap">
        <div className="vinyl">
          <div className="vinyl-label" />
        </div>
      </div>
      <div className="tonearm" aria-hidden>
        <i />
      </div>
      {moments.slice(0, SLOTS.length).map((m, i) => (
        <Pin
          key={m.id}
          moment={m}
          x={SLOTS[i].x}
          y={SLOTS[i].y}
          selected={m.id === selectedId}
          onSelect={() => onSelect(m.id)}
        />
      ))}
    </div>
  )
}
