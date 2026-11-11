import { useEffect, useRef } from 'react'

/**
 * LP에 홈을 새기는 장면 (측면 뷰).
 * 피그마 Section 3 의 "Trip Detail – Edit" 프레임(413 × 898) 좌표를 그대로 쓰고,
 * 침(헤드)은 둥근 모서리의 입체 블록 + 둥근 암으로 다시 그렸다.
 * 침이 홈 끝을 따라 움직이고, 지나간 자리가 선으로 새겨진다.
 */

const W = 413
const H = 898
/** 홈 경로 (왼쪽 → 침 위치). 피그마 Vector 8·9 를 이은 곡선 */
const GROOVE = 'M 108 531 C 150 528 215 519 262 496'
/** 앞 모먼트에서 이미 새겨진 홈 */
const OLD_GROOVE = 'M -20 536 L 108 531'
const COLOR = { top: '#d9d9d9', front: '#a9a9a9', side: '#7c7c7c', arm: '#d9d9d9', armShade: '#959595' }

interface Props {
  city?: string
  label?: string
  /** 새기기가 끝나면 호출 */
  onDone?: () => void
  /** true 면 끝난 뒤 반복 (미리보기용) */
  loop?: boolean
}

export default function CarveScene({ city = 'Paris, France', label = 'moment1', onDone, loop }: Props) {
  const groove = useRef<SVGPathElement>(null)
  const arm = useRef<SVGGElement>(null)
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    const g = groove.current
    const a = arm.current
    if (!g || !a) return
    const L = g.getTotalLength()
    g.style.strokeDasharray = `${L}`
    let raf = 0
    let t0 = 0
    const DROP = 900
    const CUT = 3200
    const LIFT = 700
    const END = DROP + CUT + LIFT
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
    const place = (len: number, lift: number) => {
      const p = g.getPointAtLength(len)
      a.setAttribute('transform', `translate(${p.x.toFixed(2)} ${(p.y - lift).toFixed(2)})`)
    }
    const frame = (now: number) => {
      if (!t0) t0 = now
      const t = now - t0
      if (t < DROP) {
        const k = ease(t / DROP)
        g.style.strokeDashoffset = `${L}`
        place(0, 46 * (1 - k))
      } else if (t < DROP + CUT) {
        const k = ease((t - DROP) / CUT)
        g.style.strokeDashoffset = `${L * (1 - k)}`
        place(L * k, 0)
      } else if (t < END) {
        const k = ease((t - DROP - CUT) / LIFT)
        g.style.strokeDashoffset = '0'
        place(L, 30 * k)
      } else {
        g.style.strokeDashoffset = '0'
        place(L, 30)
        if (loop) {
          t0 = 0
        } else {
          done.current?.()
          return
        }
      }
      raf = requestAnimationFrame(frame)
    }
    place(0, 46)
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [loop])

  return (
    <div className="cv2">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="cv2-svg">
        <defs>
          <filter id="cv2-sh" x="-10%" y="-10%" width="120%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#10112a" floodOpacity="0.45" />
          </filter>
        </defs>
        {/* LP (옆에서 본 타원) */}
        <g filter="url(#cv2-sh)">
          <ellipse cx="21" cy="466" rx="378" ry="123.5" fill="#242327" />
        </g>
        <ellipse cx="20" cy="450" rx="130.8" ry="42.7" fill="#d9d9d9" />
        <ellipse cx="20.2" cy="455" rx="10" ry="3.2" fill="#000" />
        <path d={OLD_GROOVE} fill="none" stroke="#a89f90" strokeWidth="2.2" strokeLinecap="round" />
        {/* 새겨지는 홈 */}
        <path
          ref={groove}
          d={GROOVE}
          fill="none"
          stroke="#d8d0c2"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDashoffset="0"
        />
        {/* 침: 끝(바늘)이 홈의 끝점에 닿는다 */}
        <g ref={arm}>
          {/* 암 (먼 쪽 피벗을 향해 뻗음) */}
          <ArmRod />
          <Head />
        </g>
        <text x="382" y="613" textAnchor="end" className="cv2-city">
          {city}
        </text>
        <text x="382" y="652" textAnchor="end" className="cv2-sub">
          {label}
        </text>
      </svg>
    </div>
  )
}

/** 침 끝점(0,0) 기준: 헤드 오른쪽에서 화면 밖 피벗까지 이어지는 둥근 암 */
function ArmRod() {
  return (
    <g>
      <line x1="30" y1="-70" x2="330" y2="-52" stroke={COLOR.armShade} strokeWidth="16" strokeLinecap="round" />
      <line x1="30" y1="-72" x2="330" y2="-54" stroke={COLOR.arm} strokeWidth="13" strokeLinecap="round" />
    </g>
  )
}

/** 둥근 모서리의 입체 헤드: 윗면·앞면·옆면 + 붉은 바늘 */
function Head() {
  const r = (fill: string, d: string) => (
    <path d={d} fill={fill} stroke={fill} strokeWidth="7" strokeLinejoin="round" />
  )
  return (
    <g transform="translate(0 0)">
      {/* 바늘 */}
      <path d="M -3 -26 L 0 0 L 2 -26 Z" fill="#d6554a" stroke="#d6554a" strokeWidth="2.5" strokeLinejoin="round" />
      {/* 옆면 */}
      {r(COLOR.side, 'M -42 -58 L -34 -68 L -34 -34 L -42 -28 Z')}
      {/* 앞면 */}
      {r(COLOR.front, 'M -38 -62 L 14 -62 L 14 -28 L -38 -28 Z')}
      {/* 윗면 */}
      {r(COLOR.top, 'M -36 -72 L 22 -70 L 14 -60 L -38 -62 Z')}
      {/* 암과 이어지는 목 */}
      {r(COLOR.front, 'M 16 -66 L 36 -66 L 36 -52 L 16 -52 Z')}
    </g>
  )
}
