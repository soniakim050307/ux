import { useState } from 'react'
import MomentCircle from '../components/MomentCircle'
import { SONGS, type Draft, type Song } from '../types'

interface Props {
  title: string
  momentNo: number
  draft: Draft
  onBack: () => void
  onPress: (note: string, song: Song | null) => void
}

export default function Compose({ title, momentNo, draft, onBack, onPress }: Props) {
  const [note, setNote] = useState('')
  const [song, setSong] = useState<Song | null>(null)
  const [picking, setPicking] = useState(false)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const results = SONGS.filter(
    (s) => !q || s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q),
  )

  return (
    <div className="screen compose">
      <header className="top row">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Back">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1>{title}</h1>
        <p className="sub">MOMENT {momentNo}</p>
      </header>

      <div className="compose-media">
        <MomentCircle id={draft.id} type={draft.type} />
        <div className="next-dashed" aria-hidden />
      </div>

      <button type="button" className="song-row" onClick={() => setPicking(true)}>
        <span className="song-disc">
          <i />
        </span>
        <span className="song-text">
          {song ? (
            <>
              <b>{song.title}</b>
              <span>{song.artist}</span>
            </>
          ) : (
            <b>Choose a song</b>
          )}
        </span>
        <span className="song-edit">Edit</span>
      </button>

      <label className="note">
        <span>NOTE</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write this moment briefly..."
          maxLength={120}
        />
      </label>

      <div className="bottom">
        <button type="button" className="press-btn" onClick={() => onPress(note.trim(), song)}>
          PRESS INTO LP
        </button>
      </div>

      {picking && (
        <div className="sheet-backdrop" onClick={() => setPicking(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <i className="grab" />
            <h2>Edit Songs</h2>
            <input
              className="search"
              placeholder="Search Songs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <ul>
              {results.map((s) => (
                <li key={s.title}>
                  <button
                    type="button"
                    onClick={() => {
                      setSong(s)
                      setPicking(false)
                    }}
                  >
                    <b>{s.title}</b>
                    <span>{s.artist}</span>
                  </button>
                </li>
              ))}
              {results.length === 0 && <li className="none">No songs found</li>}
            </ul>
            {song && (
              <button
                type="button"
                className="clear"
                onClick={() => {
                  setSong(null)
                  setPicking(false)
                }}
              >
                Remove song
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
