/**
 * 측면에서 본 톤암 (피그마 Section 3 디자인: 연한 회색, 둥근 모서리).
 * 좌표는 바늘 끝이 (0,0) 이고 위쪽이 -y 이다.
 */
export const TONE = { top: '#d9d9d9', front: '#a9a9a9', side: '#7c7c7c', arm: '#d9d9d9', armShade: '#959595', needle: '#d6554a' }

/** 헤드 오른쪽에서 멀리(화면 밖) 뻗는 둥근 암 */
export function ArmRod({ x1 = 30, y1 = -70, x2 = 330, y2 = -52 }: { x1?: number; y1?: number; x2?: number; y2?: number }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={TONE.armShade} strokeWidth="16" strokeLinecap="round" />
      <line x1={x1} y1={y1 - 2} x2={x2} y2={y2 - 2} stroke={TONE.arm} strokeWidth="13" strokeLinecap="round" />
    </g>
  )
}

/** 둥근 모서리의 입체 헤드: 윗면·앞면·옆면 + 암과 이어지는 목 + 붉은 바늘 */
export function Head() {
  const r = (fill: string, d: string) => <path d={d} fill={fill} stroke={fill} strokeWidth="7" strokeLinejoin="round" />
  return (
    <g>
      <path d="M -3 -26 L 0 0 L 2 -26 Z" fill={TONE.needle} stroke={TONE.needle} strokeWidth="2.5" strokeLinejoin="round" />
      {r(TONE.side, 'M -42 -58 L -34 -68 L -34 -34 L -42 -28 Z')}
      {r(TONE.front, 'M -38 -62 L 14 -62 L 14 -28 L -38 -28 Z')}
      {r(TONE.top, 'M -36 -72 L 22 -70 L 14 -60 L -38 -62 Z')}
      {r(TONE.front, 'M 16 -66 L 36 -66 L 36 -52 L 16 -52 Z')}
    </g>
  )
}
