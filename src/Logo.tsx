/** Blue Vinyl 로고. 앱 아이콘(구름 + LP)과 LP 심볼(원판만) */

interface IconProps {
  size?: number
  /** 'light' 크림 배경 / 'dark' 연보라 배경 */
  tone?: 'light' | 'dark'
  rounded?: boolean
}

export function BlueVinylIcon({ size = 120, tone = 'light', rounded = true }: IconProps) {
  const dark = tone === 'dark'
  const bg = dark ? '#c6c7e0' : '#f2eee9'
  const disc = dark ? '#4f5a82' : '#747fa3'
  const cream = dark ? '#f4ebdc' : '#f2eee9'
  const id = `bvi-${tone}`
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label="Blue Vinyl" style={{ display: 'block' }}>
      <defs>
        <clipPath id={id}>
          <rect width="200" height="200" rx={rounded ? 46 : 0} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect width="200" height="200" fill={bg} />
        <circle cx="100" cy="88" r="77" fill={disc} />
        <g fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="0.9" strokeLinecap="round">
          <path d="M44 88 A56 56 0 0 1 100 32" />
          <path d="M56 88 A44 44 0 0 1 100 44" />
          <path d="M67 88 A33 33 0 0 1 100 55" />
          <path d="M133 88 A33 33 0 0 1 100 121" />
          <path d="M144 88 A44 44 0 0 1 100 132" />
          <path d="M155 88 A55 55 0 0 1 100 143" />
        </g>
        <circle cx="100" cy="88" r="24" fill={cream} />
        <circle cx="100" cy="88" r="3.6" fill={disc} />
        {/* 구름 */}
        <g fill={cream}>
          <circle cx="68" cy="148" r="36" />
          <circle cx="113" cy="146" r="22" />
          <circle cx="146" cy="151" r="18" />
          <rect x="0" y="146" width="200" height="60" />
        </g>
      </g>
    </svg>
  )
}

/** LP 원판만 (스플래시, 로고 락업) */
export function BlueVinylDisc({ size = 100, color = '#7378b0', label = '#f4efe6' }: { size?: number; color?: string; label?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden style={{ display: 'block' }}>
      <circle cx="50" cy="50" r="49" fill={color} />
      <g fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="0.7" strokeLinecap="round">
        <path d="M17 50 A33 33 0 0 1 50 17" />
        <path d="M26 50 A24 24 0 0 1 50 26" />
        <path d="M34 50 A16 16 0 0 1 50 34" />
        <path d="M66 50 A16 16 0 0 1 50 66" />
        <path d="M74 50 A24 24 0 0 1 50 74" />
        <path d="M83 50 A33 33 0 0 1 50 83" />
      </g>
      <circle cx="50" cy="50" r="15" fill={label} />
      <circle cx="50" cy="50" r="2.2" fill={color} />
    </svg>
  )
}
