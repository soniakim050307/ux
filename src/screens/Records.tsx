import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { FlowAlbum } from '../data'
import {
  COVER,
  HOME_OFFSET,
  SLAB_W,
  SPINE_H,
  STACK_OFFSET,
  coverGeo,
  slabHeight,
  stackGeo,
  type Dir,
  type Geo,
} from '../stackLayout'
import { DESIGN_H, DESIGN_W, useDesignScale } from '../useDesignScale'
import LpView from './LpView'
import DraftLp from './DraftLp'

type Mode = 'home' | 'stack' | 'cover'

/** LP가 슬리브에서 빠져나오는 거리 (디자인 px) */
const PULL_MAX = 210
const PULL_COMMIT = 0.45
const SWIPE_PX = 36

const clipFor = (dir: Dir) =>
  dir === 'down'
    ? 'polygon(0 0, 100% 0, 96.5% 100%, 3.5% 100%)'
    : 'polygon(3.5% 0, 96.5% 0, 100% 100%, 0 100%)'

/** Figma 비율 그대로의 종이비행기 변환 행렬 (좌우 반전 포함) */
const PLANES = [
  { cx: 264, cy: 447, m: 'matrix(-0.4688, 0.8833, 0.8833, 0.4688, 0, 0)', delay: '0s' },
  { cx: 313, cy: 418, m: 'matrix(-0.9068, 0.4215, 0.4215, 0.9068, 0, 0)', delay: '-1.6s' },
]

export default function Records({ albums }: { albums: FlowAlbum[] }) {
  // 슬랩 0 = "Add New Album", 1.. = 최신 → 오래된 앨범
  const list = [...albums].reverse()
  const [draft, setDraft] = useState<FlowAlbum | null>(null)
  const slotIdx = Array.from({ length: list.length + 1 }, (_, i) => i)

  const [mode, setMode] = useState<Mode>('home')
  const [sel, setSel] = useState<number | null>(null)
  const [pull, setPull] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [page, setPage] = useState<0 | 1>(0)
  const { ref, k } = useDesignScale<HTMLDivElement>()

  const drag = useRef<{ x: number; id: number } | null>(null)
  const swipe = useRef<{ y: number } | null>(null)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const album = sel === 0 ? draft : sel !== null ? list[sel - 1] : null

  const geos: Geo[] =
    mode === 'cover' && sel !== null
      ? coverGeo(sel)
      : slotIdx.map((i) => stackGeo(i, mode === 'home' ? HOME_OFFSET : STACK_OFFSET))

  /* ---------- 홈: 위/아래로 쓸어서 앨범 스택 열기 ---------- */
  const openStack = () => {
    if (mode === 'home') setMode('stack')
  }
  const closeStack = () => {
    if (mode === 'stack') setMode('home')
  }
  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < 8) return
    if (mode === 'home') openStack()
    else if (mode === 'stack' && e.deltaY < 0) closeStack()
  }
  const onPageDown = (e: PointerEvent) => {
    if (mode === 'home' || mode === 'stack') swipe.current = { y: e.clientY }
  }
  const onPageMove = (e: PointerEvent) => {
    const s = swipe.current
    if (!s) return
    const dy = (e.clientY - s.y) / k
    if (mode === 'home' && Math.abs(dy) > SWIPE_PX) {
      swipe.current = null
      openStack()
    } else if (mode === 'stack' && dy < -SWIPE_PX) {
      swipe.current = null
      closeStack() // 위로 올리면 홈으로
    }
  }
  const onPageUp = () => {
    swipe.current = null
  }

  /* ---------- 슬랩 탭 ---------- */
  const tapSlab = (i: number) => {
    if (mode === 'home' && i !== 0) return openStack()
    if (mode === 'home' || mode === 'stack') {
      if (i === 0 && !draft)
        setDraft({ id: 'draft', city: '', date: '', tone: '#7a7a7a', moments: [], draft: true })
      setPull(0)
      setSel(i)
      setMode('cover')
      if (i === 0) later(commit, 800) // 새 앨범은 따로 끌지 않아도 LP가 바로 빠져나간다
      return
    }
    if (i !== sel) setMode('stack')
  }

  /* ---------- 커버: LP 빼내기 ---------- */
  const commit = () => {
    setDragging(false)
    setPull(1)
    later(() => setPage(1), 380)
  }
  const onDragStart = (e: PointerEvent) => {
    drag.current = { x: e.clientX, id: e.pointerId }
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }
  const onDragMove = (e: PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = (e.clientX - d.x) / k
    setPull(Math.max(0, Math.min(1, dx / PULL_MAX)))
  }
  const onDragEnd = () => {
    if (!drag.current) return
    drag.current = null
    if (pull > PULL_COMMIT) commit()
    else {
      setDragging(false)
      setPull(0)
    }
  }

  const backFromLp = () => {
    setPage(0)
    later(() => setPull(0), 700)
  }

  const coverOn = mode === 'cover' && album !== null

  return (
    <div className="r-root">
      <div className="r-strip" style={{ transform: `translateX(${page === 1 ? -50 : 0}%)` }}>
        {/* ───────── 페이지 0: 홈 → 스택 → 커버 ───────── */}
        <section
          className="r-page"
          ref={ref}
          onWheel={onWheel}
          onPointerDown={onPageDown}
          onPointerMove={onPageMove}
          onPointerUp={onPageUp}
          onPointerCancel={onPageUp}
        >
          <div className="r-bg r-bg-flat" />
          <div className={`r-bg r-bg-grad ${mode !== 'home' ? 'on' : ''}`} />

          <div
            className="design"
            style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${k})` }}
          >
            {/* 홈 일러스트: 턴테이블 + 종이비행기 */}
            <div className={`h-art ${mode !== 'home' ? 'gone' : ''}`} aria-hidden>
              <div className="h-vinyl" />
              <div className="h-label" />
              <div className="h-hole" />
              <div className="h-arm-bar" />
              <div className="h-arm-head" />
              {PLANES.map((p, i) => (
                <div
                  key={i}
                  className="h-plane"
                  style={{ left: p.cx - 32, top: p.cy - 32, animationDelay: p.delay }}
                >
                  <img
                    src={`${import.meta.env.BASE_URL}img/plane.png`}
                    alt=""
                    draggable={false}
                    style={{ transform: p.m }}
                  />
                </div>
              ))}
            </div>

            {/* 앨범 스택 */}
            {slotIdx.map((i) => {
              const a = i === 0 ? null : list[i - 1]
              const g = geos[i]
              const isSel = coverOn && sel === i
              const style = {
                top: g.top,
                height: slabHeight(g.h),
                opacity: g.hidden || isSel ? 0 : 1,
                pointerEvents: g.hidden || isSel ? 'none' : 'auto',
                '--i': i,
              } as CSSProperties
              return (
                <div
                  key={a ? a.id : 'add'}
                  className={`s-slab ${i === 0 ? 'add' : ''}`}
                  style={style}
                  role="button"
                  tabIndex={0}
                  aria-label={a ? `${a.city} ${a.date}` : 'Add New Album'}
                  onClick={() => tapSlab(i)}
                  onKeyDown={(e) => e.key === 'Enter' && tapSlab(i)}
                >
                  <div
                    className="s-cover"
                    style={{
                      top: g.dir === 'down' ? SPINE_H - 1 : 0,
                      height: g.h,
                      background: a ? a.tone : 'transparent',
                      clipPath: clipFor(g.dir),
                    }}
                  >
                    {!a && (
                      <svg
                        viewBox={`0 0 ${SLAB_W} ${g.h}`}
                        preserveAspectRatio="none"
                        width="100%"
                        height="100%"
                      >
                        <polygon
                          points={`1,0.5 ${SLAB_W - 1},0.5 ${SLAB_W - 11},${g.h - 0.5} 11,${g.h - 0.5}`}
                          fill="rgba(255,255,255,0.12)"
                          stroke="rgba(255,255,255,0.8)"
                          strokeDasharray="4 4"
                          vectorEffect="non-scaling-stroke"
                        />
                        <g stroke="#fff" strokeWidth="1.4" vectorEffect="non-scaling-stroke">
                          <line x1={SLAB_W / 2 - 10} y1={g.h / 2} x2={SLAB_W / 2 + 10} y2={g.h / 2} />
                          <line x1={SLAB_W / 2} y1={g.h / 2 - 10} x2={SLAB_W / 2} y2={g.h / 2 + 10} />
                        </g>
                      </svg>
                    )}
                  </div>
                  <div
                    className="s-spine"
                    style={{ top: g.dir === 'down' ? 0 : g.h - 1, width: SLAB_W, height: SPINE_H }}
                  >
                    {a ? (
                      <>
                        <b>{a.city}</b>
                        <span>{a.date}</span>
                      </>
                    ) : (
                      <b>+&nbsp; Add New Album</b>
                    )}
                  </div>
                </div>
              )
            })}

            {/* 선택한 앨범: 커버가 서고, LP가 옆으로 빠진다 */}
            {album && (
              <>
                <div
                  className={`r-lp ${coverOn ? 'on' : ''} ${album.draft ? 'blank' : ''}`}
                  style={{
                    transform: `translateX(${pull * PULL_MAX}px)`,
                    transition: dragging ? 'none' : undefined,
                  }}
                  aria-hidden
                >
                  <i className="r-lp-label" />
                  <i className="r-lp-hole" />
                </div>

                <div
                  className={`r-sel ${coverOn ? 'on' : ''}`}
                  style={{ left: COVER.x, top: COVER.y, width: COVER.w, height: COVER.h }}
                >
                  {album.cover ? (
                    <img src={album.cover} alt="" draggable={false} />
                  ) : (
                    <div className="r-sel-blank" />
                  )}
                  <div className="r-sel-title">
                    <h2>{album.city}</h2>
                    <span>{album.date}</span>
                  </div>
                </div>

                {coverOn && (
                  <>
                    <button type="button" className="r-pull" onClick={commit}>
                      <span>
                        PULL OUT
                        <br />
                        TO OPEN
                      </span>
                      <svg viewBox="0 0 10 8" width="10" height="8" aria-hidden>
                        <path d="M0 4h9M5.5 1 9 4 5.5 7" fill="none" stroke="#fff" strokeWidth="1" />
                      </svg>
                    </button>
                    <div
                      className="r-drag"
                      onPointerDown={onDragStart}
                      onPointerMove={onDragMove}
                      onPointerUp={onDragEnd}
                      onPointerCancel={onDragEnd}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </section>

        {/* ───────── 페이지 1: LP 화면 ───────── */}
        <section className="r-page">
          {album?.draft ? (
            <DraftLp
              album={album}
              active={page === 1}
              onChange={(p) => setDraft((d) => (d ? { ...d, ...p } : d))}
              onBack={backFromLp}
            />
          ) : (
            <LpView album={album} active={page === 1} onBack={backFromLp} />
          )}
        </section>
      </div>
    </div>
  )
}
