import { advanceDay, todayKey as getTodayKey } from '../grooveDays'
import { useRef, useState, type PointerEvent } from 'react'
import type { FlowAlbum, FlowMoment } from '../data'
import { useDesignScale } from '../useDesignScale'
import { DETECTED } from './Review'
import PressSeq from './PressSeq'

const W = 393
const H = 852
const D = 104 // 썸네일 지름
const GAP = 14
const STEP = D + GAP

interface Props {
  album: FlowAlbum
  onChange: (moments: FlowMoment[]) => void
  onClose: () => void
  onFinish: () => void
}

function Thumb({ m, size }: { m: FlowMoment; size: number }) {
  return (
    <div className="og-thumb" style={{ width: size, height: size }}>
      {m.kind === 'audio' ? (
        <svg viewBox="0 0 24 24" width={size * 0.3} height={size * 0.3} fill="none" stroke="#f3dfa0" strokeWidth="1.6" strokeLinecap="round">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5.5 11.5a6.5 6.5 0 0013 0M12 18v3" />
        </svg>
      ) : m.kind === 'video' ? (
        <video src={`${m.src}#t=0.1`} poster={m.poster} muted playsInline preload="metadata" />
      ) : (
        <img src={m.src} alt="" draggable={false} />
      )}
    </div>
  )
}

/** Save 를 누르면: 기록한 순간들을 한눈에 보고, 순서를 바꾸고, 하나씩 열어 메모·노래를 고친다 */
export default function Organizer({ album, onChange, onClose, onFinish }: Props) {
  const { ref, k } = useDesignScale<HTMLDivElement>(W)
  const moments = album.moments
  const [open, setOpen] = useState<number | null>(null)
  const [press, setPress] = useState(false)
  const [drag, setDrag] = useState<{ i: number; off: number } | null>(null)
  const st = useRef<{ x0: number; i: number; moved: number; id: string } | null>(null)

  /* 홈 하나 = 하루. 가장 바깥 홈이 첫째 날, 안쪽으로 갈수록 날이 지남.
     지난 날의 홈은 이미 새겨져 닫혀 있고, 오늘의 홈만 열려 있어 오늘 moment만 고치고 순서를 바꿀 수 있다. */
  const [, setDayTick] = useState(0)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const todayKey = getTodayKey()
  const dayOf = (m: FlowMoment) => (m.time && /^\d{4}\.\d{2}\.\d{2}/.test(m.time) ? m.time.slice(0, 10) : todayKey)
  const days = Array.from(new Set([...moments.map(dayOf), todayKey])).sort()
  const byDay = (key: string) => moments.filter((m) => dayOf(m) === key)
  const today = byDay(todayKey)

  const move = (from: number, to: number) => {
    const t = today.slice()
    const [it] = t.splice(from, 1)
    t.splice(to, 0, it)
    onChange(days.flatMap((d) => (d === todayKey ? t : byDay(d))))
  }

  const down = (e: PointerEvent, i: number) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    st.current = { x0: e.clientX, i, moved: 0, id: today[i].id }
    setDrag({ i, off: 0 })
  }
  const mv = (e: PointerEvent) => {
    const s = st.current
    if (!s) return
    let off = (e.clientX - s.x0) / k
    s.moved = Math.max(s.moved, Math.abs(off))
    if (off > STEP / 2 && s.i < today.length - 1) {
      move(s.i, s.i + 1)
      s.i++
      s.x0 += STEP * k
      off -= STEP
    } else if (off < -STEP / 2 && s.i > 0) {
      move(s.i, s.i - 1)
      s.i--
      s.x0 -= STEP * k
      off += STEP
    }
    setDrag({ i: s.i, off })
  }
  const up = () => {
    const s = st.current
    st.current = null
    setDrag(null)
    if (s && s.moved < 6) setOpen(moments.findIndex((m) => m.id === s.id))
  }
  /* 오늘 저장: 오늘의 홈이 새겨져 닫히고, 다음 날의 홈이 열린다 */
  const dayNo = days.indexOf(todayKey) + 1
  const saveToday = () => {
    if (saving || today.length === 0) return
    setSaving(true)
    window.setTimeout(() => {
      advanceDay()
      setSaving(false)
      setDayTick((n) => n + 1)
      setToast(`Day ${dayNo} carved · Day ${dayNo + 1} is open`)
      window.setTimeout(() => setToast(''), 2600)
    }, 1300)
  }
  const ringR = (d: number) => 112 - d * Math.min(16, 72 / Math.max(1, days.length - 1))
  const md = (key: string) => key.slice(5).replace('.', '.')

  return (
    <div className="l-root cap" ref={ref}>
      <div className="design" style={{ width: W, height: H, transform: `scale(${k})` }}>
        <div className="og-head">
          <b>{album.city}</b>
          <span>
            {moments.length} MOMENT{moments.length === 1 ? '' : 'S'}
          </span>
        </div>
        <p className="og-loc">
          <svg viewBox="0 0 16 20" width="11" height="14" aria-hidden>
            <path d="M8 1a6 6 0 00-6 6c0 4.5 6 12 6 12s6-7.500 6-12a6 6 0 00-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z" fill="#ea6a6a" />
          </svg>
          {album.name || album.city}
        </p>

        {moments.length === 0 ? (
          <p className="og-empty">아직 기록한 순간이 없어요</p>
        ) : (
          <>
            {/* LP 미리보기: 홈 하나가 하루. 오늘 홈만 밝고, 그 위 사진 핀은 오늘의 순서대로 놓임 */}
            <div className="og-disc">
              <i className="og-disc-label" />
              {days.map((d, di) => {
                const r = ringR(di)
                const list = byDay(d)
                const isToday = d === todayKey
                return (
                  <span key={d} className={`${isToday ? 'today' : 'past'} ${isToday && saving ? 'carving' : ''}`}>
                    <i className="og-ring" style={{ width: r * 2, height: r * 2 }} />
                    {list.map((m, j) => {
                      const a = -70 + j * Math.min(48, 290 / Math.max(1, list.length)) // 위에서부터 이 날의 트랙 순서대로
                      return (
                        <b
                          key={m.id}
                          className={`og-dot ${drag && today[drag.i]?.id === m.id ? 'on' : ''}`}
                          style={{
                            transform: `rotate(${a}deg) translateX(${r}px) rotate(${-a}deg)`,
                            backgroundImage: m.poster || m.kind !== 'video' ? `url(${m.poster || m.src})` : undefined,
                          }}
                        >
                          {!m.poster && m.kind === 'video' && <video src={m.src} muted playsInline preload="metadata" />}
                        </b>
                      )
                    })}
                  </span>
                )
              })}
              <small>SIDE A · {days.length} DAY{days.length === 1 ? '' : 'S'}</small>
            </div>

            <div className="og-days">
              {/* 오늘: 열려 있는 홈 */}
              <div className={`og-day today ${saving ? 'carving' : ''}`}>
                <p className="og-day-h">
                  DAY {days.indexOf(todayKey) + 1} · {md(todayKey)} <em>TODAY</em>
                </p>
                {today.length === 0 ? (
                  <p className="og-day-empty">No moments yet today</p>
                ) : (
                  <div className="og-row">
                    <div className="og-track" style={{ width: today.length * STEP }}>
                      {today.map((m, i) => (
                        <div
                          key={m.id}
                          className={`og-item ${drag?.i === i ? 'drag' : ''}`}
                          style={{
                            left: i * STEP,
                            transform: drag?.i === i ? `translateX(${drag.off}px) scale(1.08)` : undefined,
                          }}
                          onPointerDown={(e) => down(e, i)}
                          onPointerMove={mv}
                          onPointerUp={up}
                          onPointerCancel={up}
                        >
                          <Thumb m={m} size={D} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* 지난 날: 이미 새겨져 닫힌 홈 */}
              {days
                .filter((d) => d !== todayKey)
                .reverse()
                .map((d) => (
                  <div key={d} className="og-day past">
                    <p className="og-day-h">
                      DAY {days.indexOf(d) + 1} · {md(d)} <em>CARVED</em>
                    </p>
                    <div className="og-past">
                      {byDay(d).map((m) => (
                        <Thumb key={m.id} m={m} size={64} />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
            <p className="og-tip" style={{ opacity: toast ? 0 : 1 }}>Only today's groove is open · tap to edit, drag to reorder</p>
            <button type="button" className="og-save" onClick={saveToday} disabled={today.length === 0 || saving}>
              {saving ? 'Carving…' : `Save Day ${dayNo}`}
            </button>
            {toast && <div className="og-toast">{toast}</div>}
          </>
        )}
      </div>

      <button type="button" className="l-back" onClick={onClose} aria-label="Back">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button type="button" className="og-press-top" onClick={() => setPress(true)} disabled={moments.length === 0}>
        Press
      </button>

      {press && <PressSeq city={album.city} onFinish={() => onFinish()} />}

      {open !== null && moments[open] && (
        <Detail
          album={album}
          index={open}
          onClose={() => setOpen(null)}
          onEdit={(m) => onChange(moments.map((x, i) => (i === open ? m : x)))}
          onDelete={() => {
            onChange(moments.filter((_, i) => i !== open))
            setOpen(null)
          }}
        />
      )}
    </div>
  )
}

function Detail({
  album,
  index,
  onClose,
  onEdit,
  onDelete,
}: {
  album: FlowAlbum
  index: number
  onClose: () => void
  onEdit: (m: FlowMoment) => void
  onDelete: () => void
}) {
  const { ref, k } = useDesignScale<HTMLDivElement>(W)
  const m = album.moments[index]
  const media = useRef<HTMLVideoElement & HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [sheet, setSheet] = useState(false)
  const src = m.kind === 'video' ? m.src : m.audio

  const toggle = () => {
    const el = media.current
    if (!el) return
    if (el.paused) el.play().then(() => setPlaying(true)).catch(() => {})
    else {
      el.pause()
      setPlaying(false)
    }
  }

  return (
    <div className="l-root cap og-detail" ref={ref} style={{ zIndex: 50 }}>
      <div className="design" style={{ width: W, height: H, transform: `scale(${k})` }}>
        <div className="og-head">
          <b>{album.city}</b>
          <span>MOMENT {index + 1}</span>
        </div>

        <div className="og-big">
          <Thumb m={m} size={296} />
          {src && (
            <>
              {m.kind === 'video' ? (
                <video
                  ref={media}
                  src={src}
                  playsInline
                  onEnded={() => setPlaying(false)}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: playing ? 1 : 0 }}
                />
              ) : (
                <audio ref={media} src={src} onEnded={() => setPlaying(false)} />
              )}
              <button type="button" className="og-play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? (
                  <svg viewBox="0 0 14 14" width="14" height="14">
                    <rect width="4.500" height="14" fill="#fff" />
                    <rect x="9" width="4.500" height="14" fill="#fff" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 14 14" width="14" height="14">
                    <path d="M2 1l11 6-11 6z" fill="#fff" />
                  </svg>
                )}
              </button>
            </>
          )}
        </div>

        <button type="button" className="og-song" onClick={() => setSheet(true)}>
          <i />
          <span>
            <b>{m.song ? m.song.title : 'Add a song'}</b>
            <em>{m.song ? m.song.artist : 'Tap to edit songs'}</em>
          </span>
          <u>›</u>
        </button>

        <label className="og-note-l">NOTE</label>
        <input
          className="og-note"
          placeholder="Write this moment briefly..."
          value={m.note ?? ''}
          onChange={(e) => onEdit({ ...m, note: e.target.value })}
        />

        <button type="button" className="og-del" onClick={onDelete}>
          Delete this moment
        </button>
        <button type="button" className="og-press" onClick={onClose}>
          PRESS INTO LP
        </button>

        {sheet && (
          <div className="og-shade" onClick={() => setSheet(false)}>
            <div className="og-sheet" onClick={(e) => e.stopPropagation()}>
              <i className="og-grab" />
              <div className="og-sheet-h">
                <b>Edit Songs</b>
                <button type="button" onClick={() => setSheet(false)} aria-label="Close">
                  ✕
                </button>
              </div>
              {m.song && (
                <div className="og-s on">
                  <span>
                    <b>{m.song.title}</b>
                    <em>{m.song.artist}</em>
                  </span>
                  <button type="button" onClick={() => { onEdit({ ...m, song: undefined }); setSheet(false) }}>
                    Remove
                  </button>
                </div>
              )}
              {DETECTED.filter((d) => d.title !== m.song?.title).map((d) => (
                <div className="og-s" key={d.title}>
                  <span>
                    <b>{d.title}</b>
                    <em>
                      {d.artist} · {d.label}
                    </em>
                  </span>
                  <button type="button" onClick={() => { onEdit({ ...m, song: { title: d.title, artist: d.artist } }); setSheet(false) }}>
                    Use
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button type="button" className="l-back" onClick={onClose} aria-label="Back">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
