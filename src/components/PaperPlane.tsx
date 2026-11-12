import { useEffect, useRef, useState } from 'react'
import { FLOW_ALBUMS, type FlowAlbum } from '../data'

/** 근처 사람이 공유한 LP (실제 공유 기능 전까지는 예시) */
/** base: 영상·노래는 기존 예시 앨범의 것을 빌려 쓴다 */
const SHARED = [
  { city: 'Ttukseom, Seoul', owner: 'minji', date: '2026.10', dist: '240m', img: 'img/jeju-3.jpg', base: 'jeju' },
  { city: 'Seongsu-dong, Seoul', owner: 'jun', date: '2026.09', dist: '1.1km', img: 'img/lisbon-2.jpg', base: 'lisbon' },
  { city: 'Bukchon, Seoul', owner: 'yeon', date: '2026.08', dist: '3.4km', img: 'img/kyoto-1.jpg', base: 'kyoto' },
]
type Shared = (typeof SHARED)[number]

/** 공유받은 LP 를 앨범 형태로 만든다 (재생·목록 추가에 그대로 쓰임) */
function toAlbum(sh: Shared): FlowAlbum {
  const base = FLOW_ALBUMS.find((a) => a.id === sh.base)!
  return {
    ...base,
    id: `shared-${sh.owner}-${Date.now()}`,
    city: sh.city,
    date: sh.date,
    tone: '#8a8fae',
    cover: url(sh.img),
    sharedBy: sh.owner,
  }
}
const url = (p: string) => `${import.meta.env.BASE_URL}${p}`
const base = (sh: { base: string }) => FLOW_ALBUMS.find((a) => a.id === sh.base)!
/** 봉투 크기·위치 (디자인 좌표) */
const ENV = 236
const ENV_TOP = 178

interface Props {
  /** 홈(턴테이블) 화면일 때만 날아다님 */
  active: boolean
  w: number
  h: number
  /** Play now: 받은 LP 를 바로 재생 화면으로 */
  onPlay: (a: FlowAlbum) => void
  /** add to list: 내 앨범 목록(스택)에 꽂아 둔다 */
  onAdd: (a: FlowAlbum) => void
}

/** 종이비행기: 가끔 화면을 가로질러 날아가고, 지나가는 동안 잡으면(탭) 근처 사람이 공유한 LP가 펼쳐진다. 놓치면 그냥 지나감 */
export default function PaperPlane({ active, w, h, onPlay, onAdd }: Props) {
  const planeRef = useRef<HTMLButtonElement>(null)
  const anim = useRef<Animation | null>(null)
  const timer = useRef(0)
  const [flying, setFlying] = useState(false)
  const [caught, setCaught] = useState<{ x: number; y: number; i: number } | null>(null)
  const [leaving, setLeaving] = useState<'' | 'play' | 'add' | 'discard'>('')
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

  const [toast, setToast] = useState('')
  const leave = (k: 'play' | 'add' | 'discard') => {
    if (!caught || leaving) return
    const a = toAlbum(SHARED[caught.i])
    setLeaving(k)
    if (k === 'play') window.setTimeout(() => onPlay(a), 380)
    window.setTimeout(
      () => {
        if (k === 'add') {
          onAdd(a)
          setToast('Added to your records')
          window.setTimeout(() => setToast(''), 2200)
        }
        setCaught(null)
        setLeaving('')
      },
      k === 'play' ? 900 : 700,
    )
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
        <div
          className={`pp-ov ${leaving ? `out-${leaving}` : ''}`}
          style={{ height: h }}
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          {/* 1. 잡은 자리에서 가운데로 날아옴 → 2. 펼쳐지며 봉투가 됨 → 3. 봉투에서 LP가 올라옴 */}
          <img
            className="pp-fly"
            src={url('img/plane.png')}
            alt=""
            style={{ '--sx': `${caught.x - w / 2}px`, '--sy': `${caught.y - ENV_TOP - ENV / 2}px` } as React.CSSProperties}
          />
          <div className="pp-env" style={{ top: ENV_TOP, width: ENV, height: ENV, marginLeft: -ENV / 2 }}>
            {/* 접힌 종이: 왼쪽 반이 오른쪽 위로 접혀 있고, 위 두 모서리가 가운데로 접혀 있음 → 하나씩 펼쳐진다 */}
            <div className="pp-sheet">
              <div className="sh sh-rb" />
              <div className="sh sh-rf" />
              <div className="sh-l">
                <div className="sh sh-lb" />
                <div className="sh sh-lf" />
              </div>
            </div>
            <svg className="pp-fold" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <path d="M0 0L100 100M100 0L0 100" />
            </svg>
            <div className="pp-photo" style={{ backgroundImage: `url(${url(sh.img)})` }} />
            <div className="pp-vinyl">
              <i style={{ backgroundImage: `url(${url(sh.img)})` }} />
            </div>
          </div>
          <div className="pp-cap" style={{ top: ENV_TOP + ENV + 22 }}>
            <b>{sh.city}</b>
            <span>
              @{sh.owner} · {sh.date} · {base(sh).moments.length} moments · {sh.dist} away
            </span>
          </div>
          <div className="pp-acts" style={{ top: ENV_TOP + ENV + 98 }}>
            <button type="button" className="pp-btn play" onClick={() => leave('play')}>
              Play now
            </button>
            <button type="button" className="pp-btn add" onClick={() => leave('add')}>
              add to list
            </button>
            <button type="button" className="pp-btn discard" onClick={() => leave('discard')}>
              discard
            </button>
          </div>
        </div>
      )}
      {toast && <div className="pp-toast">{toast}</div>}
    </>
  )
}
