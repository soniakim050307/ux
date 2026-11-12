import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { lpBgImage, type FlowAlbum } from '../data'
import { playMusic } from '../music'
import { DESIGN_H, DESIGN_W, useDesignScale } from '../useDesignScale'

interface Props {
  album: FlowAlbum
  index: number
  onIndex: (i: number) => void
  onClose: () => void
}

/** 한 순간을 크게: 사진/영상 + 음악 + 메모 */
export default function MomentDetail({ album, index, onIndex, onClose }: Props) {
  const { ref, k } = useDesignScale<HTMLDivElement>()
  const moments = album.moments
  const m = moments[index]
  const [musicOn, setMusicOn] = useState(true)
  const start = useRef<number | null>(null)
  const [dir, setDir] = useState<1 | -1>(1)
  const go = (i: number) => {
    if (i < 0 || i >= moments.length || i === index) return
    setDir(i > index ? 1 : -1)
    onIndex(i)
  }

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(index + 1)
      else if (e.key === 'ArrowLeft') go(index - 1)
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  })

  useEffect(() => {
    if (!musicOn) return
    return playMusic({ src: m.audio, seed: index, start: m.audioStart })
  }, [musicOn, index, m.audio, m.audioStart])

  const onDown = (e: PointerEvent) => {
    start.current = e.clientX
  }
  const onUp = (e: PointerEvent) => {
    if (start.current === null) return
    const dx = (e.clientX - start.current) / k
    start.current = null
    if (dx < -40 && index < moments.length - 1) go(index + 1)
    else if (dx > 40 && index > 0) go(index - 1)
  }

  return (
    <div className="d-root" ref={ref} onPointerDown={onDown} onPointerUp={onUp} style={{ background: lpBgImage(album.id) }}>
      <div className="design" style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${k})` }}>
        <header className="d-head">
          <h2>{album.city}</h2>
          <p>
            {m.time ?? `MOMENT ${index + 1}`}
          </p>
        </header>

        <div className={`d-media slide${dir > 0 ? 'r' : 'l'}`} key={m.id}>
          {m.kind === 'video' ? (
            <video src={m.src} poster={m.poster} muted loop playsInline autoPlay controls preload="auto" />
          ) : (
            <img src={m.src} alt="" draggable={false} />
          )}
        </div>

        {index > 0 && (
          <button type="button" className="d-arrow prev" onClick={() => go(index - 1)} aria-label="Previous moment">
            ‹
          </button>
        )}
        {index < moments.length - 1 && (
          <button type="button" className="d-arrow next" onClick={() => go(index + 1)} aria-label="Next moment">
            ›
          </button>
        )}

        {(m.song || m.audio) && (
          <div className="d-song">
            <span className={`d-disc ${musicOn ? 'spin' : ''}`}>
              <i />
            </span>
            <span className="d-song-text">
              <b>{m.song?.title ?? 'Music'}</b>
              {m.song && <span>{m.song.artist}</span>}
            </span>
            <button
              type="button"
              className="d-toggle"
              onClick={() => setMusicOn((v) => !v)}
              aria-label={musicOn ? 'Pause music' : 'Play music'}
            >
              {musicOn ? (
                <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden>
                  <path d="M3 1.5v9M9 1.5v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden>
                  <path d="M3 1.5v9l7.5-4.5z" fill="currentColor" />
                </svg>
              )}
            </button>
          </div>
        )}

        <div className={`d-memo slide${dir > 0 ? 'r' : 'l'}`} key={`n-${m.id}`}>
          <span>MEMO</span>
          <p>{m.note || '남겨둔 메모가 없어요.'}</p>
        </div>

        <div className="d-dots">
          {moments.map((x, i) => (
            <button key={x.id} type="button" className={i === index ? 'on' : ''} onClick={() => go(i)} aria-label={`Moment ${i + 1}`}>
              <i />
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="l-back" onClick={onClose} aria-label="Close">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path
            d="M15 5l-7 7 7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
