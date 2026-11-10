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
]

/** 홈에서는 스택이 화면 아래쪽에 살짝 걸쳐 있고, 스택 화면에서는 위로 올라온다. */
export const HOME_OFFSET = 508
export const STACK_OFFSET = 43

export function stackGeo(index: number, offset: number): Geo {
  const t = TABLE[Math.min(index, TABLE.length - 1)]
  return { top: t.top + offset, h: t.h, dir: t.dir }
}

/** 선택된 앨범 커버 영역 (Figma main 프레임) */
export const COVER = { x: 35, y: 270, w: 296, h: 282 }

const GAP_ABOVE = 6
const GAP_BELOW = 12
const FIRST_GAP_ABOVE = 24
const FIRST_OVERLAP_BELOW = 15

/**
 * 앨범을 선택했을 때의 배치. 스택이 선택한 앨범을 기준으로 위아래가 뒤집힌다:
 * 스택에서 위에 있던 앨범은 커버 아래로, 아래에 있던 앨범은 커버 위로 간다.
 */
export function coverGeo(selected: number): Geo[] {
  const out: Geo[] = TABLE.map(() => ({ top: 0, h: 0, dir: 'down' as Dir }))
  out[selected] = { top: COVER.y, h: COVER.h, dir: 'down' }

  // 스택에서 아래에 있던 앨범(index > selected) → 커버 위쪽, 가까운 것부터
  let bottom = COVER.y - FIRST_GAP_ABOVE
  for (let i = selected + 1; i < TABLE.length; i++) {
    const { h } = TABLE[i]
    const top = bottom - slabHeight(h)
    out[i] = { top, h, dir: 'down', hidden: bottom < 30 }
    bottom = top - GAP_ABOVE
  }

  // 스택에서 위에 있던 앨범(index < selected) → 커버 아래쪽, 가까운 것부터
  let top = COVER.y + COVER.h - FIRST_OVERLAP_BELOW
  for (let i = selected - 1; i >= 0; i--) {
    const { h } = TABLE[i]
    out[i] = { top, h, dir: 'up', hidden: i === 0 || top > 760 }
    top = top + slabHeight(h) + GAP_BELOW
  }
  return out
}
