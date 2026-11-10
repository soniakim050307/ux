import { useState } from 'react'
import MomentCircle from '../components/MomentCircle'
import Vinyl from '../components/Vinyl'
import type { Album } from '../types'
import Player from './Player'

interface Props {
  album: Album
  onBack: () => void
  onEdit: () => void
}

export default function Trip({ album, onBack, onEdit }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [playing, setPlaying] = useState<'all' | 'one' | null>(null)
  const selected = album.moments.find((m) => m.id === selectedId) ?? null
  const count = album.moments.length

  if (playing && count > 0) {
    const list = playing === 'one' && selected ? [selected] : album.moments
    return (
      <Player title={album.name} moments={list} onClose={() => setPlaying(null)} />
    )
  }

  return (
    <div className="screen trip">
      <header className="top">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Back">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1>{album.name}</h1>
        <p className="sub">
          {count} MOMENT{count === 1 ? '' : 'S'}
        </p>
      </header>

      <div className="trip-preview">
        {selected ? (
          <MomentCircle
            key={selected.id}
            id={selected.id}
            type={selected.type}
            interactive={false}
          />
        ) : count === 0 ? (
          <p className="empty-hint">
            No moments yet.
            <br />
            Tap Edit to take your first one.
          </p>
        ) : null}
      </div>

      <Vinyl
        moments={album.moments}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
      />

      <div className="bottom">
        <div className="seg">
          <button
            type="button"
            className="seg-on"
            disabled={count === 0 && !selected}
            onClick={() => setPlaying(selected ? 'one' : 'all')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path d="M8 5v14l11-7z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            {selected ? 'Play This Moment' : 'Replay'}
          </button>
          <button type="button" onClick={onEdit}>
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path d="M4 20h4L19 9l-4-4L4 16z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}
