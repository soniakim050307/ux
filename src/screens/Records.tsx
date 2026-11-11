import Parcel from '../Parcel'
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { FlowAlbum } from '../data'
import {
  COVER,
  coverTop,
  HOME_OFFSET,
  SLAB_W,
  SPINE_H,
  STACK_OFFSET,
  coverGeo,
  slabHeight,
  stackGeo,
  setViewH,
  type Dir,
  type Geo,
} from '../stackLayout'
import { DESIGN_W, useDesignScale } from '../useDesignScale'
import LpView from './LpView'
import DraftLp from './DraftLp'
import DeliveryMap from './DeliveryMap'

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

// ?fast=초 로 열면 배송이 그 초 만에 도착한다 (체험용)
const FAST = Number(new URLSearchParams(window.location.search).get('fast')) || 0

// 슬랩 이름표 색: 각 표지 사진의 평균 색을 옅게 만든 톤
const SPINE: Record<string, string> = {
  barcelona: '#e4ded2',
  newyork: '#d2d9e4',
  reykjavik: '#d2e4e4',
  bangkok: '#e4e2d2',
  paris: '#d2dbe4',
  kyoto: '#efd6c8',
  lisbon: '#e4dad2',
  jeju: '#cee2e8',
}
const spineColor = (a: FlowAlbum | null) => (a ? (a.delivery ? '#f3e6d6' : SPINE[a.id]) : undefined)

export default function Records({ albums }: { albums: FlowAlbum[] }) {
  // 슬랩 0 = "Add New Album", 1.. = 최신 → 오래된 앨범
  const [created, setCreated] = useState<FlowAlbum[]>([])
  const list = [...albums, ...created].reverse()
  const [draft, setDraft] = useState<FlowAlbum | null>(null)
  const [, setTick] = useState(0)
  const [unwrapId, setUnwrapId] = useState<string | null>(null)
  // 배송 중인 소포가 있을 때만, 도착 시각에 딱 한 번 다시 그린다
  const nextArrival = created.reduce((m, a) => {
    if (!a.delivery) return m
    const at = a.delivery.startedAt + a.delivery.days * 86400000
    return at > Date.now() && at < m ? at : m
  }, Infinity)
  useEffect(() => {
    if (!isFinite(nextArrival)) return
    const t = window.setTimeout(() => setTick((n) => n + 1), Math.min(2147483000, nextArrival - Date.now() + 50))
    return () => clearTimeout(t)
  }, [nextArrival])
  const isArrived = (a?: FlowAlbum | null) =>
    !!a?.delivery && Date.now() >= a.delivery.startedAt + a.delivery.days * 86400000
  const arrivedAlbum = created.find(isArrived) ?? null
  const slotIdx = Array.from({ length: list.length + 1 }, (_, i) => i)

  const [armDown, setArmDown] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setArmDown(true), 400)
    return () => clearTimeout(t)
  }, [])
  const [mode, setMode] = useState<Mode>('home')
  const [sel, setSel] = useState<number | null>(null)
  const [pull, setPull] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [page, setPage] = useState<0 | 1>(0)
  const { ref, k, dh } = useDesignScale<HTMLDivElement>(DESIGN_W, 'width')
  setViewH(dh) // 높이에 맞춰 슬랩을 다시 배치

  const drag = useRef<{ x: number; id: number } | null>(null)
  const swipe = useRef<{ y: number; x: number } | null>(null)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const album = sel === 0 ? draft : sel !== null ? list[sel - 1] : null

  const geos: Geo[] =
    mode === 'cover' && sel !== null
      ? coverGeo(sel, slotIdx.length)
      : slotIdx.map((i) => stackGeo(i, mode === 'home' ? HOME_OFFSET : STACK_OFFSET))

  /* ---------- 홈: 위/아래로 쓸어서 앨범 스택 열기 ---------- */
  const openStack = () => {
    if (mode === 'home') setMode('stack')
  }
  const closeStack = () => {
    if (mode === 'stack') setMode('home')
  }
  const lastWheel = useRef(-Infinity)
  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < 8) return
    // 트랙패드 관성 스크롤이 연달아 들어와 열자마자 닫히는 걸 막는다
    const now = performance.now()
    if (now - lastWheel.current < 900) {
      lastWheel.current = now
      return
    }
    lastWheel.current = now
    // 홈 ↔ 스택: 위로 올리든 내리든(트랙패드 방향 설정과 무관하게) 스택에서는 홈으로 돌아간다
    if (mode === 'home') openStack()
    else if (mode === 'stack') closeStack()
  }
  const onPageDown = (e: PointerEvent) => {
    if (mode === 'home' || mode === 'stack' || mode === 'cover') swipe.current = { y: e.clientY, x: e.clientX }
  }
  const onPageMove = (e: PointerEvent) => {
    const s = swipe.current
    if (!s) return
    const dy = (e.clientY - s.y) / k
    const dx = (e.clientX - s.x) / k
    if (mode === 'cover') {
      // 앨범을 연 상태에서 위로 올리면 홈으로 (옆으로 LP 빼는 동작과는 구분)
      if (dy < -SWIPE_PX * 1.6 && Math.abs(dx) < Math.abs(dy) * 0.6 && !dragging && pull === 0) {
        swipe.current = null
        setPull(0)
        setMode('home')
      }
      return
    }
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
  const [mapOpen, setMapOpen] = useState(false)
  const boxed = !!album?.delivery
  const parcel = boxed && !isArrived(album)
  const cTop = sel !== null ? coverTop(sel) : 0
  const daysLeft = album?.delivery
    ? Math.max(0, Math.ceil((album.delivery.startedAt + album.delivery.days * 86400000 - Date.now()) / 86400000))
    : 0

  // 체험용 트리거: 배송 중인 소포를 지금 바로 도착시킨다
  const transitAlbum = created.find((a) => a.delivery && !isArrived(a)) ?? null
  const arriveNow = () => {
    setCreated((c) =>
      c.map((a) =>
        a.delivery && !isArrived(a) ? { ...a, delivery: { ...a.delivery, startedAt: Date.now() - a.delivery.days * 86400000 - 1000 } } : a,
      ),
    )
    setMapOpen(false)
  }

  /* 도착한 소포: 움찔거리다가 누르면 쫘라락 풀리고 회고(LP) 화면으로 */
  const openArrived = (a: FlowAlbum) => {
    if (unwrapId) return
    setUnwrapId(a.id)
    later(() => {
      const next = created.map((x) => (x.id === a.id ? { ...x, delivery: undefined } : x))
      const idx = [...albums, ...next].reverse().findIndex((x) => x.id === a.id) + 1
      setCreated(next)
      setPull(0)
      setSel(idx)
      setMode('cover')
      setPage(0)
      setUnwrapId(null)
      later(commit, 900)
    }, 1500)
  }

  const finishDraft = () => {
    if (!draft) return
    const now = new Date()
    const a: FlowAlbum = {
      ...draft,
      id: `new-${now.getTime()}`,
      draft: false,
      date: `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`,
      tone: '#c9a77b',
      delivery: { startedAt: now.getTime(), days: FAST ? FAST / 86400 : 3 },
    }
    setCreated((c) => [...c, a])
    setDraft(null)
    setPull(0)
    setSel(1)
    setMode('cover')
    setPage(0)
  }

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
            style={{ width: DESIGN_W, height: dh, transform: `scale(${k})` }}
          >
            {/* 홈 일러스트: 턴테이블 + 종이비행기 */}
            <div className={`h-art ${mode !== 'home' ? 'gone' : ''}`} aria-hidden>
              <div className="h-vinyl" />
              <div className="h-label" />
              <div className="h-hole" />
              <svg className="h-arm" viewBox="0 0 393 260">
                <g className={`h-arm-g ${armDown ? 'up' : 'off'}`}>
                  <line x1="404" y1="-20" x2="290" y2="160" stroke="#d9d9d9" strokeWidth="11" />
                  <rect x="262" y="146" width="36" height="50" fill="#7b7b80" transform="rotate(32 280 171)" />
                </g>
              </svg>
            </div>

            {transitAlbum && page === 0 && !mapOpen && (
              <button type="button" className="r-trigger" onClick={arriveNow}>
                ▶ 배송 도착시키기 (체험용)
              </button>
            )}

            {/* 도착한 소포 (홈) */}
            {arrivedAlbum && mode === 'home' && (
              <button
                type="button"
                className={`h-parcel ${unwrapId === arrivedAlbum.id ? 'open' : ''}`}
                onClick={() => openArrived(arrivedAlbum)}
                aria-label="Open arrived parcel"
              >
                <span className="hp-box">
                  <Parcel city={arrivedAlbum.city} date={arrivedAlbum.date} cover={arrivedAlbum.cover} />
                  <span className="hp-disc" />
                </span>
                <em>Your LP has arrived · tap to open</em>
              </button>
            )}

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
                  className={`s-slab ${i === 0 ? 'add' : ''} ${a?.delivery ? 'parcel' : ''}`}
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
                      background: a ? (a.delivery ? '#c4a07a' : a.cover ? `${a.tone} url(${a.cover}) center / cover no-repeat` : a.tone) : 'transparent',
                      clipPath: clipFor(g.dir),
                    }}
                  >
                    {a?.delivery && (
                      <>
                        <Parcel city={a.city} date={a.date} cover={a.cover} />
                      </>
                    )}
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
                    style={{ top: g.dir === 'down' ? 0 : g.h - 1, width: SLAB_W, height: SPINE_H, background: spineColor(a) }}
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
                {!boxed && (
                  <div
                    className={`r-lp ${coverOn ? 'on' : ''} ${album.draft ? 'blank' : ''}`}
                    style={{
                      top: cTop + (COVER.h - 165) / 2,
                      transform: `translateX(${pull * PULL_MAX}px)`,
                      transition: dragging ? 'none' : undefined,
                    }}
                    aria-hidden
                  >
                    <i className="r-lp-label" />
                    <i className="r-lp-hole" />
                  </div>
                )}

                <div
                  className={`r-sel ${coverOn ? 'on' : ''}`}
                  style={{ left: COVER.x, top: cTop, width: COVER.w, height: COVER.h }}
                >
                  {boxed ? (
                    <div className={`r-parcel ${parcel ? '' : 'arrived'} ${unwrapId === album.id ? 'open' : ''}`}>
                      <Parcel city={album.city} date={album.date} cover={album.cover} />
                    </div>
                  ) : album.cover ? (
                    <img src={album.cover} alt="" draggable={false} />
                  ) : (
                    <div className="r-sel-blank" />
                  )}
                </div>

                <div className={`r-sel-title ${coverOn ? 'on' : ''}`} style={{ top: cTop + COVER.h + 14 }}>
                  <h2>{album.city || 'New Album'}</h2>
                  <span>{album.date}</span>
                </div>

                {coverOn && parcel && (
                  <button type="button" className="r-parcel-hit" style={{ top: cTop }} onClick={() => setMapOpen(true)} aria-label="Track delivery">
                    <span className="r-transit">
                      IN TRANSIT
                      <b>D-{daysLeft}</b>
                    </span>
                  </button>
                )}

                {coverOn && boxed && !parcel && (
                  <button type="button" className="r-parcel-hit" style={{ top: cTop }} onClick={() => openArrived(album)} aria-label="Open parcel">
                    <span className="r-transit">
                      ARRIVED
                      <b>TAP</b>
                    </span>
                  </button>
                )}

                {coverOn && !boxed && (
                  <>
                    <button type="button" className="r-pull" style={{ top: cTop + COVER.h / 2 - 17 }} onClick={commit}>
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
                      style={{ top: cTop }}
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

          {mapOpen && album?.delivery && (
            <div className="l-root cap" style={{ zIndex: 40 }}>
              <MapScaled>
                <DeliveryMap
                  city={album.city}
                  startedAt={album.delivery.startedAt}
                  days={album.delivery.days}
                  buttonLabel="Close"
                  onFinish={() => setMapOpen(false)}
                />
                <button type="button" className="r-trigger in-map" onClick={arriveNow}>
                  ▶ 배송 도착시키기 (체험용)
                </button>
              </MapScaled>
            </div>
          )}
        </section>

        {/* ───────── 페이지 1: LP 화면 ───────── */}
        <section className="r-page">
          {album?.draft ? (
            <DraftLp
              album={album}
              active={page === 1}
              onChange={(p) => setDraft((d) => (d ? { ...d, ...p } : d))}
              onBack={backFromLp}
              onFinish={finishDraft}
            />
          ) : (
            <LpView album={album} active={page === 1} onBack={backFromLp} />
          )}
        </section>
      </div>
    </div>
  )
}

function MapScaled({ children }: { children: React.ReactNode }) {
  const { ref, k } = useDesignScale<HTMLDivElement>(393)
  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0 }}>
      <div className="design" style={{ width: 393, height: 852, transform: `scale(${k})`, background: '#545e85' }}>
        {children}
      </div>
    </div>
  )
}
