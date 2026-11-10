import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { FlowAlbum } from '../data'
import { DESIGN_H, DESIGN_W, useDesignScale } from '../useDesignScale'

/** 톤암 각도(CSS, 시계방향 +): 재생 중엔 LP 위, 멈추면 바깥으로 */
const ARM_ON = 22.8
const ARM_OFF = 4
const ARM_LEN = 322
const SWIPE_PX = 40

interface Props {
  album: FlowAlbum | null
  active: boolean
  onBack: () => void
}

export default function LpView({ album, active, onBack }: Props) {
  const { ref, k } = useDesignScale<HTMLDivElement>()
  const moments = album?.moments ?? []
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const start = useRef<{ x: number } | null>(null)

  // 화면이 옆으로 넘어온 뒤에 재생 시작, 떠나면 정지
  useEffect(() => {
    if (!active) {
      setPlaying(false)
      return
    }
    setIdx(0)
    const t = window.setTimeout(() => setPlaying(true), 450)
    return () => clearTimeout(t)
  }, [active, album?.id])

  const moment = moments[idx] ?? null

  const onDown = (e: PointerEvent) => {
    start.current = { x: e.clientX }
  }
  const onUp = (e: PointerEvent) => {
    const s = start.current
    start.current = null
    if (!s) return
    const dx = (e.clientX - s.x) / k
    if (dx < -SWIPE_PX && idx < moments.length - 1) setIdx(idx + 1)
    else if (dx > SWIPE_PX && idx > 0) setIdx(idx - 1)
    else if (Math.abs(dx) < 8) setPlaying((p) => !p)
  }

  return (
    <div className="l-root" ref={ref}>
      <div
        className="design"
        style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${k})` }}
        onPointerDown={onDown}
        onPointerUp={onUp}
      >
        <div className={`l-disc ${playing ? 'spin' : ''}`}>
          <div className="l-label">
            {moment && <img key={moment.id} src={moment.src} alt="" draggable={false} />}
          </div>
        </div>

        {!moment && <p className="l-empty">No moments yet</p>}

        <div className="l-arm-base" />
        <div
          className="l-arm"
          style={{ transform: `rotate(${playing ? ARM_ON : ARM_OFF}deg)`, height: ARM_LEN }}
        >
          <i className="l-arm-bar" />
          <i className="l-arm-head" />
        </div>

        {moments.length > 0 && (
          <div className="l-dots" aria-label={`Moment ${idx + 1} of ${moments.length}`}>
            {moments.map((m, i) => (
              <i key={m.id} className={i === idx ? 'on' : ''} />
            ))}
          </div>
        )}
      </div>

      <button type="button" className="l-back" onClick={onBack} aria-label="Back to albums">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path
            d="M15 5l-7 7 7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
