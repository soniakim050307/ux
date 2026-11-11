import { useEffect, useRef, useState } from 'react'

const W = 393
const H = 852
const MAP_TOP = 104
// world-map.svg 안에서의 좌표 (Mercator, 393 × 373)
const PARIS = { x: 52, y: MAP_TOP + 130 }
const SEOUL = { x: 340, y: MAP_TOP + 166 }
const CTRL = { x: 196, y: MAP_TOP + 40 }
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


interface MapProps {
  city: string
  startedAt: number
  days: number
  buttonLabel?: string
  onFinish: () => void
}

/** 배송 지도 + 하단 시트. 디자인 캔버스(393×852) 안에 absolute 로 놓는다. */
export default function DeliveryMap({ city, startedAt, days, buttonLabel = 'Back to my records', onFinish }: MapProps) {
  const [p, setP] = useState(0)
  const raf = useRef(0)
  useEffect(() => {
    const t0 = performance.now()
    const tick = (t: number) => {
      const e = Math.min(1, (t - t0 - 600) / 3600)
      const v = e <= 0 ? 0 : 1 - Math.pow(1 - e, 3)
      setP(v * SHIP)
      if (e < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  const DAYS = Math.max(0, Math.ceil((startedAt + days * 86400000 - Date.now()) / 86400000))
  const fmtD = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const now = new Date(startedAt)
  const arrive = new Date(startedAt + days * 86400000)
  const dots = Array.from({ length: 46 }, (_, i) => i / 45)
  const pos = bez(p)

  return (
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
                {buttonLabel}
              </button>
            </div>
          </div>
  )
}
