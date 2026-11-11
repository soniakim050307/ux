import type { FlowMoment } from './data'

/** 하루 = 트랙 하나. 그날 기록한 moment 들이 한 트랙(노래) 안에 묶인다. */
export interface DayTrack {
  /** 1부터 시작하는 여행 일차 */
  n: number
  /** 'YYYY.MM.DD' (없으면 빈 문자열) */
  date: string
  /** album.moments 안에서의 순번들 */
  idxs: number[]
  /** 그날의 노래 (첫 moment 기준) */
  song: { title: string; artist: string }
}

const dateOf = (m: FlowMoment, i: number) => m.time?.split('·')[0].trim() || `moment-${i}`

export function buildDays(moments: FlowMoment[]): DayTrack[] {
  const days: DayTrack[] = []
  moments.forEach((m, i) => {
    const d = dateOf(m, i)
    const last = days[days.length - 1]
    if (last && last.date === (d.startsWith('moment-') ? '' : d) && last.date !== '') {
      last.idxs.push(i)
      return
    }
    days.push({
      n: days.length + 1,
      date: d.startsWith('moment-') ? '' : d,
      idxs: [i],
      song: { title: m.song?.title ?? 'Music', artist: m.song?.artist ?? '' },
    })
  })
  return days
}
