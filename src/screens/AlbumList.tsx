import { useState, type CSSProperties, type FormEvent } from 'react'
import type { Album } from '../types'

// Face heights vary down the stack, like the Figma "main" screen:
// the stack folds toward the middle record, then opens up again.
const FACE_HEIGHTS = [66, 60, 52, 36, 8, 22, 40, 60]

interface Props {
  albums: Album[]
  onOpen: (id: string) => void
  onAdd: (name: string) => void
}

export default function AlbumList({ albums, onOpen, onAdd }: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
    setAdding(false)
  }

  return (
    <div className="screen list-screen">
      <div className="slab-stack">
        {albums.map((a, i) => {
          const h = FACE_HEIGHTS[i % FACE_HEIGHTS.length]
          const above = i % FACE_HEIGHTS.length > 4
          const label = (
            <span className="slab-label">
              <b>{a.name}</b>
              <span>{a.date}</span>
            </span>
          )
          return (
            <button
              key={a.id}
              type="button"
              className={`slab ${above ? 'above' : ''}`}
              style={{ '--h': `${h}px` } as CSSProperties}
              onClick={() => onOpen(a.id)}
            >
              {!above && label}
              <span className="slab-face" />
              {above && label}
            </button>
          )
        })}

        {adding ? (
          <form className="slab add-form" onSubmit={submit}>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="City, Country"
              aria-label="New album name"
            />
            <div>
              <button type="button" onClick={() => setAdding(false)}>
                Cancel
              </button>
              <button type="submit" className="primary">
                Add
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            className="slab above add"
            style={{ '--h': '64px' } as CSSProperties}
            onClick={() => setAdding(true)}
          >
            <span className="slab-face">
              <svg viewBox="0 0 24 24" width="30" height="30">
                <path
                  d="M12 4v16M4 12h16"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="slab-label">
              <b>+ Add New Album</b>
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
