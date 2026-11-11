import { useEffect, useRef, useState } from 'react'
import type { FlowMoment } from '../data'
import { useDesignScale } from '../useDesignScale'
import Review from './Review'
import Engrave from './Engrave'

const W = 393
const H = 852
const MAX_S = 15
const RING_R = 149 // 원형 뷰파인더를 감싸는 흰 진행 링
const RING_LEN = 2 * Math.PI * RING_R
/** 지금 듣고 있는 노래 (실제 연동 전까지는 최근 재생곡으로 대신) */
const NOW_PLAYING = { title: 'Paris in the rain', artist: 'Lauv' }
const SAMPLE_CLIP = `${import.meta.env.BASE_URL}video/jeju-1.mp4`

interface Props {
  title: string
  index: number
  onClose: () => void
  onDone: (m: FlowMoment) => void
}

/** 지금 이 순간을 최대 15초 영상으로 기록 (blue-vinyl 녹화 화면: 원형 뷰파인더 + 흰 진행 링 + 지금 듣는 노래) */
export default function Capture({ title, index, onClose, onDone }: Props) {
  const { ref, k } = useDesignScale<HTMLDivElement>(W)
  const cam = true
  const mic = true
  const [sec, setSec] = useState(0)
  const [clip, setClip] = useState<string | null>(null) // 카메라가 없을 때 고른 영상
  const fileRef = useRef<HTMLInputElement | null>(null)
  const tick = useRef(0)
  const [facing, setFacing] = useState<'environment' | 'user'>('environment') // 후면 / 전면
  const [rec, setRec] = useState(false)
  const [err, setErr] = useState('')
  const [shot, setShot] = useState(0)
  const [stage, setStage] = useState<'cap' | 'review' | 'engrave'>('cap')
  const [taken, setTaken] = useState<{ m: FlowMoment; dur: number; peaks: number[] } | null>(null)
  const startAt = useRef(0)
  const stream = useRef<MediaStream | null>(null)
  const video = useRef<HTMLVideoElement | null>(null)
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const stopTimer = useRef<number>(0)
  const peaks = useRef<number[]>([])
  const analyser = useRef<{ node: AnalyserNode; ctx: AudioContext } | null>(null)

  // 카메라/마이크 켜기·끄기
  useEffect(() => {
    let dead = false
    setErr('')
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    analyser.current?.ctx.close().catch(() => {})
    analyser.current = null
    peaks.current = []
    if (!cam && !mic) return
    navigator.mediaDevices
      ?.getUserMedia({ video: cam ? { facingMode: facing } : false, audio: mic })
      .then((s) => {
        if (dead) return s.getTracks().forEach((t) => t.stop())
        stream.current = s
        if (video.current) {
          video.current.srcObject = s
          video.current.play().catch(() => {})
        }
        if (mic) {
          const ctx = new AudioContext()
          const node = ctx.createAnalyser()
          node.fftSize = 512
          ctx.createMediaStreamSource(s).connect(node)
          analyser.current = { node, ctx }
        }
      })
      .catch(() => !dead && setErr('카메라/마이크를 사용할 수 없어요. 브라우저 권한을 확인해 주세요.'))
    return () => {
      dead = true
    }
  }, [cam, mic, shot, facing])

  useEffect(
    () => () => {
      clearTimeout(stopTimer.current)
      stream.current?.getTracks().forEach((t) => t.stop())
      analyser.current?.ctx.close().catch(() => {})
    },
    [],
  )

  // 파형 그리기
  useEffect(() => {
    if (cam || !mic) return
    let raf = 0
    let last = 0
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw)
      const c = canvas.current
      if (!c) return
      const g = c.getContext('2d')!
      const a = analyser.current
      if (a && t - last > 70) {
        last = t
        const buf = new Uint8Array(a.node.fftSize)
        a.node.getByteTimeDomainData(buf)
        let m = 0
        for (const v of buf) m = Math.max(m, Math.abs(v - 128) / 128)
        peaks.current.push(m)
        if (peaks.current.length > 60) peaks.current.shift()
      }
      g.clearRect(0, 0, c.width, c.height)
      g.fillStyle = '#f3dfa0'
      const mid = c.height / 2
      g.fillRect(0, mid - 1, c.width, 2)
      peaks.current.forEach((p, i) => {
        const h = Math.max(4, p * c.height * 0.9)
        g.fillRect(8 + i * 6, mid - h / 2, 3, h)
      })
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [cam, mic])

  const finish = (url: string, kind: 'video' | 'audio') => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const dur = Math.max(1, (performance.now() - startAt.current) / 1000)
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    setTaken({
      dur,
      peaks: peaks.current.slice(),
      m: {
        id: `m-${now.getTime()}`,
        src: kind === 'video' ? url : '',
        kind,
        audio: kind === 'video' ? undefined : url,
        time: `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} · ${pad(now.getHours())}:${pad(now.getMinutes())}`,
        song: NOW_PLAYING,
      },
    })
    setStage('review')
  }
  const runClock = () => {
    setSec(0)
    clearInterval(tick.current)
    tick.current = window.setInterval(() => setSec((performance.now() - startAt.current) / 1000), 100)
  }
  const start = () => {
    const s = stream.current
    if (!s) {
      // 카메라를 못 쓰는 환경(미리보기 등): 고른 영상이나 예시 영상으로 녹화를 흉내 낸다
      startAt.current = performance.now()
      setRec(true)
      runClock()
      stopTimer.current = window.setTimeout(stop, MAX_S * 1000)
      return
    }
    const chunks: Blob[] = []
    const r = new MediaRecorder(s)
    recorder.current = r
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    r.onstop = () => {
      const blob = new Blob(chunks, { type: r.mimeType || 'video/webm' })
      finish(URL.createObjectURL(blob), 'video')
    }
    startAt.current = performance.now()
    r.start()
    setRec(true)
    runClock()
    stopTimer.current = window.setTimeout(stop, MAX_S * 1000)
  }
  const stop = () => {
    clearTimeout(stopTimer.current)
    clearInterval(tick.current)
    if (recorder.current?.state === 'recording') recorder.current.stop()
    else if (!stream.current) finish(clip || SAMPLE_CLIP, 'video')
    setRec(false)
  }

  const live = !err
  const prog = Math.min(1, sec / MAX_S)
  const mmss = (v: number) => `00:${String(Math.floor(v)).padStart(2, '0')}`

  if (stage === 'review' && taken)
    return (
      <Review
        moment={taken.m}
        dur={taken.dur}
        peaks={taken.peaks}
        title={title}
        index={index}
        onBack={onClose}
        onRetake={() => {
          setTaken(null)
          setStage('cap')
          setShot((n) => n + 1)
        }}
        onSave={(song, note) => {
          setTaken({ ...taken, m: { ...taken.m, song: song ?? taken.m.song, note: note ?? taken.m.note } })
          setStage('engrave')
        }}
      />
    )
  if (stage === 'engrave' && taken)
    return <Engrave city={title} label={`moment${index}`} onDone={() => onDone(taken.m)} />

  return (
    <div className="l-root cap bv" ref={ref}>
      <div className="design" style={{ width: W, height: H, transform: `scale(${k})` }}>
        <div className="cap-head">
          <b>{title}</b>
          <span>MOMENT {index}</span>
        </div>

        <div className="cap-np">
          <i className="cap-np-disc" />
          <span>
            <small>NOW PLAYING</small>
            {NOW_PLAYING.title} · {NOW_PLAYING.artist}
          </span>
        </div>

        <div className="cap-take">{rec ? `${mmss(sec)} / ${mmss(MAX_S)}` : 'TAKE A MOMENT'}</div>

        <div className="cap-circle">
          <video ref={video} muted playsInline className={`${live ? 'on' : ''} ${facing === 'user' ? 'mirror' : ''}`} />
          {!live && (
            <div className="cap-sim">
              {clip ? <video src={clip} muted playsInline autoPlay loop /> : <i className="cap-scene" />}
              {!rec && (
                <div className="cap-hint">
                  <b>▶</b>
                  <span>UP TO 15 SECONDS</span>
                  <em>Live camera works in the web app.{'\n'}Here it's simulated.</em>
                  <button type="button" className="cap-pick" onClick={() => fileRef.current?.click()}>
                    or choose a clip
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <svg className="cap-ring2" viewBox="-160 -160 320 320">
          <circle r={RING_R} className="cap-track" />
          <circle
            r={RING_R}
            className="cap-fill"
            transform="rotate(-90)"
            style={{ strokeDasharray: RING_LEN, strokeDashoffset: RING_LEN * (1 - prog), opacity: rec ? 1 : 0 }}
          />
          {rec && (
            <circle
              r={5}
              fill="#fff"
              cx={RING_R * Math.cos(prog * 2 * Math.PI - Math.PI / 2)}
              cy={RING_R * Math.sin(prog * 2 * Math.PI - Math.PI / 2)}
            />
          )}
        </svg>

        {!rec && <div className="cap-mode">VIDEO</div>}

        <button type="button" className={`cap-disc ${rec ? 'on' : ''}`} onClick={rec ? stop : start} aria-label={rec ? 'Stop' : 'Record'}>
          <i />
        </button>
        <div className="cap-disc-cap">RECORD LP</div>

        {/* 실제 카메라처럼: 왼쪽은 앨범에서 고르기, 오른쪽은 전면/후면 전환 */}
        {!rec && (
          <>
            <button type="button" className="cap-side cap-lib" onClick={() => fileRef.current?.click()} aria-label="Choose from library">
              {clip ? (
                <video src={clip} muted playsInline />
              ) : (
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round">
                  <rect x="3.5" y="5" width="17" height="14" rx="2" />
                  <path d="M3.5 16l5-5 4 4 3-3 5 5" />
                  <circle cx="15.5" cy="9" r="1.4" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className={`cap-side cap-flip ${facing === 'user' ? 'front' : ''}`}
              onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
              aria-label="Switch camera"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12a8 8 0 0113.7-5.6L20 8.5M20 4.5v4h-4" />
                <path d="M20 12a8 8 0 01-13.7 5.6L4 15.5M4 19.5v-4h4" />
              </svg>
            </button>
          </>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (!f) return
            const url = URL.createObjectURL(f)
            setClip(url)
            startAt.current = performance.now() - 1000
            finish(url, 'video') // 앨범에서 고른 영상은 바로 다음 화면으로
          }}
        />
      </div>

      <button type="button" className="l-back" onClick={onClose} aria-label="Back">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
