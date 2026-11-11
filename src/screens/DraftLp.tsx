import { useEffect, useRef, useState } from 'react'
import type { FlowAlbum } from '../data'
import { useDesignScale } from '../useDesignScale'
import Capture from './Capture'
import Organizer from './Organizer'

const W = 393
const H = 852
const LP = { cx: 39, cy: 408, r: 323 }
/** moment마다 판의 서로 다른 홈(반지름)에 핀이 꽂히고, 그 홈이 흰 줄로 새겨진다 */
const pinPos = (k: number) => ({ deg: ((-55 + k * 27) % 110), r: 186 + (k % 9) * 14 })

interface Props {
  album: FlowAlbum
  active: boolean
  onChange: (p: Partial<FlowAlbum>) => void
  onBack: () => void
  onFinish: () => void
}

const fmt = (iso: string) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  const day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(iso).getDay()]
  return `${y.slice(2)}. ${+m}. ${+d}. (${day})`
}

/** 새 앨범(허브): 빈 LP에 moment를 하나씩 새긴다. 제목을 누르면 정보 입력, 아래 버튼으로 기록, 오른쪽 위 Finish로 마무리 */
export default function DraftLp({ album, active, onChange, onBack, onFinish }: Props) {
  const { ref, k } = useDesignScale<HTMLDivElement>(W)
  const [form, setForm] = useState(false)
  const [cap, setCap] = useState(false)
  const [org, setOrg] = useState(false)
  const [name, setName] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [place, setPlace] = useState('')
  const saved = album.city !== ''
  const n = album.moments.length
  const [toast, setToast] = useState('')
  const toastT = useRef(0)
  const say = (t: string) => {
    setToast(t)
    clearTimeout(toastT.current)
    toastT.current = window.setTimeout(() => setToast(''), 1800)
  }
  // 처음 들어왔을 때(정보도 moment도 없을 때)는 정보 입력부터 연다
  useEffect(() => {
    if (!active || saved || n > 0) return
    const t = window.setTimeout(() => setForm(true), 900)
    return () => clearTimeout(t)
  }, [active])

  useEffect(() => {
    if (!active) {
      setForm(false)
      setCap(false)
      setOrg(false)
    }
  }, [active])

  const save = () => {
    const range = from ? (to ? `${fmt(from)} > ${fmt(to)}` : fmt(from)) : ''
    onChange({ city: place.trim() || name.trim() || 'Untitled', date: range, name })
    setForm(false)
  }

  return (
    <div className="l-root" ref={ref}>
      <div className="design" style={{ width: W, height: H, transform: `scale(${k})` }}>
        <div className="dl-lp" style={{ left: LP.cx - LP.r, top: LP.cy - LP.r, width: LP.r * 2, height: LP.r * 2 }}>
          <svg className="dl-svg" viewBox={`${-LP.r} ${-LP.r} ${LP.r * 2} ${LP.r * 2}`}>
            <circle r={172} fill="#38373b" />
            <circle r={118} fill="#232226" />
            <circle r={110} fill="#38373b" />
            <circle r={7} fill="#000" />
          </svg>
          {/* 새겨진 홈: 판이 돌아도 핀과 맞도록 회전하지 않는 겹 */}
          <svg className="dl-grooves" viewBox={`${-LP.r} ${-LP.r} ${LP.r * 2} ${LP.r * 2}`}>
            {album.moments.map((m, k) => {
              const { deg, r } = pinPos(k)
              return (
                <circle
                  key={m.id}
                  className="dl-carve"
                  r={r}
                  transform={`rotate(${deg})`}
                  style={{ '--len': (2 * Math.PI * r).toFixed(1) } as React.CSSProperties}
                />
              )
            })}
          </svg>
        </div>

        {album.moments.map((m, k) => {
          const { deg, r } = pinPos(k)
          const a = (deg * Math.PI) / 180
          const thumb = m.poster || (m.kind !== 'video' ? m.src : '')
          return (
            <div key={m.id} className="dl-pin" style={{ left: LP.cx + (r + 3) * Math.cos(a), top: LP.cy + (r + 3) * Math.sin(a) }}>
              <div className="dl-thumb" style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}>
                {!thumb && m.kind === 'video' && <video src={m.src} muted playsInline preload="metadata" />}
              </div>
              <i className="dl-stem" />
              <i className="dl-foot" />
            </div>
          )
        })}

        <button type="button" className="dl-city" onClick={() => setForm(true)}>
          <b>
            {album.city || 'New Journey'} <span className="dl-edit">✎</span>
          </b>
          {album.date && <span>{album.date}</span>}
          <small>
            {n} MOMENT{n === 1 ? '' : 'S'}
          </small>
        </button>

        <button type="button" className="dl-record" onClick={() => setCap(true)}>
          + Record a moment
        </button>
      </div>

      <button type="button" className="l-back" onClick={onBack} aria-label="Back to albums">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        className={`dl-finish ${n ? '' : 'off'}`}
        onClick={() => (n ? setOrg(true) : say('Record at least one moment first'))}
      >
        Finish
      </button>
      {toast && <div className="dl-toast">{toast}</div>}

      {org && <Organizer album={album} onChange={(moments) => onChange({ moments })} onClose={() => setOrg(false)} onFinish={onFinish} />}

      {cap && (
        <Capture
          title={album.city || 'New Journey'}
          index={album.moments.length + 1}
          onClose={() => setCap(false)}
          onDone={(m) => {
            onChange({ moments: [...album.moments, m] })
            setCap(false)
          }}
        />
      )}

      {form && (
        <div className="df">
          <div className="df-top">
            <button type="button" onClick={() => setForm(false)} aria-label="Back">
              ←
            </button>
            <button type="button" onClick={save}>
              Save
            </button>
          </div>
          <div className="df-lp">
            <i />
          </div>
          <label className="df-l">
            LP Name <em>{name.length}/50</em>
          </label>
          <input
            className="df-in"
            value={name}
            maxLength={50}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter a name"
          />
          <p className="df-h">Schedule</p>
          <div className="df-dates">
            <label>
              <span>{fmt(from) || 'Start'}</span>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <b>›</b>
            <label>
              <span>{fmt(to) || 'End'}</span>
              <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>
          <p className="df-h line">Add location</p>
          <input
            className="df-loc"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="e.g. Paris, France"
          />
        </div>
      )}
    </div>
  )
}
