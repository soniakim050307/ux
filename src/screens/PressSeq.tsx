import { useEffect, useRef, useState } from 'react'
import { useDesignScale } from '../useDesignScale'

const W = 393
const H = 852
const MAP_TOP = 104
// world-map.svg 안에서의 좌표 (Mercator, 393 × 373)
const PARIS = { x: 52, y: MAP_TOP + 130 }
const SEOUL = { x: 340, y: MAP_TOP + 166 }
const CTRL = { x: 196, y: MAP_TOP + 40 }
const DAYS = 3
const SHIP = 0.46 // 지금 도착 경로의 어디쯤인지

const bez = (t: number) => {
  const u = 1 - t
  return {
    x: u * u * PARIS.x + 2 * u * t * CTRL.x + t * t * SEOUL.x,
    y: u * u * PARIS.y + 2 * u * t * CTRL.y + t * t * SEOUL.y,
  }
}
const tangent = (t: number) => {
  const u = 1 - t
  const dx = 2 * u * (CTRL.x - PARIS.x) + 2 * t * (SEOUL.x - CTRL.x)
  const dy = 2 * u * (CTRL.y - PARIS.y) + 2 * t * (SEOUL.y - CTRL.y)
  return (Math.atan2(dy, dx) * 180) / Math.PI
}

interface Props {
  city: string
  onFinish: () => void
}

/** 프레스 → 포장 → 비행기로 배송 지도 */
export default function PressSeq({ city, onFinish }: Props) {
  const { ref, k } = useDesignScale<HTMLDivElement>(W)
  const [step, setStep] = useState(0) // 0~4 프레스, 5 포장, 6 지도
  const [p, setP] = useState(0)
  const raf = useRef(0)

  useEffect(() => {
    const at = [700, 1700, 2700, 3700, 5600, 9200]
    const ts = at.map((ms, i) => window.setTimeout(() => setStep(i + 1), ms))
    return () => ts.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (step < 6) return
    const t0 = performance.now()
    const tick = (t: number) => {
      const e = Math.min(1, (t - t0 - 600) / 3600)
      const v = e <= 0 ? 0 : 1 - Math.pow(1 - e, 3)
      setP(v * SHIP)
      if (e < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [step])

  const now = new Date()
  const arrive = new Date(now.getTime() + DAYS * 86400000)
  const fmtD = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const stamp = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`

  const pressing = step <= 3
  const done = step >= 4
  const packed = step >= 5
  const map = step >= 6
  const bg = ['#545e85', '#3d4263', '#2e3349', '#232638', '#545e85', '#545e85', '#545e85'][step]

  // 분홍 원판(레이블)의 위치와 크기
  const pink =
    step <= 1
      ? { cx: 196, cy: 293, w: 123, h: 94 }
      : step === 2
        ? { cx: 196, cy: 423, w: 123, h: 94 }
        : step === 3
          ? { cx: 196, cy: 523, w: 126, h: 84 }
          : { cx: 196, cy: 444, w: 106, h: 106 }
  const lp = done
    ? { l: 22, t: 270, w: 348, h: 348 }
    : { l: -8, t: 370, w: 409, h: 333 }
  const glow = ['0 0 0 0 rgba(255,255,255,0)', '0 0 70px 20px rgba(255,255,255,.28)', '0 0 90px 34px rgba(255,255,255,.5)', '0 0 100px 44px rgba(255,255,255,.65)', '0 0 0 0 rgba(255,255,255,0)'][Math.min(step, 4)]

  const dots = Array.from({ length: 46 }, (_, i) => i / 45)
  const pos = bez(p)

  return (
    <div className="l-root cap ps" ref={ref} style={{ zIndex: 70 }}>
      <div className="design" style={{ width: W, height: H, transform: `scale(${k})`, background: bg }}>
        {/* 프레스 */}
        <div className={`ps-fade ${packed ? 'off' : ''}`}>
          <div className={`ps-title ${pressing ? 'on' : ''}`}>Press!</div>
          <div className={`ps-title c ${done ? 'on' : ''}`}>Completed</div>
          <div
            className="ps-lp"
            style={{ left: lp.l, top: lp.t, width: lp.w, height: lp.h, boxShadow: glow }}
          >
            <i className={`ps-hole ${done ? '' : 'on'}`} />
          </div>
          <div
            className="ps-pink"
            style={{ left: pink.cx - pink.w / 2, top: pink.cy - pink.h / 2, width: pink.w, height: pink.h }}
          />
          <div className={`ps-city ${done ? 'on' : ''}`}>{city}</div>
        </div>

        {/* 포장 */}
        {packed && (
          <div className={`pk ${map ? 'off' : ''}`}>
            <div className="ps-title c on">Completed</div>
            <div className="pk-box">
              <i className="pk-tape h" />
              <i className="pk-tape v" />
              <div className="pk-stamp">
                <span>{city}</span>
                <span>{stamp}</span>
                <span>Seoul, Korea</span>
              </div>
            </div>
          </div>
        )}

        {/* 배송 지도 */}
        {map && (
          <div className="mp">
            <img className="mp-map" src={`${import.meta.env.BASE_URL}img/world-map.svg`} alt="" style={{ top: MAP_TOP }} />
            <svg className="mp-svg" viewBox={`0 0 ${W} ${H}`}>
              {dots.map((t) => {
                const q = bez(t)
                const past = t <= p
                return <circle key={t} cx={q.x} cy={q.y} r={past ? 2.4 : 2} fill={past ? '#2f365a' : '#fff'} opacity={past ? 0.9 : 0.9} />
              })}
              <g transform={`translate(${SEOUL.x} ${SEOUL.y})`}>
                <circle r="7" fill="none" stroke="#fff" strokeWidth="2" />
                <circle r="2.5" fill="#fff" />
              </g>
              <g transform={`translate(${PARIS.x} ${PARIS.y})`}>
                <circle r="4" fill="#2f365a" />
              </g>
              <g transform={`translate(${pos.x} ${pos.y}) rotate(${tangent(p) * 0.6})`}>
                <polygon points="24,0 -18,-15 -4,2" fill="#f7f4ea" />
                <polygon points="24,0 -4,2 -14,13" fill="#cfcabc" />
                <polygon points="-4,2 -18,-15 -14,13" fill="#e4dfd1" />
                <circle cx="-2" cy="-8" r="13" fill="#262528" />
                <circle cx="-2" cy="-8" r="5" fill="#e9e4d8" />
              </g>
            </svg>

            <div className="mp-sheet">
              <i className="mp-grab" />
              <div className="mp-chip">
                <b />
                IN TRANSIT
              </div>
              <p className="mp-lead">Your LP will arrive in</p>
              <div className="mp-days">
                {DAYS}
                <span>Days</span>
              </div>

              <div className="mp-route">
                <div className="mp-city">
                  <b>{city.split(',')[0]}</b>
                  <em>Departed {fmtD(now)}</em>
                </div>
                <div className="mp-track">
                  <i style={{ width: `${p * 100}%` }} />
                  <svg viewBox="0 0 16 16" width="16" height="16" style={{ left: `${p * 100}%` }}>
                    <path d="M15 8L2 2l3 6-3 6z" fill="#373d56" />
                  </svg>
                </div>
                <div className="mp-city r">
                  <b>Seoul</b>
                  <em>Arrives {fmtD(arrive)}</em>
                </div>
              </div>

              <button type="button" className="mp-btn" onClick={onFinish}>
                Back to my records
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
