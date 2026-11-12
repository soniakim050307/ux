import { useEffect, useRef, useState } from 'react'
import type { FlowAlbum } from '../data'
import { useDesignScale } from '../useDesignScale'
import Capture from './Capture'
import Organizer from './Organizer'

const W = 393
const H = 852
const LP = { cx: 39, cy: 408, r: 323 }
/** 홈 하나 = 하루 (바깥이 첫째 날). 같은 날 moment는 같은 홈에, 각도는 하루 중 시각 (위가 아침, 아래가 밤) */

interface Props {
  album: FlowAlbum
  active: boolean
  onChange: (p: Partial<FlowAlbum>) => void
  onBack: () => void
  onFinish: () => void
}

/** 인트로 판(607px, 중심 35.5/379.5)을 (cx, cy) 중심·지름 d·회전 r 로 옮기는 transform */
const TV = (cx: number, cy: number, d: number, r: number) => `translate(${cx - 35.5}px,${cy - 379.5}px) scale(${d / 607}) rotate(${r}deg)`
const SL_SIDE = 'translate(-84px,-12px) scale(.8) rotate(-4deg)' // 판 옆에 놓인 재킷
const SL_FORM = 'translate(0.5px,-234px) scale(.536)' // 정보 입력 화면 위쪽 재킷 자리(118px)와 정확히 겹치게

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
  const [here, setHere] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locErr, setLocErr] = useState('')
  const useHere = () => {
    setLocErr('')
    if (!navigator.geolocation) return setLocErr('Location is not available in this browser.')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`,
          )
          const d = await r.json()
          const city = d.city || d.locality || d.principalSubdivision
          setPlace([city, d.countryName].filter(Boolean).join(', ') || `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`)
        } catch {
          setPlace(`${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`)
        }
        setHere(true)
        setLocating(false)
      },
      () => {
        setLocating(false)
        setHere(false)
        setLocErr('Allow location access to use this.')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    )
  }
  const saved = album.city !== ''
  const n = album.moments.length
  /* 홈 하나 = moment 하나. 가장 바깥 홈이 첫 moment, 안쪽으로 갈수록 나중 moment.
     핀은 자기 홈 위에 꽂히고, 순서대로 보이는 오른쪽 호를 따라 위에서 아래로 내려가며 놓인다 */
  const ms = album.moments
  const step = ms.length > 1 ? Math.min(18, 112 / (ms.length - 1)) : 18
  const grooveOf = (i: number) => 298 - i * step
  const degOf = (i: number) => (ms.length > 1 ? -62 + i * Math.min(42, 124 / (ms.length - 1)) : -40)
  const [toast, setToast] = useState('')
  const toastT = useRef(0)
  const say = (t: string) => {
    setToast(t)
    clearTimeout(toastT.current)
    toastT.current = window.setTimeout(() => setToast(''), 1800)
  }
  /* 인트로 (blue-vinyl 흐름)
     split : 재킷(=정보)과 판(=moment)이 나란히 나옴 → 재킷만 남아 정보 입력으로
     back  : 정보를 저장하면 둘이 다시 나란히 → 재킷은 빠지고 판이 커지며 허브가 됨 */
  const [stage, setStage] = useState<'split' | 'back' | null>(null)
  const [lift, setLift] = useState(false) // 재킷이 정보 입력 자리로 올라가는 중
  const vRef = useRef<HTMLDivElement>(null)
  const sRef = useRef<HTMLDivElement>(null)
  const anims = useRef<Animation[]>([])
  const tms = useRef<number[]>([])
  const clearIntro = () => {
    anims.current.forEach((a) => a.cancel())
    anims.current = []
    tms.current.forEach(clearTimeout)
    tms.current = []
  }
  useEffect(() => {
    if (active && !saved && n === 0) setStage('split')
    if (!active) {
      clearIntro()
      setStage(null)
    }
  }, [active])
  useEffect(() => {
    const V = vRef.current,
      Sl = sRef.current
    if (!V || !Sl) return
    const ease = 'cubic-bezier(.45,0,.2,1)'
    if (stage === 'split') {
      const D = 1900
      anims.current.push(
        V.animate(
          [
            { transform: TV(196, 400, 200, 0), opacity: 0, offset: 0 },
            { transform: TV(196, 400, 200, 0), opacity: 0, offset: 0.18 },
            { transform: TV(196, 400, 200, 0), opacity: 1, offset: 0.19 },
            { transform: TV(206, 400, 200, 15), offset: 0.28, easing: ease },
            { transform: TV(286, 388, 180, 250), offset: 0.62, easing: ease },
            { transform: TV(286, 388, 180, 250), offset: 1 },
          ],
          { duration: D, fill: 'both' },
        ),
        Sl.animate(
          [
            { transform: 'translateY(40px) scale(.7)', opacity: 0, offset: 0 },
            {
              transform: 'none',
              opacity: 1,
              offset: 0.18,
              easing: 'cubic-bezier(.2,.9,.3,1.2)',
            },
            { transform: 'none', offset: 0.3 },
            { transform: SL_SIDE, offset: 0.62, easing: ease },
            { transform: SL_SIDE, offset: 1 },
          ],
          { duration: D, fill: 'both' },
        ),
      )
      // 보여주기만 하고 곧바로 정보 입력으로 (재킷만 남아 위로)
      tms.current.push(
        window.setTimeout(() => {
          setLift(true)
          anims.current.push(
            V.animate(
              [
                { opacity: 1, transform: TV(286, 388, 180, 250) },
                { opacity: 0, transform: TV(330, 388, 150, 300) },
              ],
              { duration: 400, fill: 'forwards' },
            ),
            Sl.animate([{ transform: SL_SIDE }, { transform: SL_FORM }], {
              duration: 520,
              easing: 'cubic-bezier(.4,0,.2,1)',
              fill: 'forwards',
            }),
          )
          tms.current.push(window.setTimeout(() => setForm(true), 480))
        }, D + 700),
      )
    }
    if (stage === 'back') {
      setLift(false)
      clearIntro()
      Sl.style.zIndex = '1'
      V.style.zIndex = '2'
      anims.current.push(
        Sl.animate(
          [
            {
              transform: SL_FORM,
              opacity: 1,
              easing: 'cubic-bezier(.4,0,.2,1)',
            },
            { transform: SL_SIDE, opacity: 1, offset: 0.22 },
            {
              transform: SL_SIDE,
              opacity: 1,
              offset: 0.42,
              easing: 'cubic-bezier(.45,0,.55,1)',
            },
            {
              transform: 'translate(-330px,10px) scale(.75) rotate(-16deg)',
              opacity: 0,
              offset: 0.72,
            },
            {
              transform: 'translate(-330px,10px) scale(.75) rotate(-16deg)',
              opacity: 0,
              offset: 1,
            },
          ],
          { duration: 3400, fill: 'both' },
        ),
      )
      const a = V.animate(
        [
          { transform: TV(330, 388, 150, 300), opacity: 0, offset: 0 },
          { transform: TV(286, 388, 180, 250), opacity: 1, offset: 0.22 },
          { transform: TV(286, 388, 180, 340), offset: 0.55, easing: ease },
          { transform: TV(LP.cx, LP.cy, LP.r * 2, 520), offset: 1 },
        ],
        { duration: 3400, fill: 'both' },
      )
      anims.current.push(a)
      a.onfinish = () => setStage(null)
    }
  }, [stage])
  // 인트로 중 판(=Moment)을 누르면 바로 기록으로
  const pickMoment = () => {
    clearIntro()
    setForm(false)
    setStage(null)
    setCap(true)
  }

  useEffect(() => {
    if (!active) {
      setForm(false)
      setCap(false)
      setOrg(false)
    }
  }, [active])

  const save = () => {
    const range = from ? (to ? `${fmt(from)} > ${fmt(to)}` : fmt(from)) : ''
    onChange({
      city: place.trim() || name.trim() || 'Untitled',
      date: range,
      name,
    })
    setForm(false)
    if (stage === 'split') setStage('back')
  }

  return (
    <div className="l-root" ref={ref}>
      <div className={`design ${stage ? 'dl-intro-on' : 'dl-hub-in'}`} style={{ width: W, height: H, transform: `scale(${k})` }}>
        {stage && (
          <div className={`dl-intro ${stage} ${lift ? 'lift' : ''}`}>
            <div className="dl-ihead">New Journey</div>
            <div className="dl-ivinyl" ref={vRef} onClick={pickMoment}>
              <i />
            </div>
            <div className="dl-isleeve" ref={sRef}>
              <b>{album.name || album.city || 'New Journey'}</b>
              <small>{album.date || 'BLANK LP'} · SIDE A</small>
            </div>
          </div>
        )}
        <div
          className="dl-lp"
          style={{
            left: LP.cx - LP.r,
            top: LP.cy - LP.r,
            width: LP.r * 2,
            height: LP.r * 2,
          }}
        >
          <svg className="dl-svg" viewBox={`${-LP.r} ${-LP.r} ${LP.r * 2} ${LP.r * 2}`}>
            <circle r={172} fill="#38373b" />
            <circle r={118} fill="#232226" />
            <circle r={110} fill="#38373b" />
            <circle r={7} fill="#000" />
          </svg>
          {/* 새겨진 홈: 판이 돌아도 핀과 맞도록 회전하지 않는 겹 */}
          <svg className="dl-grooves" viewBox={`${-LP.r} ${-LP.r} ${LP.r * 2} ${LP.r * 2}`}>
            {ms.map((m, i) => {
              const r = grooveOf(i)
              // 그 moment 의 핀 자리에서부터 새겨지기 시작
              return (
                <circle
                  key={m.id}
                  className="dl-carve"
                  r={r}
                  transform={`rotate(${degOf(i)})`}
                  style={
                    {
                      '--len': (2 * Math.PI * r).toFixed(1),
                    } as React.CSSProperties
                  }
                />
              )
            })}
          </svg>
        </div>

        {ms.map((m, i) => {
          const r = grooveOf(i)
          const a = (degOf(i) * Math.PI) / 180
          const thumb = m.poster || (m.kind !== 'video' ? m.src : '')
          return (
            <div
              key={m.id}
              className="dl-pin"
              style={{
                left: LP.cx + r * Math.cos(a),
                top: LP.cy + r * Math.sin(a),
              }}
            >
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

      {!stage && (
        <button
          type="button"
          className={`dl-finish ${n ? '' : 'off'}`}
          onClick={() => (n ? setOrg(true) : say('Record at least one moment first'))}
        >
          Finish
        </button>
      )}
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
            <button
              type="button"
              onClick={() => {
                setForm(false)
                clearIntro()
                setStage(null)
              }}
              aria-label="Back"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
                <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" onClick={save}>
              Save
            </button>
          </div>
          {/* 입력하는 대로 재킷에 바로 찍혀 나오는 미리보기 */}
          <div className="df-lp">
            <i />
            <b>{name.trim() || place.trim() || 'New Journey'}</b>
            <small>{from ? fmt(from).slice(0, 7) : 'BLANK LP'} · SIDE A</small>
          </div>
          <label className="df-l">
            LP Name <em>{name.length}/50</em>
          </label>
          <input className="df-in" value={name} maxLength={50} onChange={(e) => setName(e.target.value)} placeholder="Enter a name" />
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
            onChange={(e) => {
              setPlace(e.target.value)
              setHere(false)
            }}
            placeholder="e.g. Paris, France"
            disabled={locating}
          />
          {/* 현재 위치로 채우기: 위치 → 도시·나라 이름 */}
          <label className={`df-here ${here ? 'on' : ''}`}>
            <input type="checkbox" checked={here} onChange={(e) => (e.target.checked ? useHere() : setHere(false))} />
            <i />
            <span>{locating ? 'Finding where you are…' : 'Use current location'}</span>
          </label>
          {locErr && <p className="df-here-err">{locErr}</p>}
        </div>
      )}
    </div>
  )
}
