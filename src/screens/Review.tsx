import { useEffect, useRef, useState } from 'react'
import type { FlowMoment } from '../data'
import { useDesignScale } from '../useDesignScale'

const W = 393
const H = 852
/** 시안용 가짜 감지 결과: 폰에서 재생 중인 곡 ↔ 녹음 속에서 들린 곡이 번갈아 나온다 */
export const DETECTED = [
  { label: 'Now Playing', title: 'Summer', artist: 'The Volunteers' },
  { label: 'Heard in recording', title: 'La Vie en Rose', artist: 'Édith Piaf' },
]

interface Props {
  moment: FlowMoment
  dur: number
  peaks: number[]
  title: string
  index: number
  onSave: (song?: { title: string; artist: string }, note?: string, place?: string) => void
  onRetake: () => void
  onBack: () => void
}

type Song = { title: string; artist: string; color: string; when?: string; why?: string }
/** 노래 고르기: 방금 다른 앱에서 들은 곡 + 추천 곡 (실제 연동 전까지는 예시) */
const RECENT: Song[] = [
  { title: 'Paris in the rain', artist: 'Lauv', color: '#f5c518', when: '8 min ago' },
  { title: 'La Vie en rose', artist: 'Édith Piaf', color: '#e58a8a', when: '32 min ago' },
  { title: 'Clair de Lune', artist: 'Debussy', color: '#9fb4e6', when: '1 hr ago' },
  { title: 'Golden Hour', artist: 'JVKE', color: '#f0a35e', when: 'This morning' },
  { title: 'Sunday Morning', artist: 'Maroon 5', color: '#8fd1b5', when: 'Yesterday' },
]
const RECOMMENDED: Song[] = [
  { title: 'Les Champs-Élysées', artist: 'Joe Dassin', color: '#c9a4f0', why: 'Paris · walking' },
  { title: 'Je te laisserai des mots', artist: 'Patrick Watson', color: '#7fa7c9', why: 'Rainy afternoon' },
  { title: 'Moon River', artist: 'Audrey Hepburn', color: '#b8c4d9', why: 'Slow tempo' },
  { title: 'Coffee', artist: 'beabadoobee', color: '#d6a77a', why: 'Recorded at a café' },
  { title: 'Riptide', artist: 'Vance Joy', color: '#86c2a0', why: 'Like your recent picks' },
]
/* MY SONGS: 내가 자주 듣거나 아끼는 노래. 앨범이 달라도 계속 남도록 브라우저에 저장 */
type MySong = Song & { uses: number }
const MY_KEY = 'bv-my-songs'
const PALETTE = ['#f5c518', '#e58a8a', '#9fb4e6', '#f0a35e', '#8fd1b5', '#c9a4f0', '#d6a77a', '#86c2a0']
const loadMine = (): MySong[] => {
  try {
    return JSON.parse(localStorage.getItem(MY_KEY) || '[]')
  } catch {
    return []
  }
}
const saveMine = (l: MySong[]) => {
  try {
    localStorage.setItem(MY_KEY, JSON.stringify(l))
  } catch {
    /* 저장이 막힌 환경에서는 이번 화면에서만 유지 */
  }
}
const disc = (c: string) => `radial-gradient(circle, ${c} 0 18%, #000 19%)`

/** 녹화가 끝난 뒤 (blue-vinyl): 원 안에서 다시 보고, 노래를 붙이고, 짧은 메모를 남긴 뒤 LP에 새긴다 */
export default function Review({ moment, title, index, onSave, onRetake }: Props) {
  const { ref, k } = useDesignScale<HTMLDivElement>(W)
  const media = useRef<HTMLVideoElement & HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const first = RECENT.find((s) => s.title === moment.song?.title) ?? RECENT[0]
  const [song, setSong] = useState<Song>(first)
  const [sheet, setSheet] = useState(false)
  const [q, setQ] = useState('')
  const [note, setNote] = useState(moment.note ?? '')
  const [place, setPlace] = useState(moment.place ?? '')
  const [locating, setLocating] = useState(false)
  // 지금 있는 곳의 동네·거리 이름으로 채우기
  const fillHere = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`,
          )
          const d = await r.json()
          const parts = [d.locality, d.city].filter((v: string, i: number, a: string[]) => v && a.indexOf(v) === i)
          setPlace(parts.join(', ') || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`)
        } catch {
          setPlace(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`)
        }
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 10000, maximumAge: 300000 },
    )
  }
  const isVideo = moment.kind === 'video'
  const src = isVideo ? moment.src : moment.audio

  useEffect(() => () => media.current?.pause(), [])

  const toggle = () => {
    const m = media.current
    if (!m) return
    if (m.paused) m.play().then(() => setPlaying(true)).catch(() => {})
    else {
      m.pause()
      setPlaying(false)
    }
  }
  const [mine, setMine] = useState<MySong[]>(loadMine)
  const [adding, setAdding] = useState<{ title: string; artist: string } | null>(null)
  const updateMine = (l: MySong[]) => {
    setMine(l)
    saveMine(l)
  }
  const isMine = (s: Song) => mine.some((m) => m.title === s.title && m.artist === s.artist)
  const toggleMine = (s: Song) =>
    updateMine(isMine(s) ? mine.filter((m) => !(m.title === s.title && m.artist === s.artist)) : [{ ...s, uses: 0 }, ...mine])
  const addOwn = () => {
    if (!adding || !adding.title.trim()) return
    const s: MySong = { title: adding.title.trim(), artist: adding.artist.trim() || 'Unknown', color: PALETTE[mine.length % PALETTE.length], uses: 0 }
    updateMine([s, ...mine.filter((m) => !(m.title === s.title && m.artist === s.artist))])
    setSong(s)
    setAdding(null)
    setQ('')
    setSheet(false)
  }
  const match = (s: Song) => !q || (s.title + s.artist).toLowerCase().includes(q.toLowerCase())
  const row = (s: Song, sub: string) => (
    <button
      type="button"
      key={s.title}
      className={`et-srow ${s.title === song.title ? 'sel' : ''}`}
      onClick={() => {
        setSong(s)
        setSheet(false)
      }}
    >
      <i className="et-sd" style={{ background: disc(s.color) }} />
      <span className="et-st">
        {s.title}
        <small>{s.artist}</small>
      </span>
      <em>{sub}</em>
      <span
        role="button"
        className={`et-star ${isMine(s) ? 'on' : ''}`}
        aria-label={isMine(s) ? 'Remove from my songs' : 'Save to my songs'}
        onClick={(e) => {
          e.stopPropagation()
          toggleMine(s)
        }}
      >
        {isMine(s) ? '★' : '☆'}
      </span>
    </button>
  )

  return (
    <div className="l-root cap et" ref={ref}>
      <div className="design" style={{ width: W, height: H, transform: `scale(${k})` }}>
        <div className="et-head">
          <b>{title}</b>
          <span>MOMENT {index}</span>
        </div>

        <div className="et-media" onClick={toggle}>
          {isVideo ? (
            <video ref={media} src={src} playsInline loop onEnded={() => setPlaying(false)} />
          ) : (
            <audio ref={media} src={src} onEnded={() => setPlaying(false)} />
          )}
          {!playing && (
            <span className="et-play">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M8 5v14l11-7z" fill="#fff" />
              </svg>
            </span>
          )}
        </div>

        {/* 다시 찍기: 원 오른쪽 아래 */}
        <button type="button" className="et-retake" onClick={onRetake} aria-label="Retake">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12a8 8 0 1 0 2.4-5.7" />
            <path d="M4 4v4.5h4.5" />
          </svg>
          <span>Retake</span>
        </button>

        <div className="et-song">
          <i className={`et-d ${playing ? 'spin' : ''}`} style={{ background: disc(song.color) }} />
          <span className="et-t" key={song.title}>
            {song.title}
            <small>{song.artist}</small>
          </span>
          <button type="button" className="et-b" onClick={toggle} aria-label="Play">
            {playing ? '❚❚' : '▶'}
          </button>
          <button type="button" className="et-b" onClick={() => setSheet(true)} aria-label="Change song">
            ⇄
          </button>
        </div>

        <label className="et-note">
          NOTE
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write this moment briefly..." maxLength={80} />
        </label>

        {/* 세부 위치: 직접 쓰거나 지금 있는 곳으로 */}
        <label className="et-note et-place">
          PLACE
          <span className="et-place-row">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z" />
              <circle cx="12" cy="10" r="2.3" />
            </svg>
            <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Add a spot (café, street, view...)" maxLength={60} />
            <button type="button" className="et-here" onClick={fillHere} disabled={locating}>
              {locating ? '…' : 'Here'}
            </button>
          </span>
        </label>

        <button
          type="button"
          className="et-carve"
          onClick={() => {
            if (isMine(song)) updateMine(mine.map((m) => (m.title === song.title && m.artist === song.artist ? { ...m, uses: m.uses + 1 } : m)))
            onSave({ title: song.title, artist: song.artist }, note.trim() || undefined, place.trim() || undefined)
          }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="12" cy="12" r="1.4" fill="currentColor" />
          </svg>
          CARVE INTO LP
        </button>

        {sheet && (
          <>
            <div className="et-scrim" onClick={() => setSheet(false)} />
            <div className="et-sheet">
              <i className="et-grab" onClick={() => setSheet(false)} />
              <div className="et-sh-title">Add a song to this moment</div>
              <div className="et-search">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search songs, artists" />
              </div>
              <div className="et-list">
                {mine.filter(match).length > 0 && (
                  <>
                    <div className="et-sec">
                      MY SONGS <span>songs you keep coming back to</span>
                    </div>
                    {mine.filter(match).map((s) => row(s, s.uses ? `${s.uses} moment${s.uses === 1 ? '' : 's'}` : 'saved'))}
                  </>
                )}
                <div className="et-sec">
                  JUST PLAYED <span>from your music app</span>
                </div>
                {RECENT.filter(match).map((s) => row(s, s.when ?? ''))}
                <div className="et-sec">
                  RECOMMENDED <span>for this moment</span>
                </div>
                {RECOMMENDED.filter(match).map((s) => row(s, s.why ?? ''))}

                {/* 목록에 없으면 직접 추가 */}
                {adding ? (
                  <div className="et-add-form">
                    <input autoFocus value={adding.title} onChange={(e) => setAdding({ ...adding, title: e.target.value })} placeholder="Song title" />
                    <input value={adding.artist} onChange={(e) => setAdding({ ...adding, artist: e.target.value })} placeholder="Artist" />
                    <div>
                      <button type="button" onClick={() => setAdding(null)}>
                        Cancel
                      </button>
                      <button type="button" className="on" onClick={addOwn} disabled={!adding.title.trim()}>
                        Add to my songs
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="et-add" onClick={() => setAdding({ title: q, artist: '' })}>
                    + {q ? `Add “${q}” as your own song` : 'Add your own song'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <button type="button" className="l-back" onClick={onRetake} aria-label="Retake">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
