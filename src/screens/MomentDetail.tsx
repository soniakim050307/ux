import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { FlowAlbum } from '../data'
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
    if (dx < -40 && index < moments.length - 1) onIndex(index + 1)
    else if (dx > 40 && index > 0) onIndex(index - 1)
  }

  return (
    <div className="d-root" ref={ref} onPointerDown={onDown} onPointerUp={onUp}>
      <div className="design" style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${k})` }}>
        <header className="d-head">
          <h2>{album.city}</h2>
          <p>
            {m.time ?? `MOMENT ${index + 1}`}
          </p>
        </header>

        <div className="d-media" key={m.id}>
          {m.kind === 'video' ? (
            <video src={m.src} muted loop playsInline autoPlay controls />
          ) : (
            <img src={m.src} alt="" draggable={false} />
          )}
        </div>

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

        <div className="d-memo">
          <span>MEMO</span>
          <p>{m.note || '남겨둔 메모가 없어요.'}</p>
        </div>

        <div className="d-dots">
          {moments.map((x, i) => (
            <i key={x.id} className={i === index ? 'on' : ''} />
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
