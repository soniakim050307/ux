import type { FlowAlbum } from '../data'

/**
 * 눕힌 LP (Figma Section 3: 393 × 852 기준).
 * 두 상태 — 아무것도 고르지 않은 상태(REST)와 핀을 하나 고른 상태(SEL) — 사이를 CSS 전환으로 오간다.
 */
const BASE = 800 // 원판 요소의 기준 지름. 아래 상태값에 맞춰 scale 로 타원을 만든다.
const REST = { cx: 108.5, cy: 467, w: 734, h: 421, edge: 15 }
const SEL = { cx: 33.7, cy: 549.2, w: 786, h: 361, edge: 12.2 }

/** 원판 위 핀 자리 (원판 중심 기준 -1 ~ 1). 앞의 3개는 Figma 위치를 그대로 옮긴 값 */
const SLOTS: [number, number][] = [
  [0.425, -0.627],
  [0.311, -0.185],
  [0.597, 0.314],
  [-0.4, -0.45],
  [-0.2, 0.5],
  [0.7, -0.02],
  [0.1, 0.72],
  [-0.6, 0.2],
]
/** 핀 머리 크기와, 머리 중심에서 바닥까지 높이(REST 기준) */
const HEAD = [24, 25, 27]
const PIN_H = [63, 65, 71]
const FOOT_W = [17, 17, 19]
const SEL_CIRCLE = 182
const SEL_STEM = 61

interface Props {
  album: FlowAlbum | null
  selected: number | null
  onSelect: (i: number | null) => void
  onOpen: (i: number) => void
}

export default function LaidLp({ album, selected, onSelect, onOpen }: Props) {
  const moments = album?.moments ?? []
  const g = selected === null ? REST : SEL
  const tf = (dy: number) =>
    `translate(${g.cx - BASE / 2}px, ${g.cy - BASE / 2 + dy}px) scale(${g.w / BASE}, ${g.h / BASE})`
  const squash = g.h / REST.h

  return (
    <div className="lp2" onClick={(e) => e.target === e.currentTarget && onSelect(null)}>
      <div className={`lp2-title ${selected !== null ? 'on' : ''}`}>
        <h2>{album?.city ?? ''}</h2>
        <p>
          {moments.length} MOMENT{moments.length === 1 ? '' : 'S'}
        </p>
      </div>

      <div className="lp2-edge" style={{ transform: tf(g.edge) }} />
      <div className="lp2-disc" style={{ transform: tf(0) }}>
        {[0.913, 0.887, 0.778, 0.61].map((f) => (
          <i key={f} className="lp2-ring" style={{ inset: `${((1 - f) / 2) * 100}%` }} />
        ))}
        <i className="lp2-label" />
      </div>

      {moments.map((m, i) => {
        const [ux, uy] = SLOTS[i % SLOTS.length]
        const fx = g.cx + ux * (g.w / 2)
        const fy = g.cy + uy * (g.h / 2)
        const on = selected === i
        const hw = on ? SEL_CIRCLE : (HEAD[i] ?? 25)
        const hh = on ? SEL_CIRCLE : (HEAD[i] ?? 25) * (selected === null ? 1 : 0.81)
        const stem = on
          ? SEL_STEM
          : Math.max(8, (PIN_H[i] ?? 66) * squash - hh / 2)
        const fw = FOOT_W[i] ?? 17
        return (
          <div key={m.id} className={`lp2-pin ${on ? 'on' : ''}`} style={{ left: fx, top: fy }}>
            <i className="lp2-foot" style={{ width: fw, height: fw * 0.55, left: -fw / 2, top: -fw * 0.275 }} />
            <i className="lp2-stem" style={{ height: stem, top: -stem }} />
            <button
              type="button"
              className="lp2-pinhead"
              aria-label={m.time ?? `Moment ${i + 1}`}
              style={{ width: hw, height: hh, left: -hw / 2, top: -stem - hh }}
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
        <svg viewBox="0 0 12 14" width="10" height="12" aria-hidden>
          <path d="M1 1v12l10-6z" fill="currentColor" />
        </svg>
        Play This Moment
      </button>
    </div>
  )
}
