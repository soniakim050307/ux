import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
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
  { x: -13, y: 1, w: 40.5, h: 37.8, r: -64.5, c: '#d9d9d9', radius: '10px 10px 0 0' },
  { x: 16.7, y: 14.5, w: 40.5, h: 24.2, r: -64.5, c: '#d9d9d9', radius: '0 0 5px 5px' },
  { x: -45, y: 146, w: 274, h: 13, r: -65, c: '#959595' },
  { x: -107, y: 277, w: 16, h: 15, r: -65, c: '#d9d9d9' },
  { x: -115, y: 295, w: 29.8, h: 18.2, r: -64.5, c: '#d9d9d9', radius: '55px 5px 5px 55px' },
  { x: -133, y: 318, w: 60, h: 28, r: -35, c: '#d9d9d9', radius: '10px' },
]

/** 앞의 4개(받침 + 힌지)는 고정, 나머지(막대·바늘)만 돌아간다 */
const BASE_N = 4

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
  // 경로를 옆으로 넘기면 가장 가까운 경유점(순간)으로 넘어간다
  const [scrub, setScrub] = useState<number | null>(null)
  const progRef = useRef<HTMLDivElement>(null)
  const progX = (e: PointerEvent) => {
    const r = progRef.current!.getBoundingClientRect()
    return Math.max(0, Math.min(PROG_W, ((e.clientX - r.left) / r.width) * 290))
  }
  const onProgDown = (e: PointerEvent) => {
    if (!moments.length) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setScrub(progX(e))
  }
  const onProgMove = (e: PointerEvent) => {
    if (scrub === null) return
    e.stopPropagation()
    setScrub(progX(e))
  }
  const onProgUp = (e: PointerEvent) => {
    if (scrub === null) return
    e.stopPropagation()
    const n = moments.length
    const i = Math.max(0, Math.min(n - 1, Math.round((progX(e) / PROG_W) * n)))
    setScrub(null)
    setIdx(i)
    if (playing) setRun((r) => r + 1)
  }

  const [listOpen, setListOpen] = useState(false)

  // 여행지로 LP 보내기
  const [sendOpen, setSendOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [what, setWhat] = useState({ music: true, photo: true, memo: true })
  const sendList = [
    ['music', '음악', '녹음한 소리와 노래'],
    ['photo', '사진 · 영상', '기록한 사진과 영상'],
    ['memo', '메모', '순간마다 적은 글'],
  ] as const
  const closeSend = () => {
    setSendOpen(false)
    setTimeout(() => setSent(false), 300)
  }
  const doSend = () => {
    setSent(true)
    setTimeout(closeSend, 2200)
  }

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

  // 순간 i 가 시작될 때 비행기는 i번째 점 위에 있고, 재생하면 다음 점을 향해 천천히 날아간다.
  const nM = Math.max(1, moments.length)
  const stopX = (idx / nM) * PROG_W
  const stopNext = ((idx + 1) / nM) * PROG_W
  const rot = armDrag ?? (playing ? 0 : ARM_LIFT)
  // 크게 보기(2번째 화면)에서는 영상이 각각 바로 재생된다. 작게 볼 때는 재생 중일 때만.
  const vref = useRef<HTMLVideoElement>(null)
  const wantVideo = playing || page === 1
  useEffect(() => {
    const el = vref.current
    if (!el) return
    if (wantVideo) void el.play().catch(() => {})
    else el.pause()
  }, [wantVideo, moment?.id])
  const showMedia = moment !== null // 재생 전에도 가운데에 사진이 보인다
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
                      ref={vref}
                      src={moment.src}
                      poster={moment.poster}
                      muted
                      loop
                      playsInline
                      autoPlay={playing || page === 1}
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

              {/* 바늘이 판을 따라 가듯, 재생 위치 = 여행 경로 위의 비행기 */}
              <div
                className="lv-prog"
                ref={progRef}
                onPointerDown={onProgDown}
                onPointerMove={onProgMove}
                onPointerUp={onProgUp}
                onPointerCancel={onProgUp}
              >
                <i className="lv-line" />
                {moments.length > 0 && (
                  <>
                    <i
                      key={`d-${idx}-${run}`}
                      className={`lv-done ${scrub !== null ? 'scrub' : ''}`}
                      style={
                        {
                          '--from': `${stopX}px`,
                          '--to': `${stopNext}px`,
                          ...(scrub !== null ? { width: scrub } : {}),
                          animationDuration: `${MOMENT_MS}ms`,
                          animationPlayState: playing ? 'running' : 'paused',
                        } as CSSProperties
                      }
                    />
                    {moments.slice(1).map((m, j) => {
                      const i = j + 1
                      return (
                      <i
                        key={m.id}
                        className={`lv-stop ${i <= idx ? 'seen' : ''}`}
                        style={{ left: (i / moments.length) * PROG_W }}
                      />
                      )
                    })}
                  </>
                )}
                <i className="lv-end l" />
                <i className="lv-end r" />
                <i
                  key={`${idx}-${run}`}
                  className={`lv-knob ${scrub !== null ? 'scrub' : ''}`}
                  style={
                    {
                      '--from': `${stopX}px`,
                      '--to': `${stopNext}px`,
                      transform: `translateX(${scrub ?? stopX}px)`,
                      animationDuration: `${MOMENT_MS}ms`,
                      animationPlayState: playing ? 'running' : 'paused',
                    } as CSSProperties
                  }
                >
                  <svg viewBox="0 0 22 16" width="22" height="16" aria-hidden>
                    <path d="M21 1 1 7l7 2.5L10.5 15 13 10.5 21 1Z" fill="#fff" />
                    <path d="M8 9.5 21 1" stroke="#8c9dde" strokeWidth="1" fill="none" />
                  </svg>
                </i>
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

              <button type="button" className="lv-ctl list" onClick={() => setListOpen(true)} aria-label="Moment list" disabled={!moments.length}>
                <svg viewBox="0 0 24 18" width="22" height="16" aria-hidden>
                  <path d="M1 2h22M1 9h22M1 16h22" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
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

      {page === 2 && album && !album.draft && (
        <button type="button" className="lv-send-btn" onClick={() => setSendOpen(true)} aria-label="Send my LP to the destination">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
            <path d="M21 3 3 10.5l6.2 2.3L11.5 19l2.3-4.2L21 3Z M9.2 12.8 21 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {listOpen && (
        <div className="lv-list" onClick={(e) => e.target === e.currentTarget && setListOpen(false)}>
          <div className="lv-list-sheet" role="dialog" aria-modal="true">
            <i className="mp-grab" />
            <h3>
              {album?.city} <span>{moments.length} moments</span>
            </h3>
            <ul>
              {moments.map((m, i) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className={i === idx ? 'on' : ''}
                    onClick={() => {
                      setIdx(i)
                      if (playing) setRun((r) => r + 1)
                      setListOpen(false)
                    }}
                  >
                    <span className="th" style={{ backgroundImage: m.poster || m.kind !== 'video' ? `url(${m.poster ?? m.src})` : undefined }} />
                    <span className="tx">
                      <b>{m.song?.title ?? 'Music'}</b>
                      <i>{m.song?.artist ?? ''}</i>
                      <em>{m.time ?? `Moment ${i + 1}`}</em>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {sendOpen && (
        <div className="lv-send" onClick={(e) => e.target === e.currentTarget && !sent && closeSend()}>
          <div className="lv-send-card" role="dialog" aria-modal="true">
            {sent ? (
              <div className="lv-send-done">
                <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden>
                  <path d="M21 3 3 10.5l6.2 2.3L11.5 19l2.3-4.2L21 3Z M9.2 12.8 21 3" fill="none" stroke="#373d56" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                <h3>{album?.city}로 보냈어요</h3>
                <p>
                  {sendList
                    .filter(([k]) => what[k])
                    .map(([, label]) => label)
                    .join(' · ') || '선택한 것 없음'}
                </p>
              </div>
            ) : (
              <>
                <h3>자신의 LP를 여행지로 보내겠습니까?</h3>
                <p className="lv-send-sub">{album?.city} · 함께 보낼 것을 골라주세요</p>
                <ul>
                  {sendList.map(([k, label, desc]) => (
                    <li key={k}>
                      <div>
                        <b>{label}</b>
                        <span>{desc}</span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={what[k]}
                        aria-label={label}
                        className={`lv-switch ${what[k] ? 'on' : ''}`}
                        onClick={() => setWhat((w) => ({ ...w, [k]: !w[k] }))}
                      >
                        <i />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="lv-send-acts">
                  <button type="button" className="ghost" onClick={closeSend}>
                    취소
                  </button>
                  <button type="button" className="go" onClick={doSend} disabled={!what.music && !what.photo && !what.memo}>
                    보내기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
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

export { PROG_W }
