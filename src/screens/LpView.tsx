import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { FlowAlbum } from '../data'
import { playMusic } from '../music'
import { useDesignScale } from '../useDesignScale'
import LaidLp from './LaidLp'
import MomentDetail from './MomentDetail'

/** Figma Section 3 의 화면 크기 */
const W = 393
const H = 852

/**
 * 서 있는 LP 의 두 모습 (페이지 0: 플레이어, 페이지 1: 크게 보기).
 * 둘 다 같은 요소가 위치·크기만 바뀐다 → CSS 전환으로 LP 가 커지며 가운데로 온다.
 */
const SCENE = [
  { disc: { cx: 98, cy: 382, d: 496 }, photo: 226, pivot: { x: 329, y: 203 }, armScale: 1 },
  { disc: { cx: 195, cy: 426, d: 679 }, photo: 372, pivot: { x: 510, y: 180 }, armScale: 1.372 },
] as const

/** 톤암 부품 (페이지 0 기준, 축 중심(0,0) 으로부터의 상대 좌표). Figma 값을 그대로 옮김 */
const ARM_PARTS: {
  x: number
  y: number
  w: number
  h: number
  r: number
  c: string
  radius?: string
}[] = [
  { x: 0, y: 24, w: 105, h: 154, r: 0, c: '#d9d9d9', radius: '200px' },
  { x: 0, y: 0, w: 101, h: 101, r: 0, c: '#ececec', radius: '200px' },
  { x: -13, y: 1, w: 41, h: 38, r: -65, c: '#d9d9d9', radius: '55px 5px 5px 55px' },
  { x: 17, y: 14, w: 41, h: 24, r: -65, c: '#d9d9d9', radius: '0 0 5px 5px' },
  { x: -45, y: 146, w: 274, h: 13, r: -65, c: '#959595' },
  { x: -107, y: 277, w: 16, h: 15, r: -65, c: '#d9d9d9' },
  { x: -115, y: 295, w: 30, h: 18, r: -65, c: '#d9d9d9' },
  { x: -133, y: 318, w: 60, h: 28, r: -35, c: '#d9d9d9', radius: '10px' },
]

/** 앞의 2개는 LP 뒤에 고정된 받침, 나머지는 LP 위에서 돌아가는 암 */
const BASE_N = 2

/** 톤암이 판 위에 있을 때가 0°. 들어 올리면 바깥쪽(반시계)으로 돈다. */
const ARM_LIFT = -25
const ARM_DROP = -12
const ARM_MIN = -32
const ARM_MAX = 6
/** 판 위에 있을 때 축에서 바늘(카트리지)로 향하는 각도 */
const ARM_BASE_ANGLE = (Math.atan2(133, 318) * 180) / Math.PI
const SWIPE_PX = 40
/** 한 moment 를 보여주는 시간. 재생 중엔 이어서 다음 moment 로 넘어간다. */
const MOMENT_MS = 9000
const PROG_W = 280

interface Props {
  album: FlowAlbum | null
  active: boolean
  onBack: () => void
}

export default function LpView({ album, active, onBack }: Props) {
  const { ref, k } = useDesignScale<HTMLDivElement>(W)
  const moments = album?.moments ?? []
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [run, setRun] = useState(0) // 재생을 (다시) 시작할 때마다 +1 → 진행 막대 초기화
  const [armDrag, setArmDrag] = useState<number | null>(null)
  const [page, setPage] = useState<0 | 1 | 2>(0)
  const [pin, setPin] = useState<number | null>(null)
  const [detail, setDetail] = useState<number | null>(null)

  const swipe = useRef<{ x: number } | null>(null)
  const swiped = useRef(false)
  const drag = useRef<{ moved: number; lx: number; ly: number } | null>(null)

  useEffect(() => {
    setPlaying(false)
    setIdx(0)
    setPage(0)
    setPin(null)
    setDetail(null)
  }, [active, album?.id])

  const moment = moments[idx] ?? null
  const scene = SCENE[page === 1 ? 1 : 0]

  const play = (on: boolean) => {
    if (on && moments.length === 0) return
    setPlaying(on)
    if (on) setRun((r) => r + 1)
  }

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
  }, [playing, idx, moments.length, run])

  const step = (d: number) => {
    if (!moments.length) return
    setIdx((i) => (i + d + moments.length) % moments.length)
    if (playing) setRun((r) => r + 1)
  }

  /* ---------- 톤암을 끌어서 판 위에 올리기 (플레이어 화면) ---------- */
  const relAngle = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    const px = (e.clientX - r.left) / k
    const py = (e.clientY - r.top) / k
    const a = (Math.atan2(-(px - scene.pivot.x), py - scene.pivot.y) * 180) / Math.PI
    return Math.max(ARM_MIN, Math.min(ARM_MAX, a - ARM_BASE_ANGLE))
  }
  const onArmDown = (e: PointerEvent) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { moved: 0, lx: e.clientX, ly: e.clientY }
    setArmDrag(playing ? 0 : ARM_LIFT)
  }
  const onArmMove = (e: PointerEvent) => {
    const d = drag.current
    if (!d) return
    d.moved += Math.abs(e.clientX - d.lx) + Math.abs(e.clientY - d.ly)
    d.lx = e.clientX
    d.ly = e.clientY
    if (d.moved > 6) setArmDrag(relAngle(e))
  }
  const onArmUp = (e: PointerEvent) => {
    e.stopPropagation()
    const d = drag.current
    drag.current = null
    if (!d) return
    if (d.moved <= 6) play(!playing)
    else play(relAngle(e) > ARM_DROP)
    setArmDrag(null)
  }

  /* ---------- 좌우로 밀어서 페이지 넘기기 ---------- */
  const goPage = (p: 0 | 1 | 2) => {
    if (p === 2) play(false)
    setPage(p)
  }
  const onDown = (e: PointerEvent) => {
    swipe.current = { x: e.clientX }
    swiped.current = false
  }
  const onUp = (e: PointerEvent) => {
    const s = swipe.current
    swipe.current = null
    if (!s) return
    const dx = (e.clientX - s.x) / k
    if (dx < -SWIPE_PX && page < 2) {
      swiped.current = true
      goPage((page + 1) as 1 | 2)
    } else if (dx > SWIPE_PX && page > 0) {
      swiped.current = true
      goPage((page - 1) as 0 | 1)
    }
  }
  const onDiscClick = () => {
    if (swiped.current) return
    if (page === 1) play(!playing) // 크게 보기에서는 판을 탭해서 재생/정지
  }

  const rot = armDrag ?? (playing ? 0 : ARM_LIFT)
  const showMedia = playing && moment !== null
  const d = scene.disc

  return (
    <div className="l-root" ref={ref}>
      <div
        className="design"
        style={{ width: W, height: H, transform: `scale(${k})` }}
        onPointerDown={onDown}
        onPointerUp={onUp}
      >
        <div className="lv-strip" style={{ transform: `translateX(${page === 2 ? -W : 0}px)` }}>
          {/* ───── 서 있는 LP: 플레이어 ↔ 크게 보기 ───── */}
          <div className="lv-sub" style={{ left: 0 }}>
            {/* 톤암 받침 (LP 뒤) */}
            <div
              className="lv-arm lv-base"
              style={{ left: scene.pivot.x, top: scene.pivot.y, transform: `scale(${scene.armScale})` }}
            >
              {ARM_PARTS.slice(0, BASE_N).map((p, i) => (
                <i
                  key={i}
                  style={{
                    left: p.x - p.w / 2,
                    top: p.y - p.h / 2,
                    width: p.w,
                    height: p.h,
                    background: p.c,
                    borderRadius: p.radius,
                    transform: `rotate(${p.r}deg)`,
                  }}
                />
              ))}
            </div>

            <div
              className={`lv-disc ${playing ? 'run' : ''} ${page === 1 ? 'still' : ''}`}
              style={{ left: d.cx - d.d / 2, top: d.cy - d.d / 2, width: d.d, height: d.d }}
              onClick={onDiscClick}
            >
              <div className="lv-photo" style={{ width: scene.photo, height: scene.photo }}>
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

            {/* 톤암 */}
            <div
              className={`lv-arm ${armDrag !== null ? 'drag' : ''} ${page === 0 ? 'grab' : ''}`}
              style={{
                left: scene.pivot.x,
                top: scene.pivot.y,
                transform: `rotate(${rot}deg) scale(${scene.armScale})`,
              }}
              onPointerDown={page === 0 ? onArmDown : undefined}
              onPointerMove={page === 0 ? onArmMove : undefined}
              onPointerUp={page === 0 ? onArmUp : undefined}
              onPointerCancel={page === 0 ? onArmUp : undefined}
            >
              {ARM_PARTS.slice(BASE_N).map((p, i) => (
                <i
                  key={i}
                  style={{
                    left: p.x - p.w / 2,
                    top: p.y - p.h / 2,
                    width: p.w,
                    height: p.h,
                    background: p.c,
                    borderRadius: p.radius,
                    transform: `rotate(${p.r}deg)`,
                  }}
                />
              ))}
            </div>

            {/* 플레이어 정보 + 컨트롤 (플레이어 화면에서만) */}
            <div className={`lv-ui ${page === 0 ? 'on' : ''}`}>
              <div className="lv-meta">
                <b>{album?.city}</b>
                <span>{album?.date}</span>
              </div>

              <div className="lv-prog">
                <i className="lv-line" />
                <i
                  key={`${idx}-${run}`}
                  className="lv-knob"
                  style={{
                    animationDuration: `${MOMENT_MS}ms`,
                    animationPlayState: playing ? 'running' : 'paused',
                  }}
                />
              </div>

              <button type="button" className="lv-ctl prev" onClick={() => step(-1)} aria-label="Previous moment">
                <svg viewBox="0 0 23 32" width="23" height="32">
                  <g transform="scale(-1 1) translate(-23 0)">
                    <path d="M0 0 L16 16 L0 32 Z" fill="#fff" />
                    <rect x="16" y="0" width="7" height="32" fill="#fff" />
                  </g>
                </svg>
              </button>
              <button
                type="button"
                className="lv-ctl mid"
                onClick={() => play(!playing)}
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? (
                  <svg viewBox="0 0 26 33" width="26" height="33">
                    <rect x="0" y="0" width="10" height="33" fill="#fff" />
                    <rect x="16" y="0" width="10" height="33" fill="#fff" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 26 33" width="26" height="33">
                    <path d="M2 1 L25 16.5 L2 32 Z" fill="#fff" />
                  </svg>
                )}
              </button>
              <button type="button" className="lv-ctl next" onClick={() => step(1)} aria-label="Next moment">
                <svg viewBox="0 0 23 32" width="23" height="32">
                  <path d="M0 0 L16 16 L0 32 Z" fill="#fff" />
                  <rect x="16" y="0" width="7" height="32" fill="#fff" />
                </svg>
              </button>
            </div>

            {!moment ? (
              <p className="lv-hint">No moments yet</p>
            ) : (
              !playing && page === 0 && <p className="lv-hint nudge">Drop the needle on the record</p>
            )}
          </div>

          {/* ───── 눕힌 LP: 순간마다 핀 ───── */}
          <div className="lv-sub" style={{ left: W }}>
            <LaidLp album={album} selected={pin} onSelect={setPin} onOpen={setDetail} />
          </div>
        </div>

        <div className="l-pages" aria-label={`Page ${page + 1} of 3`} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
          {([0, 1, 2] as const).map((n) => (
            <button key={n} type="button" className={page === n ? 'on' : ''} onClick={() => goPage(n)} aria-label={`Go to page ${n + 1}`}>
              <i />
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="l-back" onClick={onBack} aria-label="Back to albums">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

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

export { PROG_W }
