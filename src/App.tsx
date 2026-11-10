import { useEffect, useState } from 'react'
import { saveMedia } from './media'
import AlbumList from './screens/AlbumList'
import Compose from './screens/Compose'
import Press from './screens/Press'
import Record from './screens/Record'
import Trip from './screens/Trip'
import {
  SEED_ALBUMS,
  type Album,
  type Draft,
  type MomentType,
  type Song,
} from './types'

type View =
  | { name: 'list' }
  | { name: 'trip'; albumId: string }
  | { name: 'record'; albumId: string }
  | { name: 'compose'; albumId: string; draft: Draft }
  | { name: 'press'; albumId: string }

const STORAGE_KEY = 'lp-travel/albums/v1'

function loadAlbums(): Album[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Album[]
  } catch {
    // fall through to the seed data
  }
  return SEED_ALBUMS
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

export default function App() {
  const [albums, setAlbums] = useState<Album[]>(loadAlbums)
  const [view, setView] = useState<View>({ name: 'list' })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(albums))
    } catch {
      // storage full or blocked — keep working in memory
    }
  }, [albums])

  const album =
    view.name === 'list' ? null : albums.find((a) => a.id === view.albumId) ?? null

  const addAlbum = (name: string) => {
    const d = new Date()
    const date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
    setAlbums((prev) => [...prev, { id: newId(), name, date, moments: [] }])
  }

  const onCaptured = async (albumId: string, type: MomentType, blob: Blob) => {
    const id = newId()
    await saveMedia(id, blob)
    setView({ name: 'compose', albumId, draft: { id, type } })
  }

  const pressMoment = (
    albumId: string,
    draft: Draft,
    note: string,
    song: Song | null,
  ) => {
    setAlbums((prev) =>
      prev.map((a) =>
        a.id === albumId
          ? {
              ...a,
              moments: [
                ...a.moments,
                { id: draft.id, type: draft.type, note, song, createdAt: Date.now() },
              ],
            }
          : a,
      ),
    )
    setView({ name: 'press', albumId })
  }

  let screen
  if (view.name === 'list' || !album) {
    screen = (
      <AlbumList
        albums={albums}
        onOpen={(id) => setView({ name: 'trip', albumId: id })}
        onAdd={addAlbum}
      />
    )
  } else if (view.name === 'trip') {
    screen = (
      <Trip
        key={album.id + album.moments.length}
        album={album}
        onBack={() => setView({ name: 'list' })}
        onEdit={() => setView({ name: 'record', albumId: album.id })}
      />
    )
  } else if (view.name === 'record') {
    screen = (
      <Record
        title={album.name}
        momentNo={album.moments.length + 1}
        onBack={() => setView({ name: 'trip', albumId: album.id })}
        onCaptured={(type, blob) => onCaptured(album.id, type, blob)}
      />
    )
  } else if (view.name === 'compose') {
    const { draft } = view
    screen = (
      <Compose
        title={album.name}
        momentNo={album.moments.length + 1}
        draft={draft}
        onBack={() => setView({ name: 'record', albumId: album.id })}
        onPress={(note, song) => pressMoment(album.id, draft, note, song)}
      />
    )
  } else {
    screen = <Press onDone={() => setView({ name: 'trip', albumId: album.id })} />
  }

  return (
    <div className="stage">
      <div className="app">{screen}</div>
    </div>
  )
}
