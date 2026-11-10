import { useEffect, useState } from 'react'

/**
 * Media blobs (photo / video / audio) live in IndexedDB so they survive a
 * page reload. Object URLs are cached in memory for the current session.
 */
const DB_NAME = 'lp-travel'
const STORE = 'media'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function putBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getBlob(id: string): Promise<Blob | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(id)
    req.onsuccess = () => resolve(req.result as Blob | undefined)
    req.onerror = () => reject(req.error)
  })
}

const urlCache = new Map<string, string>()

export async function saveMedia(id: string, blob: Blob): Promise<void> {
  urlCache.set(id, URL.createObjectURL(blob))
  try {
    await putBlob(id, blob)
  } catch {
    // Storage can be unavailable (private mode); the session still works.
  }
}

export async function loadMediaUrl(id: string): Promise<string | null> {
  const cached = urlCache.get(id)
  if (cached) return cached
  try {
    const blob = await getBlob(id)
    if (!blob) return null
    const url = URL.createObjectURL(blob)
    urlCache.set(id, url)
    return url
  } catch {
    return null
  }
}

export function useMediaUrl(id: string | null | undefined): string | null {
  const [state, setState] = useState<{ id: string; url: string | null } | null>(
    null,
  )
  useEffect(() => {
    if (!id) return
    let alive = true
    loadMediaUrl(id).then((url) => {
      if (alive) setState({ id, url })
    })
    return () => {
      alive = false
    }
  }, [id])
  return id && state?.id === id ? state.url : null
}
