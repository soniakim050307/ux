import { useEffect, useRef, useState } from 'react'

/** 근처 사람이 공유한 LP (실제 공유 기능 전까지는 예시) */
const SHARED = [
  { city: 'Ttukseom, Seoul', owner: 'minji', date: '2026.10', dist: '240m', img: 'img/jeju-3.jpg', moments: 3 },
  { city: 'Seongsu-dong, Seoul', owner: 'jun', date: '2026.09', dist: '1.1km', img: 'img/lisbon-2.jpg', moments: 2 },
  { city: 'Bukchon, Seoul', owner: 'yeon', date: '2026.08', dist: '3.4km', img: 'img/kyoto-1.jpg', moments: 4 },
]
const url = (p: string) => `${import.meta.env.BASE_URL}${p}`

interface Props {
  /** 홈(턴테이블) 화면일 때만 날아다님 */
  active: boolean
  w: number
  h: number
}

/** 종이비행기: 가끔 화면을 가로질러 날아가고, 지나가는 동안 잡으면(탭) 근처 사람이 공유한 LP가 펼쳐진다. 놓치면 그냥 지나감 */
export default function PaperPlane({ active, w, h }: Props) {
  const planeRef = useRef<HTMLButtonElement>(null)
  const anim = useRef<Animation | null>(null)
  const timer = useRef(0)
  const [flying, setFlying] = useState(false)
  const [caught, setCaught] = useState<{ x: number; y: number; i: number } | null>(null)
  const idx = useRef(-1)

  const schedule = (ms: number) => {
    clearTimeout(timer.current)
    timer.current = window.setTimeout(fly, ms)
  }
  const fly = () => {
    const el = planeRef.current
    if (!el) return
    const ltr = Math.random() < 0.5
    const y0 = 150 + Math.random() * 110
    const rise = 60 + Math.random() * 70
    // 진행 방향(왼→오 기준)의 각 구간 기울기에 맞춰 비행기 코를 돌린다.
    // plane.png 는 코가 오른쪽 위 41° 를 향하므로, 진행 각도 + 41° 만큼 돌리면 코가 진행 방향을 가리킴
    const xs = [-90, w * 0.25, w * 0.6, w + 30]
    const ys = [y0, y0 - rise * 0.45, y0 - rise * 0.55, y0 - rise]
    const heading = (i: number) => {
      const a = Math.max(0, i - 1)
      const c = Math.min(3, i + 1)
      return (Math.atan2(ys[c] - ys[a], xs[c] - xs[a]) * 180) / Math.PI
    }
    const NOSE = 41
    const wob = [3, -3, 2, -2]
    const X = ltr ? xs : xs.map((x) => w - x)
    const f = ltr ? '' : ' scaleX(-1)'
    setFlying(true)
    anim.current = el.animate(
      [0, 1, 2, 3].map((i) => ({
        transform: `translate(${X[i]}px,${ys[i]}px)${f} rotate(${(heading(i) + NOSE + wob[i]).toFixed(1)}deg)`,
        offset: i / 3,
      })),
      { duration: 7200, easing: 'linear' },
    )
    anim.current.onfinish = () => {
      anim.current = null
      setFlying(false)
      schedule(9000 + Math.random() * 7000)
    }
  }

  useEffect(() => {
    if (active && !caught) schedule(1500)
    else {
      clearTimeout(timer.current)
      anim.current?.cancel()
      anim.current = null
      setFlying(false)
    }
    return () => clearTimeout(timer.current)
  }, [active, caught])

  const catchIt = () => {
    const el = planeRef.current
    if (!el || !anim.current) return
    anim.current.pause()
    const box = el.getBoundingClientRect()
    const parent = el.parentElement!.getBoundingClientRect()
    const s = parent.width / w
    idx.current = (idx.current + 1) % SHARED.length
    setCaught({ x: (box.left - parent.left + box.width / 2) / s, y: (box.top - parent.top + box.height / 2) / s, i: idx.current })
    anim.current.cancel()
    anim.current = null
    setFlying(false)
    if (navigator.vibrate) navigator.vibrate(8)
  }

  const sh = caught ? SHARED[caught.i] : null
  return (
    <>
      <button
        type="button"
        ref={planeRef}
        className={`pp-plane ${flying ? 'on' : ''}`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={catchIt}
        aria-label="Catch the paper airplane"
      >
        <img src={url('img/plane.png')} alt="" draggable={false} />
      </button>

      {caught && sh && (
        <div className="pp-ov" style={{ height: h }} onPointerDown={(e) => e.stopPropagation()}>
          {/* 1. 잡은 자리에서 가운데로 날아옴 → 2. 펼쳐지며 종이(카드)가 됨 */}
          <img
            className="pp-fly"
            src={url('img/plane.png')}
            alt=""
            style={{ '--sx': `${caught.x - w / 2}px`, '--sy': `${caught.y - h * 0.42}px` } as React.CSSProperties}
          />
          <div className="pp-card" style={{ top: h * 0.42 - 150 }}>
            <div className="pp-cover" style={{ backgroundImage: `url(${url(sh.img)})` }} />
            <div className="pp-vinyl">
              <i style={{ backgroundImage: `url(${url(sh.img)})` }} />
            </div>
          </div>
          <div className="pp-cap" style={{ top: h * 0.42 + 120 }}>
            <small>A PAPER AIRPLANE FROM SOMEONE NEARBY</small>
            <b>{sh.city}</b>
            <span>
              @{sh.owner} · {sh.date} · {sh.moments} moments · {sh.dist} away
            </span>
          </div>
          <button type="button" className="pp-go" onClick={() => setCaught(null)}>
            Let it fly on
          </button>
        </div>
      )}
    </>
  )
}
