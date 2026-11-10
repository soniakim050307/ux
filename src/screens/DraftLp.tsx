import { useEffect, useState } from 'react'
import type { FlowAlbum } from '../data'
import { useDesignScale } from '../useDesignScale'
import Capture from './Capture'
import Organizer from './Organizer'

const W = 393
const H = 852
const LP = { cx: 39, cy: 408, r: 323 }
const TR = 145 // 글자가 놓이는 반지름
const CIRCLE = `M0 ${-TR} A${TR} ${TR} 0 1 1 0 ${TR} A${TR} ${TR} 0 1 1 0 ${-TR}`
const LEN = 2 * Math.PI * TR

interface Props {
  album: FlowAlbum
  active: boolean
  onChange: (p: Partial<FlowAlbum>) => void
  onBack: () => void
}

const fmt = (iso: string) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  const day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date(iso).getDay()]
  return `${y.slice(2)}. ${+m}. ${+d}. (${day})`
}

/** 새 앨범: 줄무늬 없는 빈 LP → 글자를 눌러 정보 입력 → 장소/일정이 보인다 */
export default function DraftLp({ album, active, onChange, onBack }: Props) {
  const { ref, k } = useDesignScale<HTMLDivElement>(W)
  const [form, setForm] = useState(false)
  const [cap, setCap] = useState(false)
  const [org, setOrg] = useState(false)
  const [name, setName] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [place, setPlace] = useState('')
  const saved = album.city !== ''

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
        <div className={`dl-lp ${saved ? 'tap' : ''}`} onClick={() => saved && setCap(true)} style={{ left: LP.cx - LP.r, top: LP.cy - LP.r, width: LP.r * 2, height: LP.r * 2 }}>
          <svg
            className="dl-svg"
            viewBox={`${-LP.r} ${-LP.r} ${LP.r * 2} ${LP.r * 2}`}
            style={{ transform: `rotate(${saved ? -100 : 0}deg)` }}
          >
            {album.moments.map((m, i) => (
              <circle key={m.id} className="dl-groove" r={Math.max(184, 312 - i * 14)} fill="none" />
            ))}
            <circle r={172} fill="#38373b" />
            <circle r={118} fill="#232226" />
            <circle r={110} fill="#38373b" />
            <circle r={7} fill="#000" />
            <defs>
              <path id="dl-circ" d={CIRCLE} />
            </defs>
            <text className="dl-t on" onClick={() => !saved && setForm(true)}>
              <textPath href="#dl-circ" startOffset={LEN * 0.03}>
                Enter information
              </textPath>
            </text>
            <text className={`dl-t ${saved ? 'on go' : ''}`} onClick={(e) => {
                e.stopPropagation()
                if (saved) onBack()
              }}>
              <textPath href="#dl-circ" startOffset={LEN * 0.455}>
                Finish my journey
              </textPath>
            </text>
          </svg>
        </div>

        {saved && <p className="dl-hint">기록하려면 LP를 누르세요</p>}
        {saved && (
          <div className="dl-info">
            <b>{album.city}</b>
            {album.date && <span>{album.date}</span>}
            {album.moments.length > 0 && <span>{album.moments.length} MOMENT{album.moments.length > 1 ? "S" : ""}</span>}
          </div>
        )}
      </div>

      <button type="button" className="l-back" onClick={onBack} aria-label="Back to albums">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {saved && (
        <button type="button" className="dl-save" onClick={() => setOrg(true)}>
          Save
        </button>
      )}

      {org && <Organizer album={album} onChange={(moments) => onChange({ moments })} onClose={() => setOrg(false)} />}

      {cap && (
        <Capture
          title={album.city}
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
