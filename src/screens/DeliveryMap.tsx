import { useEffect, useRef, useState } from 'react'

const W = 393
const H = 852
const MAP_TOP = 96
// Figma 909:1451 의 호 (캔버스 393 × 852 기준)
const PARIS = { x: 58, y: 271 }
const SEOUL = { x: 316, y: 286 }
const CTRL = { x: 188, y: 191 }
const SHIP = 0.46 // 처음 보여줄 위치
const DRIFT = 0.014 // 이후 초당 이동량 (천천히 계속 앞으로)
const MAXP = 0.94

const bez = (t: number) => {
  const u = 1 - t
  return {
    x: u * u * PARIS.x + 2 * u * t * CTRL.x + t * t * SEOUL.x,
    y: u * u * PARIS.y + 2 * u * t * CTRL.y + t * t * SEOUL.y,
  }
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
      const el = t - t0 - 600
      const e = Math.min(1, el / 3600)
      const v = e <= 0 ? 0 : 1 - Math.pow(1 - e, 3)
      const extra = el > 3600 ? ((el - 3600) / 1000) * DRIFT : 0
      setP(Math.min(MAXP, v * SHIP + extra))
      if (v * SHIP + extra < MAXP) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  const left = Math.max(0, startedAt + days * 86400000 - Date.now())
  const DAYS = Math.floor(left / 86400000)
  const HOURS = Math.floor((left % 86400000) / 3600000)
  const fmtD = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const now = new Date(startedAt)
  const arrive = new Date(startedAt + days * 86400000)
  const dots = Array.from({ length: 46 }, (_, i) => i / 45)
  const pos = bez(p)

  return (
    <div className="mp">
            <img className="mp-map" src={`${import.meta.env.BASE_URL}img/map-new.png`} alt="" style={{ top: MAP_TOP }} />
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
              {/* Figma 909:1463 그대로 (62×50) */}
              <g transform={`translate(${pos.x} ${pos.y}) translate(-31 -25)`}>
                <path d="M60.5146 11.0845C51.1813 23.4179 32.1146 48.0845 30.5146 48.0845C29.301 48.0845 24.5586 41.3721 20.7387 35.5845L9.01463 40.0845L12.0146 24.5845C8.01463 20.9179 0.114633 13.2845 0.514633 12.0845C0.914633 10.8845 40.6813 10.9179 60.5146 11.0845Z" fill="#D9D9D9" />
                <path d="M9.01463 40.0845L17.5146 30.5845L60.5146 11.0845M17.5146 30.5845C18.4001 31.9932 19.5226 33.742 20.7387 35.5845M12.0146 24.5845C8.01463 20.9179 0.114633 13.2845 0.514633 12.0845C0.914633 10.8845 40.6813 10.9179 60.5146 11.0845C51.1813 23.4179 32.1146 48.0845 30.5146 48.0845C29.301 48.0845 24.5586 41.3721 20.7387 35.5845M60.5146 11.0845L12.0146 24.5845M12.0146 24.5845L9.01463 40.0845L20.7387 35.5845" fill="none" stroke="#B9B9B9" />
                <circle cx="31" cy="16.5" r="16.5" fill="#363636" />
                <circle cx="31.117" cy="16.617" r="5.61702" fill="#D9D9D9" />
                <path d="M17 31.5L60 12C50.6667 24.3333 31.6 49 30 49C28.7864 49 24.0439 42.2876 20.2241 36.5L8.5 41L17 31.5Z" fill="#D9D9D9" />
                <path d="M20.2241 36.5L8.5 41L17 31.5L60 12C50.6667 24.3333 31.6 49 30 49C28.7864 49 24.0439 42.2876 20.2241 36.5ZM17 31.5C17.8854 32.9086 19.008 34.6575 20.2241 36.5" fill="none" stroke="#B9B9B9" />
              </g>
            </svg>

            <div className="mp-sheet">
              <i className="mp-grab" />
              <p className="mp-lead">Your LP will arrive in</p>
              <div className="mp-days">
                <b>{DAYS}</b>
                <span>{DAYS === 1 ? 'day' : 'days'}</span>
                <b>{HOURS}</b>
                <span>{HOURS === 1 ? 'hour' : 'hours'}</span>
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
