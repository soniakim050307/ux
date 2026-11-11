/** Blue Vinyl 로고 — 피그마의 로고 시트에서 잘라낸 이미지를 그대로 쓴다. */
const base = import.meta.env.BASE_URL

/** 앱 아이콘 (둥근 모서리 포함) */
export function BlueVinylIcon({ size = 120 }: { size?: number; tone?: 'light' | 'dark'; rounded?: boolean }) {
  return <img src={`${base}img/bv-icon.png`} width={size} height={size} alt="Blue Vinyl" draggable={false} style={{ display: 'block' }} />
}

/** LP 심볼 (원판) */
export function BlueVinylDisc({ size = 100 }: { size?: number; color?: string; label?: string }) {
  return <img src={`${base}img/bv-disc.png`} height={size} alt="" draggable={false} style={{ display: 'block', height: size, width: 'auto' }} />
}

/** "Blue Vinyl" 글자 로고 */
export function BlueVinylWord({ height = 50 }: { height?: number }) {
  return <img src={`${base}img/bv-word.png`} alt="Blue Vinyl" draggable={false} style={{ display: 'block', height, width: 'auto' }} />
}
