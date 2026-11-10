import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { FlowAlbum } from '../data'
import { playMusic } from '../music'
import { DESIGN_H, DESIGN_W, useDesignScale } from '../useDesignScale'

/** 톤암 각도(CSS, 시계방향 +): 0 = 아래로 곧게, 클수록 LP 쪽으로 기운다 */
const ARM_ON = 22.8
const ARM_OFF = 4
const ARM_MAX = 28
const ARM_DROP = 13 // 이 각도를 넘기면 판 위에 내려놓은 것으로 본다
const ARM_LEN = 322
const PIVOT = { x: 307, y: 230 }
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
  const [dragAngle, setDragAngle] = useState<number | null>(null)

  const swipe = useRef<{ x: number } | null>(null)
  const armDrag = useRef<{ moved: number; lastX: number; lastY: number } | null>(null)

  // 화면을 떠나거나 앨범이 바뀌면 바늘을 올리고 처음 상태로
  useEffect(() => {
    setPlaying(false)
    setIdx(0)
  }, [active, album?.id])

  const moment = moments[idx] ?? null

  // 재생 중이면 음악도 함께. moment 가 바뀌면 곡도 바뀐다.
  useEffect(() => {
    if (!playing || !moment) return
    return playMusic({ src: moment.audio, seed: idx })
  }, [playing, moment, idx])

  /* ---------- 톤암을 끌어서 판 위에 올리기 ---------- */
  const angleAt = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    const px = (e.clientX - r.left) / k
    const py = (e.clientY - r.top) / k
    const a = (Math.atan2(-(px - PIVOT.x), py - PIVOT.y) * 180) / Math.PI
    return Math.max(0, Math.min(ARM_MAX, a))
  }
  const onArmDown = (e: PointerEvent) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    armDrag.current = { moved: 0, lastX: e.clientX, lastY: e.clientY }
    setDragAngle(playing ? ARM_ON : ARM_OFF)
  }
  const onArmMove = (e: PointerEvent) => {
    const d = armDrag.current
    if (!d) return
    d.moved += Math.abs(e.clientX - d.lastX) + Math.abs(e.clientY - d.lastY)
    d.lastX = e.clientX
    d.lastY = e.clientY
    if (d.moved > 6) setDragAngle(angleAt(e))
  }
  const onArmUp = (e: PointerEvent) => {
    e.stopPropagation()
    const d = armDrag.current
    armDrag.current = null
    if (!d) return
    if (d.moved <= 6) setPlaying((p) => !p) // 그냥 탭하면 올리기/내리기
    else setPlaying(angleAt(e) > ARM_DROP && moments.length > 0)
    setDragAngle(null)
  }

  /* ---------- 좌우로 밀어서 moment 바꾸기 ---------- */
  const onDown = (e: PointerEvent) => {
    swipe.current = { x: e.clientX }
  }
  const onUp = (e: PointerEvent) => {
    const s = swipe.current
    swipe.current = null
    if (!s) return
    const dx = (e.clientX - s.x) / k
    if (dx < -SWIPE_PX && idx < moments.length - 1) setIdx(idx + 1)
    else if (dx > SWIPE_PX && idx > 0) setIdx(idx - 1)
  }

  const angle = dragAngle ?? (playing ? ARM_ON : ARM_OFF)
  const showMedia = playing && moment !== null

  return (
    <div className="l-root" ref={ref}>
      <div
        className="design"
        style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${k})` }}
        onPointerDown={onDown}
        onPointerUp={onUp}
      >
        <div className={`l-disc ${playing ? 'run' : ''}`}>
          <div className="l-label">
            {moment &&
              (moment.kind === 'video' ? (
                <video
                  key={moment.id}
                  className={showMedia ? 'on' : ''}
                  src={moment.src}
                  muted
                  loop
                  playsInline
                  autoPlay={playing}
                />
              ) : (
                <img
                  key={moment.id}
                  className={showMedia ? 'on' : ''}
                  src={moment.src}
                  alt=""
                  draggable={false}
                />
              ))}
          </div>
        </div>

        {!moment ? (
          <p className="l-hint">No moments yet</p>
        ) : (
          !playing && <p className="l-hint nudge">Drop the needle on the record</p>
        )}

        <div className="l-arm-base" />
        <div
          className={`l-arm ${dragAngle !== null ? 'drag' : ''}`}
          style={{ transform: `rotate(${angle}deg)`, height: ARM_LEN }}
          onPointerDown={onArmDown}
          onPointerMove={onArmMove}
          onPointerUp={onArmUp}
          onPointerCancel={onArmUp}
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
