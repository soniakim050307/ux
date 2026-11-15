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
const strip = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const norm = (s: string) => strip(s.toLowerCase()).replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
const toks = (s: string) => norm(s).split(' ').filter(Boolean)
/** "Jay-Z ft. Alicia Keys" → "jay z", "A & B" → "a" (대표 가수 한 명만 비교) */
const mainArtist = (s: string) => norm(s.split(/\s+(?:ft\.?|feat\.?|featuring|&|x)\s+|,/i)[0])

type Hit = { trackName: string; artistName: string; previewUrl?: string; artworkUrl100?: string }

function pick(results: Hit[], title: string, artist: string): Hit | null {
  const withPrev = results.filter((x) => x.previewUrl)
  const t = toks(title)
  const ma = mainArtist(artist)
  const artistOk = (x: Hit) => {
    const ra = norm(x.artistName)
    return ra.includes(ma) || ma.includes(ra)
  }
  // 제목 단어가 모두 들어 있고(Single Version 같은 꼬리표 허용) 가수도 맞는 것. 제목이 정확히 같은 것을 먼저.
  const titleOk = (x: Hit) => {
    const rt = toks(x.trackName)
    return t.every((w) => rt.includes(w) || (w === 'o' && true))
  }
  const exact = withPrev.find((x) => artistOk(x) && norm(x.trackName) === norm(title))
  return exact ?? withPrev.find((x) => artistOk(x) && titleOk(x)) ?? null
}

async function search(term: string, country?: string): Promise<Hit[]> {
  const q = encodeURIComponent(term)
  const r = await fetch(`https://itunes.apple.com/search?term=${q}&media=music&entity=song&limit=15${country ? `&country=${country}` : ''}`)
  if (!r.ok) return []
  return ((await r.json()) as { results: Hit[] }).results
}

export function findPreview(title: string, artist: string): Promise<Preview | null> {
  const key = `${title}|${artist}`
  let p = cache.get(key)
  if (!p) {
    p = (async () => {
      try {
        for (const country of [undefined, 'KR', 'GB']) {
          const hit = pick(await search(`${title} ${mainArtist(artist)}`, country), title, artist)
          if (hit) return { url: hit.previewUrl!, art: hit.artworkUrl100 }
        }
        return null
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
