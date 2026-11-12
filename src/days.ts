import type { FlowMoment } from './data'

/**
 * 믹싱된 한 곡 = 트랙 안의 한 구간.
 * 모먼트가 곡을 나누는 게 아니라, 노래가 바뀌는 지점이 구간의 경계다.
 * (한 곡이 여러 모먼트·여러 날에 걸칠 수 있다)
 */
export interface SongSeg {
  /** 1부터 시작하는 곡 순번 */
  n: number
  song: { title: string; artist: string; art?: string }
  /** album.moments 안에서 이 곡이 깔리는 모먼트 순번들 */
  idxs: number[]
}

const keyOf = (m: FlowMoment) => `${m.song?.title ?? ''}|${m.song?.artist ?? ''}`

/** 이어지는 모먼트 중 같은 노래끼리 한 구간으로 묶는다 */
export function buildSongs(moments: FlowMoment[]): SongSeg[] {
  const out: SongSeg[] = []
  let last = ''
  moments.forEach((m, i) => {
    const k = keyOf(m)
    if (out.length && k === last) {
      out[out.length - 1].idxs.push(i)
      return
    }
    last = k
    out.push({ n: out.length + 1, song: { title: m.song?.title ?? 'Music', artist: m.song?.artist ?? '', art: m.song?.art }, idxs: [i] })
  })
  return out
}

/** 모먼트별 여행 일차 (날짜가 바뀔 때마다 +1) */
export function dayNumbers(moments: FlowMoment[]): number[] {
  let n = 0
  let prev = ''
  return moments.map((m, i) => {
    const d = m.time?.split('·')[0].trim() || `m${i}`
    if (d !== prev) {
      n += 1
      prev = d
    }
    return n
  })
}
