/**
 * 앨범 슬랩 배치. 좌표는 Figma 프레임(368 × 799) 기준 px.
 * 슬랩 = 옆면(spine, 12px 라벨) + 커버 면(cover, 높이 h).
 *  - 'down': 라벨이 위, 면이 아래 (눈높이보다 위에 있는 앨범)
 *  - 'up'  : 면이 위, 라벨이 아래 (눈높이보다 아래에 있는 앨범)
 */
export type Dir = 'down' | 'up'

export interface Geo {
  top: number
  h: number
  dir: Dir
  hidden?: boolean
}

/** 화면의 실제 높이(디자인 px). Figma 는 799 기준이고, 더 짧거나 긴 화면에서는 슬랩 간격을 이 비율로 다시 배치한다. */
let VIEW_H = 799
export const setViewH = (h: number) => {
  VIEW_H = Math.max(560, Math.min(1000, h))
}
const vf = () => VIEW_H / 799

export const SPINE_H = 12
export const SLAB_X = 33
export const SLAB_W = 302
export const slabHeight = (h: number) => h + SPINE_H - 1

/** 스택 화면(= 홈 화면 스택)의 슬랩 기본 배치. 0번은 "Add New Album", 1~8번은 최신 → 오래된 순. */
const TABLE: { top: number; h: number; dir: Dir }[] = [
  { top: 6, h: 71, dir: 'down' },
  { top: 95, h: 67, dir: 'down' },
  { top: 177, h: 44, dir: 'down' },
  { top: 259, h: 15, dir: 'down' },
  { top: 332, h: 10, dir: 'up' },
  { top: 385, h: 37, dir: 'up' },
  { top: 443, h: 61, dir: 'up' },
  { top: 516, h: 68, dir: 'up' },
  { top: 596, h: 69, dir: 'up' },
  { top: 676, h: 58, dir: 'up' },
]

/** 홈에서는 스택이 화면 아래쪽에 살짝 걸쳐 있고, 스택 화면에서는 위로 올라온다. */
export const HOME_OFFSET = 508
export const STACK_OFFSET = 43

export function stackGeo(index: number, offset: number): Geo {
  const t = TABLE[Math.min(index, TABLE.length - 1)]
  const f = vf()
  return { top: (t.top + offset) * f, h: Math.max(8, Math.round(t.h * f)), dir: t.dir }
}

/** 선택된 앨범 커버 크기 (Figma). 위치는 선택한 슬랩 자리에서 정해진다. */
export const COVER = { x: 35, w: 208, h: 201 }
/** 커버 아래 제목 영역 */
const TITLE_H = 58
const GAP = 10
const MIN_TOP = 70

/** 선택한 슬랩의 중앙에 커버가 서도록 한 커버의 top */
export function coverTop(selected: number, offset = STACK_OFFSET): number {
  const g = stackGeo(selected, offset)
  const mid = g.top + slabHeight(g.h) / 2
  const maxTop = VIEW_H - COVER.h - TITLE_H - 24
  return Math.max(MIN_TOP, Math.min(maxTop, mid - COVER.h / 2))
}

/**
 * 앨범을 선택했을 때의 배치. 제자리에서 커버가 서고, 위쪽 앨범은 위로 / 아래쪽 앨범은 아래로 살짝 밀린다.
 */
export function coverGeo(selected: number, count: number, offset = STACK_OFFSET): Geo[] {
  const base = Array.from({ length: count }, (_, i) => stackGeo(i, offset))
  const s = base[selected]
  const top = coverTop(selected, offset)
  const upNeed = Math.max(0, s.top - top) + GAP
  const downNeed = Math.max(0, top + COVER.h + TITLE_H - (s.top + slabHeight(s.h))) + GAP
  return base.map((g, i) => {
    if (i === selected) return { top, h: COVER.h, dir: 'down' as Dir }
    const t = i < selected ? g.top - upNeed : g.top + downNeed
    return { ...g, top: t, hidden: t + slabHeight(g.h) < 0 || t > VIEW_H }
  })
}
