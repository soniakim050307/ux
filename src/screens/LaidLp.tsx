import type { FlowAlbum } from '../data'

/** 눕혀 놓은 LP. 원판 반지름(디자인 px)과 두 상태의 위치·기울기 (Figma 화면에서 측정) */
const R = 376
const STATES = {
  rest: { cx: 102, cy: 445, sx: 0.939, sy: 0.543 },
  sel: { cx: 32, cy: 518, sx: 1, sy: 0.465 },
}
const STEM = 55

/** 원판 위 핀 자리 (원판 중심 기준, -1~1) */
const SLOTS: [number, number][] = [
  [0.407, -0.669],
  [0.303, -0.211],
  [0.58, 0.274],
  [-0.4, -0.45],
  [-0.2, 0.5],
  [0.7, -0.02],
  [0.1, 0.72],
  [-0.6, 0.2],
]

interface Props {
  album: FlowAlbum | null
  selected: number | null
  onSelect: (i: number | null) => void
  onOpen: (i: number) => void
}

export default function LaidLp({ album, selected, onSelect, onOpen }: Props) {
  const moments = album?.moments ?? []
  const g = selected === null ? STATES.rest : STATES.sel
  const tf = `translate(${g.cx - R}px, ${g.cy - R}px) scale(${g.sx}, ${g.sy})`
  const tfEdge = `translate(${g.cx - R}px, ${g.cy - R + 10}px) scale(${g.sx}, ${g.sy})`

  return (
    <div
      className="lp2"
      onClick={(e) => e.target === e.currentTarget && onSelect(null)}
    >
      <div className={`lp2-title ${selected !== null ? 'on' : ''}`}>
        <h2>{album?.city ?? ''}</h2>
        <p>
          {moments.length} MOMENT{moments.length === 1 ? '' : 'S'}
        </p>
      </div>

      <div className="lp2-edge" style={{ transform: tfEdge }} />
      <div className="lp2-disc" style={{ transform: tf }}>
        <i className="lp2-ring" style={{ inset: '3%' }} />
        <i className="lp2-ring" style={{ inset: '4.6%' }} />
        <i className="lp2-ring" style={{ inset: '6.2%' }} />
        <i className="lp2-ring" style={{ inset: '21%' }} />
        <i className="lp2-ring" style={{ inset: '36%' }} />
        <i className="lp2-label" />
      </div>

      {moments.map((m, i) => {
        const [ux, uy] = SLOTS[i % SLOTS.length]
        const x = g.cx + ux * R * g.sx
        const y = g.cy + uy * R * g.sy
        const on = selected === i
        const w = on ? 171 : 26
        const h = on ? 171 : 21
        return (
          <div key={m.id} className={`lp2-pin ${on ? 'on' : ''}`} style={{ left: x, top: y }}>
            <i className="lp2-foot" />
            <i className="lp2-stem" />
            <button
              type="button"
              className="lp2-pinhead"
              aria-label={m.time ?? `Moment ${i + 1}`}
              style={{ width: w, height: h, left: -w / 2, top: -STEM - h }}
              onClick={() => (on ? onOpen(i) : onSelect(i))}
            >
              <span style={{ backgroundImage: `url(${m.src})` }} />
            </button>
          </div>
        )
      })}

      <button
        type="button"
        className={`lp2-play ${selected !== null ? 'on' : ''}`}
        onClick={() => selected !== null && onOpen(selected)}
        tabIndex={selected === null ? -1 : 0}
      >
        <svg viewBox="0 0 12 14" width="11" height="13" aria-hidden>
          <path d="M1.5 1.2v11.6L11 7z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        Play This Moment
      </button>
    </div>
  )
}
