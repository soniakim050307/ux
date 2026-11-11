import { useEffect, useState } from 'react'
import { useDesignScale } from '../useDesignScale'
import { ArmRod, Head } from '../Tonearm'

const W = 393
const H = 852
// 침이 올라가 있는 곳 → 홈에 내려앉은 곳
const UP = { x: 222, y: 388, a: 3 }
const DOWN = { x: 262, y: 448, a: -22 }

/** 판(타원) 중심·반지름: CSS .eg-disc (left -350, top 312, 726 × 238) 기준 */
const DISC = { cx: -350 + 363, cy: 312 + 119, rx: 363, ry: 119 }
/** 바늘 끝 위치: 팔은 (x, y)에서 a도 회전, 헤드는 (-26, 20) 만큼 옮겨 그려지고 바늘 끝은 헤드의 (0, 0) */
const tip = (p: { x: number; y: number; a: number }) => {
  const r = (p.a * Math.PI) / 180
  return { x: p.x - 26 * Math.cos(r) - 20 * Math.sin(r), y: p.y - 26 * Math.sin(r) + 20 * Math.cos(r) }
}
/** 바늘 끝을 지나고 판과 중심이 같은 타원을 따라, 판이 도는 방향으로 새겨지는 홈 */
const groovePath = () => {
  const t = tip(DOWN)
  const k = DISC.ry / DISC.rx
  const dx = t.x - DISC.cx
  const dy = t.y - DISC.cy
  const rx = Math.hypot(dx, dy / k)
  const ry = rx * k
  const a0 = Math.atan2(dy / ry, dx / rx)
  const a1 = a0 + (70 * Math.PI) / 180
  const ex = DISC.cx + rx * Math.cos(a1)
  const ey = DISC.cy + ry * Math.sin(a1)
  return `M${t.x.toFixed(1)} ${t.y.toFixed(1)} A${rx.toFixed(1)} ${ry.toFixed(1)} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`
}

interface Props {
  city: string
  label: string
  onDone: () => void
}

/** 저장하면 LP 위에 바늘이 내려앉아 기록이 새겨지는 연출 */
export default function Engrave({ city, label, onDone }: Props) {
  const { ref, k } = useDesignScale<HTMLDivElement>(W)
  const [phase, setPhase] = useState<0 | 1 | 2>(0)

  useEffect(() => {
    const ts = [
      window.setTimeout(() => setPhase(1), 500),
      window.setTimeout(() => setPhase(2), 3300),
      window.setTimeout(onDone, 5600),
    ]
    return () => ts.forEach(clearTimeout)
  }, [onDone])

  const pos = phase === 1 ? DOWN : UP
  return (
    <div className="l-root cap eg" ref={ref}>
      <div className="design" style={{ width: W, height: H, transform: `scale(${k})` }}>
        <div className="eg-edge" />
        <div className="eg-disc">
          <i className="eg-label" />
          <i className="eg-hole" />
        </div>
        <svg className="eg-groove" viewBox={`0 0 ${W} ${H}`}>
          <path
            d={groovePath()}
            fill="none"
            stroke="#a89f90"
            strokeWidth="2"
            strokeLinecap="round"
            pathLength={1}
            className={phase >= 1 ? 'draw' : ''}
          />
        </svg>

        <div
          className={`eg-arm ${phase === 1 ? 'work' : ''}`}
          style={{ transform: `translate(${pos.x}px, ${pos.y}px) rotate(${pos.a}deg)` }}
        >
          <svg className="eg-tone" width="1" height="1" overflow="visible">
            <g transform="translate(-26 20)">
              <ArmRod x1={30} y1={-62} x2={450} y2={-62} />
              <Head />
            </g>
          </svg>
        </div>

        <div className={`eg-done ${phase === 2 ? 'on' : ''}`}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M7.5 12.5l3 3 6-6.5" />
          </svg>
          <b>Recorded</b>
          <span>{label} is engraved on your LP</span>
        </div>

        <div className="eg-text">
          <b>{city}</b>
          <span>{label}</span>
        </div>
      </div>
    </div>
  )
}
