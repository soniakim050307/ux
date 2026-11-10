import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { FlowAlbum } from '../data'
import { playMusic } from '../music'
import { DESIGN_H, DESIGN_W, useDesignScale } from '../useDesignScale'
import LaidLp from './LaidLp'
import MomentDetail from './MomentDetail'

/**
 * 톤암. angle 은 CSS 각도(시계방향 +): 0 = 아래로 곧게, 클수록 LP 쪽으로 기운다.
 * 전체 화면에서는 LP 가 커지고 톤암 축이 화면 밖 오른쪽으로 나간다.
 */
const ARM = {
  normal: { pivot: { x: 307, y: 230 }, on: 22.8, off: 4, drop: 13, max: 28 },
  full: { pivot: { x: 467, y: 289 }, on: 29.5, off: 20, drop: 24.7, max: 36 },
}
const ARM_LEN = 322
const SWIPE_PX = 40
/** 한 moment 를 보여주는 시간. 재생 중엔 이어서 다음 moment 로 넘어간다. */
const MOMENT_MS = 9000

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
  const [sub, setSub] = useState<0 | 1>(0) // 0: LP 재생, 1: 눕힌 LP
  const [full, setFull] = useState(false)
  const [pin, setPin] = useState<number | null>(null)
  const [detail, setDetail] = useState<number | null>(null)

  const swipe = useRef<{ x: number } | null>(null)
  const armDrag = useRef<{ moved: number; lastX: number; lastY: number } | null>(null)

  // 화면을 떠나거나 앨범이 바뀌면 처음 상태로
  useEffect(() => {
    setPlaying(false)
    setIdx(0)
    setSub(0)
    setFull(false)
    setPin(null)
    setDetail(null)
  }, [active, album?.id])

  const moment = moments[idx] ?? null
  const geo = full ? ARM.full : ARM.normal

  // 재생 중이면 음악도 함께. moment 가 바뀌면 곡도 바뀐다.
  useEffect(() => {
    if (!playing || !moment) return
    return playMusic({ src: moment.audio, seed: idx, start: moment.audioStart })
  }, [playing, moment, idx])

  // 재생 중엔 다음 moment 로 이어서
  useEffect(() => {
    if (!playing || moments.length < 2) return
    const t = window.setTimeout(() => setIdx((i) => (i + 1) % moments.length), MOMENT_MS)
    return () => clearTimeout(t)
  }, [playing, idx, moments.length])

  /* ---------- 톤암을 끌어서 판 위에 올리기 ---------- */
  const angleAt = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    const px = (e.clientX - r.left) / k
    const py = (e.clientY - r.top) / k
    const a = (Math.atan2(-(px - geo.pivot.x), py - geo.pivot.y) * 180) / Math.PI
    return Math.max(0, Math.min(geo.max, a))
  }
  const onArmDown = (e: PointerEvent) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    armDrag.current = { moved: 0, lastX: e.clientX, lastY: e.clientY }
    setDragAngle(playing ? geo.on : geo.off)
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
    if (d.moved <= 6) setPlaying((p) => !p && moments.length > 0) // 탭하면 올리기/내리기
    else setPlaying(angleAt(e) > geo.drop && moments.length > 0)
    setDragAngle(null)
  }

  /* ---------- 좌우로 밀어서 LP ↔ 눕힌 LP ---------- */
  const goSub = (s: 0 | 1) => {
    if (s === 1) setPlaying(false)
    setSub(s)
  }
  const onDown = (e: PointerEvent) => {
    swipe.current = { x: e.clientX }
  }
  const onUp = (e: PointerEvent) => {
    const s = swipe.current
    swipe.current = null
    if (!s) return
    const dx = (e.clientX - s.x) / k
    if (dx < -SWIPE_PX && sub === 0) goSub(1)
    else if (dx > SWIPE_PX && sub === 1) goSub(0)
  }

  const angle = dragAngle ?? (playing ? geo.on : geo.off)
  const showMedia = playing && moment !== null

  return (
    <div className={`l-root ${full ? 'full' : ''}`} ref={ref}>
      <div
        className="design"
        style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${k})` }}
        onPointerDown={onDown}
        onPointerUp={onUp}
      >
        <div className="lv-strip" style={{ transform: `translateX(${-sub * DESIGN_W}px)` }}>
          {/* ───── 1: LP 재생 ───── */}
          <div className="lv-sub" style={{ left: 0 }}>
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

            <div
              className="l-arm-base"
              style={{ left: geo.pivot.x - 46, top: geo.pivot.y - 46 }}
            />
            <div
              className={`l-arm ${dragAngle !== null ? 'drag' : ''}`}
              style={{
                left: geo.pivot.x,
                top: geo.pivot.y,
                height: ARM_LEN,
                transform: `rotate(${angle}deg)`,
              }}
              onPointerDown={onArmDown}
              onPointerMove={onArmMove}
              onPointerUp={onArmUp}
              onPointerCancel={onArmUp}
            >
              <i className="l-arm-bar" />
              <i className="l-arm-head" />
            </div>
          </div>

          {/* ───── 2: 눕힌 LP — 순간마다 핀 ───── */}
          <div className="lv-sub" style={{ left: DESIGN_W }}>
            <LaidLp album={album} selected={pin} onSelect={setPin} onOpen={setDetail} />
          </div>
        </div>

        <div className="l-pages" aria-label={`Page ${sub + 1} of 2`}>
          <i className={sub === 0 ? 'on' : ''} />
          <i className={sub === 1 ? 'on' : ''} />
        </div>
      </div>

      <button type="button" className="l-back" onClick={onBack} aria-label="Back to albums">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {sub === 0 && (
        <button
          type="button"
          className="l-full"
          onClick={() => setFull((f) => !f)}
          aria-label={full ? 'Exit full screen' : 'Full screen'}
        >
          {full ? (
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      )}

      {album && detail !== null && (
        <MomentDetail
          album={album}
          index={detail}
          onIndex={(i) => {
            setDetail(i)
            setPin(i)
          }}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  )
}
