import { useEffect, useRef, useState } from 'react'
import type { FlowMoment } from '../data'
import { useDesignScale } from '../useDesignScale'
import Review from './Review'
import Engrave from './Engrave'

const W = 393
const H = 852
const MAX_S = 10
const RING_R = 91

interface Props {
  title: string
  index: number
  onClose: () => void
  onDone: (m: FlowMoment) => void
}

const CamIcon = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
    <circle cx="12" cy="13.5" r="3.2" />
    {off && <path d="M3 3l18 18" />}
  </svg>
)
const MicIcon = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0013 0M12 18v3" />
    {off && <path d="M3 3l18 18" />}
  </svg>
)

/** 지금 이 순간을 최대 10초 기록 — 카메라·마이크를 함께 또는 하나만 */
export default function Capture({ title, index, onClose, onDone }: Props) {
  const { ref, k } = useDesignScale<HTMLDivElement>(W)
  const [cam, setCam] = useState(true)
  const [mic, setMic] = useState(true)
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
      ?.getUserMedia({ video: cam ? { facingMode: 'environment' } : false, audio: mic })
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
  }, [cam, mic, shot])

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

  const start = () => {
    const s = stream.current
    if (!s) return
    const chunks: Blob[] = []
    const r = new MediaRecorder(s)
    recorder.current = r
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    r.onstop = () => {
      const blob = new Blob(chunks, { type: r.mimeType || (cam ? 'video/webm' : 'audio/webm') })
      const url = URL.createObjectURL(blob)
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
          src: cam ? url : '',
          kind: cam ? 'video' : 'audio',
          audio: cam ? undefined : url,
          time: `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} · ${pad(now.getHours())}:${pad(now.getMinutes())}`,
        },
      })
      setStage('review')
    }
    startAt.current = performance.now()
    r.start()
    setRec(true)
    stopTimer.current = window.setTimeout(stop, MAX_S * 1000)
  }
  const stop = () => {
    clearTimeout(stopTimer.current)
    if (recorder.current?.state === 'recording') recorder.current.stop()
    setRec(false)
  }

  const canRec = (cam || mic) && !err

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
        onSave={(song) => {
          setTaken({ ...taken, m: { ...taken.m, song } })
          setStage('engrave')
        }}
      />
    )
  if (stage === 'engrave' && taken)
    return <Engrave city={title} label={`moment${index}`} onDone={() => onDone(taken.m)} />

  return (
    <div className="l-root cap" ref={ref}>
      <div className="design" style={{ width: W, height: H, transform: `scale(${k})` }}>
        <div className="cap-head">
          <b>{title}</b>
          <span>MOMENT {index}</span>
        </div>

        {cam ? (
          <div className="cap-view">
            <video ref={video} muted playsInline />
            <i className="cap-mask" />
            <i className="cap-grid" />
          </div>
        ) : (
          <div className="cap-wave">
            <canvas ref={canvas} width={393} height={393} />
          </div>
        )}

        {err && <p className="cap-err">{err}</p>}

        <div className="cap-tools">
          <button type="button" disabled={rec} onClick={() => setCam((v) => !v)} aria-label="Camera">
            <CamIcon off={!cam} />
          </button>
          <button type="button" disabled={rec} onClick={() => setMic((v) => !v)} aria-label="Microphone">
            <MicIcon off={!mic} />
          </button>
        </div>

        <button type="button" className="cap-rec" disabled={!canRec} onClick={rec ? stop : start} aria-label={rec ? 'Stop' : 'Record'}>
          <svg viewBox="-100 -100 200 200" className="cap-ring">
            <circle r={RING_R} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="3" />
            {rec && <circle r={RING_R} className="cap-prog" pathLength={1} />}
          </svg>
          <i className={rec ? 'on' : ''} />
        </button>
      </div>

      <button type="button" className="l-back" onClick={onClose} aria-label="Back">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
