import { useEffect, useRef, useState } from 'react'
import { useMediaUrl } from '../media'
import type { MomentType } from '../types'

interface Props {
  id: string
  type: MomentType
  /** Tap to play / pause (video and audio). */
  interactive?: boolean
  autoPlay?: boolean
  /** Fired when playback ends (photos: after a short hold). */
  onEnded?: () => void
}

const PHOTO_HOLD_MS = 3500

export default function MomentCircle({
  id,
  type,
  interactive = true,
  autoPlay = false,
  onEnded,
}: Props) {
  const url = useMediaUrl(id)
  const mediaRef = useRef<HTMLMediaElement | null>(null)
  const [playing, setPlaying] = useState(false)

  // Photos have no timeline, so hold them briefly before moving on.
  useEffect(() => {
    if (type !== 'photo' || !autoPlay || !url || !onEnded) return
    const t = setTimeout(onEnded, PHOTO_HOLD_MS)
    return () => clearTimeout(t)
  }, [type, autoPlay, url, onEnded])

  useEffect(() => {
    if (type === 'photo' || !autoPlay || !url) return
    mediaRef.current?.play().catch(() => {})
  }, [type, autoPlay, url])

  const toggle = () => {
    const el = mediaRef.current
    if (!el || !interactive) return
    if (el.paused) el.play().catch(() => {})
    else el.pause()
  }

  const mediaProps = {
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onEnded: () => {
      setPlaying(false)
      onEnded?.()
    },
  }

  return (
    <div
      className={`moment-circle ${type}`}
      onClick={toggle}
      role={interactive && type !== 'photo' ? 'button' : undefined}
      aria-label={type !== 'photo' ? (playing ? 'Pause' : 'Play') : undefined}
    >
      {url && type === 'photo' && <img src={url} alt="" />}
      {url && type === 'video' && (
        <video
          ref={(el) => { mediaRef.current = el }}
          src={`${url}#t=0.1`}
          playsInline
          preload="metadata"
          {...mediaProps}
        />
      )}
      {type === 'audio' && (
        <>
          {url && <audio ref={(el) => { mediaRef.current = el }} src={url} preload="metadata" {...mediaProps} />}
          <div className={`mini-vinyl ${playing ? 'spin' : ''}`}>
            <span />
          </div>
          <div className={`wave ${playing ? 'live' : ''}`} aria-hidden>
            {Array.from({ length: 9 }, (_, i) => (
              <i key={i} style={{ animationDelay: `${i * 0.09}s` }} />
            ))}
          </div>
        </>
      )}
      {type !== 'photo' && interactive && !playing && (
        <span className="mc-play" aria-hidden>
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        </span>
      )}
    </div>
  )
}
