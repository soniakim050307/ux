import { useEffect, useState } from 'react'
import { useDesignScale } from '../useDesignScale'
import DeliveryMap from './DeliveryMap'

const W = 393
const H = 852
interface Props {
  city: string
  onFinish: (startedAt: number) => void
}

/** 프레스 → 포장 → 비행기로 배송 지도 */
export default function PressSeq({ city, onFinish }: Props) {
  const { ref, k } = useDesignScale<HTMLDivElement>(W)
  const [step, setStep] = useState(0) // 0~4 프레스, 5 포장, 6 지도
  const [startedAt] = useState(() => Date.now())

  useEffect(() => {
    const at = [500, 1000, 2600, 3700, 6100, 9700]
    const ts = at.map((ms, i) => window.setTimeout(() => setStep(i + 1), ms))
    return () => ts.forEach(clearTimeout)
  }, [])

  const now = new Date()
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
      : step <= 3
        ? { cx: 196, cy: 517, w: 123, h: 94 }
        : { cx: 196, cy: 444, w: 106, h: 106 }
  const lp = done
    ? { l: 22, t: 270, w: 348, h: 348 }
    : { l: -8, t: 370, w: 409, h: 333 }
  const glow = ['0 0 0 0 rgba(255,255,255,0)', '0 0 70px 20px rgba(255,255,255,.28)', '0 0 90px 34px rgba(255,255,255,.5)', '0 0 100px 44px rgba(255,255,255,.65)', '0 0 0 0 rgba(255,255,255,0)'][Math.min(step, 4)]


  return (
    <div className="l-root cap ps" ref={ref} style={{ zIndex: 70 }}>
      <div className="design" style={{ width: W, height: H, transform: `scale(${k})`, background: bg }}>
        {/* 프레스 */}
        <div className={`ps-fade ${packed ? 'off' : ''}`}>
          <div className={`ps-title ${pressing ? 'on' : ''}`}>Press!</div>
          <div className={`ps-title c ${done ? 'on' : ''}`}>Completed</div>
          <div
            className={`ps-lp ${step === 3 ? 'dip' : ''}`}
            style={{ left: lp.l, top: lp.t, width: lp.w, height: lp.h, boxShadow: glow }}
          >
            <i className={`ps-hole ${done ? '' : 'on'}`} />
          </div>
          {step === 3 && <i className="ps-ripple" />}
          {step === 3 && <i className="ps-ripple b" />}
          <div
            className={`ps-pink ${step <= 1 ? 'hover' : ''} ${step === 3 ? 'press' : ''}`}
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
        {map && <DeliveryMap city={city} startedAt={startedAt} days={3} onFinish={() => onFinish(startedAt)} />}
      </div>
    </div>
  )
}
