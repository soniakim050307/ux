import { useEffect, useState } from 'react'

const PRESS_MS = 2600

/** "Press!" animation, then "Completed". */
export default function Press({ onDone }: { onDone: () => void }) {
  const [done, setDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDone(true), PRESS_MS)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`screen press ${done ? 'done' : ''}`}>
      <p className="press-text">{done ? 'Completed' : 'Press!'}</p>
      <div className="press-stage">
        {!done && <div className="press-plate" />}
        <div className="press-disc">
          <span className="press-label" />
        </div>
      </div>
      <div className="bottom">
        {done && (
          <button type="button" className="pill-btn" onClick={onDone}>
            Back to album
          </button>
        )}
      </div>
    </div>
  )
}
