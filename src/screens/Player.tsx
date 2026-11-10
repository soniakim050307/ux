import { useCallback, useState } from 'react'
import MomentCircle from '../components/MomentCircle'
import type { Moment } from '../types'

interface Props {
  title: string
  moments: Moment[]
  onClose: () => void
}

/** Plays one moment, or every moment in order ("Replay"). */
export default function Player({ title, moments, onClose }: Props) {
  const [index, setIndex] = useState(0)
  const moment = moments[index]

  const next = useCallback(() => {
    if (index + 1 < moments.length) setIndex(index + 1)
    else onClose()
  }, [index, moments.length, onClose])

  if (!moment) return null

  return (
    <div className="screen player">
      <header className="top">
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1>{title}</h1>
        <p className="sub">
          MOMENT {index + 1} / {moments.length}
        </p>
      </header>

      <div className="player-media">
        <MomentCircle
          key={moment.id}
          id={moment.id}
          type={moment.type}
          autoPlay
          onEnded={next}
        />
      </div>

      {moment.song && (
        <p className="player-song">
          ♪ {moment.song.title} · {moment.song.artist}
        </p>
      )}
      {moment.note && <p className="player-note">{moment.note}</p>}

      <div className="bottom">
        <button type="button" className="pill-btn" onClick={next}>
          {index + 1 < moments.length ? 'Next moment' : 'Finish'}
        </button>
      </div>
    </div>
  )
}
