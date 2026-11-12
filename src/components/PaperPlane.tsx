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
    const X = ltr ? [-90, w * 0.25, w * 0.6, w + 30] : [w + 30, w * 0.6, w * 0.25, -90]
    const f = ltr ? '' : ' scaleX(-1)'
    setFlying(true)
    anim.current = el.animate(
      [
        { transform: `translate(${X[0]}px,${y0}px)${f} rotate(4deg)` },
        { transform: `translate(${X[1]}px,${y0 - rise * 0.45}px)${f} rotate(-8deg)`, offset: 0.33 },
        { transform: `translate(${X[2]}px,${y0 - rise * 0.55}px)${f} rotate(2deg)`, offset: 0.66 },
        { transform: `translate(${X[3]}px,${y0 - rise}px)${f} rotate(-10deg)` },
      ],
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
