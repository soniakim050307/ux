import type { FlowAlbum } from './data'

/**
 * 한 사용자의 기록을 브라우저에 저장해서 새로고침해도 이어서 쓸 수 있게 한다.
 *  - 앨범/초안 정보(JSON)와 사진·영상·음성 파일(Blob)을 IndexedDB 에 둔다.
 *  - 저장할 때 blob: 주소는 `idb:<키>` 로 바꿔 적고, 불러올 때 다시 blob: 주소로 되돌린다.
 *  - 저장소를 못 쓰는 환경(시크릿 모드 등)에서는 조용히 건너뛰고 평소처럼 동작한다.
 */
const DB_NAME = 'blue-vinyl'
const META = 'meta'
const BLOBS = 'blobs'
const STATE_KEY = 'state'
const VERSION = 1

export interface SavedState {
  created: FlowAlbum[]
  draft: FlowAlbum | null
}

let dbp: Promise<IDBDatabase | null> | null = null
function db(): Promise<IDBDatabase | null> {
  if (!dbp) {
    dbp = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, 1)
        req.onupgradeneeded = () => {
          req.result.createObjectStore(META)
          req.result.createObjectStore(BLOBS)
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => resolve(null)
        req.onblocked = () => resolve(null)
      } catch {
        resolve(null)
      }
    })
  }
  return dbp
}

function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest | void): Promise<T | undefined> {
  return db().then(
    (d) =>
      new Promise<T | undefined>((resolve) => {
        if (!d) return resolve(undefined)
        try {
          const tx = d.transaction(store, mode)
          const req = fn(tx.objectStore(store))
          tx.oncomplete = () => resolve(req ? (req.result as T) : undefined)
          tx.onerror = () => resolve(undefined)
          tx.onabort = () => resolve(undefined)
        } catch {
          resolve(undefined)
        }
      }),
  )
}

/** 이번 접속에서 만든 blob: 주소 ↔ 저장소 키 */
const urlToKey = new Map<string, string>()
let keySeq = 0
const newKey = () => `m${Date.now().toString(36)}${(keySeq++).toString(36)}`

async function mapStrings<T>(v: T, f: (s: string) => Promise<string>): Promise<T> {
  if (typeof v === 'string') return (await f(v)) as unknown as T
  if (Array.isArray(v)) return (await Promise.all(v.map((x) => mapStrings(x, f)))) as unknown as T
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) out[k] = await mapStrings(x, f)
    return out as T
  }
  return v
}

async function toStored(s: string, keep: Set<string>): Promise<string> {
  if (!s.startsWith('blob:')) return s
  let key = urlToKey.get(s)
  if (!key) {
    try {
      const blob = await (await fetch(s)).blob()
      key = newKey()
      await run(BLOBS, 'readwrite', (st) => st.put(blob, key))
      urlToKey.set(s, key)
    } catch {
      return s // 이미 사라진 주소는 그대로 둔다 (다음 접속에서는 빈 칸)
    }
  }
  keep.add(key)
  return `idb:${key}`
}

async function fromStored(s: string): Promise<string> {
  if (!s.startsWith('idb:')) return s
  const key = s.slice(4)
  const blob = await run<Blob>(BLOBS, 'readonly', (st) => st.get(key))
  if (!blob) return ''
  const url = URL.createObjectURL(blob)
  urlToKey.set(url, key)
  return url
}

export async function loadState(): Promise<SavedState | null> {
  try {
    const raw = await run<{ v: number; state: SavedState }>(META, 'readonly', (st) => st.get(STATE_KEY))
    if (!raw || raw.v !== VERSION) return null
    return await mapStrings(raw.state, fromStored)
  } catch {
    return null
  }
}

let seq = 0
let timer = 0
let latest: SavedState | null = null

/** 변경될 때마다 불러도 된다. 잠깐 모아서 한 번만 쓴다. */
export function saveState(state: SavedState) {
  latest = state
  clearTimeout(timer)
  timer = window.setTimeout(flush, 350)
}

async function flush() {
  const state = latest
  if (!state) return
  const mine = ++seq
  const keep = new Set<string>()
  try {
    const stored = await mapStrings(state, (s) => toStored(s, keep))
    if (mine !== seq) return // 더 새로운 저장이 이미 시작됨
    await run(META, 'readwrite', (st) => st.put({ v: VERSION, state: stored }, STATE_KEY))
    // 더는 쓰이지 않는 파일 정리
    const keys = (await run<IDBValidKey[]>(BLOBS, 'readonly', (st) => st.getAllKeys())) ?? []
    for (const k of keys) if (!keep.has(String(k))) await run(BLOBS, 'readwrite', (st) => st.delete(k))
  } catch {
    /* 저장 실패는 무시 */
  }
}

/** 탭을 닫기 직전에도 한 번 더 시도 */
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    if (latest) void flush()
  })
  try {
    void navigator.storage?.persist?.()
  } catch {
    /* ignore */
  }
}
