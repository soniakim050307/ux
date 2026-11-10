import { useEffect, useRef, useState } from 'react'
import type { FlowMoment } from '../data'
import { useDesignScale } from '../useDesignScale'

const W = 393
const H = 852
const CX = 196.5
const CY = 363
const R = 156
const RR = 166

interface Props {
  moment: FlowMoment
  dur: number
  peaks: number[]
  title: string
  index: number
  onSave: (song?: { title: string; artist: string }) => void
  onRetake: () => void
  onBack: () => void
}

/** 녹화가 끝난 뒤: 재생해서 살펴보고, 노래를 붙이고, 저장하거나 다시 찍는다 */
export default function Review({ moment, dur, peaks, title, index, onSave, onRetake, onBack }: Props) {
  const { ref, k } = useDesignScale<HTMLDivElement>(W)
  const media = useRef<HTMLVideoElement & HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [p, setP] = useState(0)
  const [song, setSong] = useState<{ title: string; artist: string } | null>(null)
  const [adding, setAdding] = useState(false)
  const [t, setT] = useState('')
  const [a, setA] = useState('')
  const isVideo = moment.kind === 'video'

  useEffect(() => {
    media.current?.play().then(() => setPlaying(true)).catch(() => {})
  }, [])

  const toggle = () => {
    const m = media.current
    if (!m) return
    if (m.ended || p >= 0.999) m.currentTime = 0
    if (m.paused) m.play().then(() => setPlaying(true)).catch(() => {})
    else {
      m.pause()
      setPlaying(false)
    }
  }

  const ang = p * Math.PI * 2 - Math.PI / 2
  const circ = 2 * Math.PI * RR
  const src = isVideo ? moment.src : moment.audio

  return (
    <div className="l-root cap" ref={ref}>
      <div className="design" style={{ width: W, height: H, transform: `scale(${k})` }}>
        <div className="cap-head">
          <b>{title}</b>
          <span>MOMENT {index}</span>
        </div>
        <button type="button" className="rv-save" onClick={() => onSave(song ?? undefined)}>
          Save
        </button>

        <button type="button" className="rv-chip" onClick={() => setAdding(true)}>
          <i className="rv-art" />
          <span>
            <b>{song ? 'Now Playing' : 'Add music'}</b>
            <em>{song ? `${song.title}${song.artist ? ' - ' + song.artist : ''}` : 'Tap + to add a song'}</em>
          </span>
          <u>{song ? '✓' : '+'}</u>
        </button>

        <div className="rv-disc" style={{ left: CX - R, top: CY - R, width: R * 2, height: R * 2 }}>
          {isVideo ? (
            <video
              ref={media}
              src={src}
              playsInline
              onTimeUpdate={(e) => setP(Math.min(1, e.currentTarget.currentTime / dur))}
              onEnded={() => {
                setPlaying(false)
                setP(1)
              }}
            />
          ) : (
            <>
              <audio
                ref={media}
                src={src}
                onTimeUpdate={(e) => setP(Math.min(1, e.currentTarget.currentTime / dur))}
                onEnded={() => {
                  setPlaying(false)
                  setP(1)
                }}
              />
              <div className="rv-wave">
                {peaks.map((v, i) => (
                  <i key={i} style={{ height: Math.max(4, v * 280), opacity: i / peaks.length <= p ? 1 : 0.45 }} />
                ))}
              </div>
            </>
          )}
        </div>

        <svg className="rv-ring" viewBox={`0 0 ${W} ${H}`}>
          <circle cx={CX} cy={CY} r={RR} fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" />
          <circle
            cx={CX}
            cy={CY}
            r={RR}
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
            strokeDasharray={`${circ * p} ${circ}`}
            transform={`rotate(-90 ${CX} ${CY})`}
          />
          <circle cx={CX + RR * Math.cos(ang)} cy={CY + RR * Math.sin(ang)} r="5" fill="#fff" />
        </svg>

        <div className="rv-ctl">
          <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? (
              <svg viewBox="0 0 20 22" width="20" height="22">
                <rect width="6" height="22" fill="#fff" />
                <rect x="12" width="6" height="22" fill="#fff" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 22" width="20" height="22">
                <path d="M2 1l16 10L2 21z" fill="#fff" />
              </svg>
            )}
          </button>
          <button type="button" className="re" onClick={onRetake} aria-label="Retake">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#2c2c34" strokeWidth="2.2" strokeLinecap="round">
              <path d="M20 12a8 8 0 11-2.6-5.9M20 3v5h-5" />
            </svg>
          </button>
        </div>

        {adding && (
          <div className="rv-sheet" onClick={() => setAdding(false)}>
            <div onClick={(e) => e.stopPropagation()}>
              <p>Add the song you were listening to</p>
              <input placeholder="Song title" value={t} onChange={(e) => setT(e.target.value)} />
              <input placeholder="Artist" value={a} onChange={(e) => setA(e.target.value)} />
              <div>
                {song && (
                  <button type="button" onClick={() => { setSong(null); setT(''); setA(''); setAdding(false) }}>
                    Remove
                  </button>
                )}
                <button
                  type="button"
                  className="ok"
                  disabled={!t.trim()}
                  onClick={() => {
                    setSong({ title: t.trim(), artist: a.trim() })
                    setAdding(false)
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <button type="button" className="l-back" onClick={onBack} aria-label="Back">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
