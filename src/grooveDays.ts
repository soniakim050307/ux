import type { FlowMoment } from './data'

/* 판의 규칙 (모든 화면 공통)
   - 홈 하나 = 하루. 가장 바깥 홈이 첫째 날이고 안쪽으로 갈수록 날이 지남
   - 같은 날의 moment는 같은 홈 위에 꽂힘
   - 홈 위의 각도 = 하루 중 시각. 보이는 오른쪽 호에서 위가 아침, 아래로 갈수록 밤 */

const pad = (n: number) => String(n).padStart(2, '0')

export const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

/** 'YYYY.MM.DD · HH:MM' → 'YYYY.MM.DD' (없으면 오늘) */
export const dayOf = (m: FlowMoment) => (m.time && /^\d{4}\.\d{2}\.\d{2}/.test(m.time) ? m.time.slice(0, 10) : todayKey())

/** 기록이 있는 날들 (+ 오늘), 오래된 날부터 */
export const tripDays = (moments: FlowMoment[], withToday = false) =>
  Array.from(new Set([...moments.map(dayOf), ...(withToday ? [todayKey()] : [])])).sort()

/** 하루 중 시각 → 0(아침 6시) ~ 1(자정) */
export const dayTime = (m: FlowMoment) => {
  const hm = m.time?.match(/(\d{1,2}):(\d{2})/)
  const min = hm ? +hm[1] * 60 + +hm[2] : 12 * 60
  return Math.min(1, Math.max(0, (min - 6 * 60) / (18 * 60)))
}
