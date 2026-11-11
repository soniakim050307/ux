import type { CSSProperties } from 'react'

/**
 * 소포 디자인 (팀 웹 프로토타입 blue-vinyl 의 .parcel 을 이식)
 * 크래프트지 + 십자 끈 + 퍼포레이션 우표(커버 사진) + 소인 + to/from.
 * 모든 크기가 컨테이너 너비 기준(--u)이라 어떤 크기에서도 같은 비율로 보인다.
 */
export default function Parcel({
  city,
  date,
  cover,
  className = '',
}: {
  city: string
  date: string
  cover?: string
  className?: string
}) {
  const name = (city || 'Untitled Trip').split(',')[0]
  const stampBg: CSSProperties = cover
    ? { background: `url(${cover}) center / cover` }
    : { background: 'linear-gradient(160deg,#9db1e6,#d9b9a4)' }
  return (
    <span className={`pc-wrap ${className}`}>
      <span className="pc">
        <i className="pc-tw v" />
        <i className="pc-tw h" />
        <span className="pc-stamp">
          <span style={stampBg} />
        </span>
        <span className="pc-pm">
          <span>{name.toUpperCase()}</span>
          <b>{date}</b>
          <span>SEOUL</span>
        </span>
        <span className="pc-addr">
          to. me
          <br />
          from. {name}
        </span>
      </span>
    </span>
  )
}
