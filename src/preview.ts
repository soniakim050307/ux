/**
 * 노래 제목·가수로 30초 미리듣기를 찾는다 (iTunes Search API, 키 불필요).
 * 전곡 재생은 실제 앱에서 사용자 본인의 Apple Music 구독(MusicKit)으로 하고,
 * 이 체험판에서는 Apple 이 공개한 30초 미리듣기 주소를 그대로 재생한다 (파일을 복사해 넣지 않는다).
 */
export interface Preview {
  url: string
  art?: string
}

const cache = new Map<string, Promise<Preview | null>>()
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

export function findPreview(title: string, artist: string): Promise<Preview | null> {
  const key = `${title}|${artist}`
  let p = cache.get(key)
  if (!p) {
    p = (async () => {
      try {
        const q = encodeURIComponent(`${title} ${artist}`)
        const r = await fetch(`https://itunes.apple.com/search?term=${q}&media=music&entity=song&limit=8`)
        if (!r.ok) return null
        const j = (await r.json()) as { results: { trackName: string; artistName: string; previewUrl?: string; artworkUrl100?: string }[] }
        const withPrev = j.results.filter((x) => x.previewUrl)
        const t = norm(title)
        const a = norm(artist)
        const hit =
          withPrev.find((x) => norm(x.trackName) === t && (norm(x.artistName).includes(a) || a.includes(norm(x.artistName)))) ??
          withPrev.find((x) => norm(x.trackName) === t) ??
          null
        return hit ? { url: hit.previewUrl!, art: hit.artworkUrl100 } : null
      } catch {
        return null
      }
    })()
    cache.set(key, p)
    // 못 찾았을 때는 다음에 다시 시도할 수 있게 캐시에서 뺀다
    void p.then((v) => v ?? cache.delete(key))
  }
  return p
}
