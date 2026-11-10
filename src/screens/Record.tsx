import { useEffect, useRef, useState } from 'react'
import type { MomentType } from '../types'
import {
  FLAT_BELOW,
  UPRIGHT_ABOVE,
  requestTiltPermission,
  useTilt,
} from '../tilt'

interface Props {
  title: string
  momentNo: number
  onBack: () => void
  onCaptured: (type: MomentType, blob: Blob) => void
}

const MODES: MomentType[] = ['photo', 'video', 'audio']

function pickMime(candidates: string[]): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  return candidates.find((c) => MediaRecorder.isTypeSupported(c))
}

export default function Record({ title, momentNo, onBack, onCaptured }: Props) {
  const [mode, setMode] = useState<MomentType>('video')
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState<{ mode: MomentType; msg: string } | null>(null)
  const [tiltOn, setTiltOn] = useState(false)
  const [tiltDenied, setTiltDenied] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const lastCamera = useRef<'photo' | 'video'>('video')

  const beta = useTilt(tiltOn)

  // Open the camera / microphone that matches the current mode.
  useEffect(() => {
    let cancelled = false
    let stream: MediaStream | null = null
    ;(async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('unsupported')
        }
        stream = await navigator.mediaDevices.getUserMedia(
          mode === 'audio'
            ? { audio: true }
            : { video: { facingMode: 'environment' }, audio: mode === 'video' },
        )
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const el = videoRef.current
        if (el) {
          el.srcObject = stream
          el.play().catch(() => {})
        }
      } catch {
        if (!cancelled) {
          setError({
            mode,
            msg: 'Camera or microphone is unavailable. Allow access in your browser (HTTPS is required).',
          })
        }
      }
    })()
    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [mode])

  // Tilt: lying flat → audio, held upright → camera.
  useEffect(() => {
    if (beta === null || recording) return
    if (beta < FLAT_BELOW && mode !== 'audio') setMode('audio')
    else if (beta > UPRIGHT_ABOVE && mode === 'audio') setMode(lastCamera.current)
  }, [beta, recording, mode])

  useEffect(() => {
    if (!recording) return
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [recording])

  // Leaving the screen must not deliver a half-finished recording.
  useEffect(
    () => () => {
      const rec = recRef.current
      if (rec) {
        rec.onstop = null
        if (rec.state !== 'inactive') rec.stop()
      }
    },
    [],
  )

  const chooseMode = (m: MomentType) => {
    if (recording) return
    if (m !== 'audio') lastCamera.current = m
    setMode(m)
  }

  const enableTilt = async () => {
    const ok = await requestTiltPermission()
    setTiltOn(ok)
    setTiltDenied(!ok)
  }

  const takePhoto = () => {
    const el = videoRef.current
    if (!el || !el.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = el.videoWidth
    canvas.height = el.videoHeight
    canvas.getContext('2d')?.drawImage(el, 0, 0)
    canvas.toBlob((blob) => blob && onCaptured('photo', blob), 'image/jpeg', 0.9)
  }

  const startRecording = () => {
    const stream = streamRef.current
    if (!stream || typeof MediaRecorder === 'undefined') {
      setError({ mode, msg: 'Recording is not supported in this browser.' })
      return
    }
    const type = mode
    const mime =
      type === 'video'
        ? pickMime(['video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4'])
        : pickMime(['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'])
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
    chunksRef.current = []
    rec.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data)
    }
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || mime })
      setRecording(false)
      setSeconds(0)
      onCaptured(type, blob)
    }
    rec.start()
    recRef.current = rec
    setSeconds(0)
    setRecording(true)
  }

  const onRecord = () => {
    if (mode === 'photo') return takePhoto()
    if (recording) recRef.current?.stop()
    else startRecording()
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  const shownError = error && error.mode === mode ? error.msg : null

  return (
    <div className="screen record">
      <header className="top">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Back">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1>{title}</h1>
        <p className="sub">MOMENT {momentNo}</p>
      </header>

      <p className="hint-top">TAKE A MOMENT</p>

      <div className="preview-area">
        <div className="side-disc left" />
        <div className="side-disc right" />
        <div className={`preview-circle ${mode}`}>
          {mode === 'audio' ? (
            <>
              <div className={`mini-vinyl big ${recording ? 'spin' : ''}`}>
                <span />
              </div>
              <div className={`wave big ${recording ? 'live' : ''}`} aria-hidden>
                {Array.from({ length: 13 }, (_, i) => (
                  <i key={i} style={{ animationDelay: `${i * 0.07}s` }} />
                ))}
              </div>
            </>
          ) : (
            <video ref={videoRef} playsInline muted autoPlay />
          )}
        </div>
      </div>

      {shownError && <p className="error">{shownError}</p>}

      <div className="mode-arc" role="tablist" aria-label="Capture mode">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className={`mode mode-${m} ${mode === m ? 'on' : ''}`}
            onClick={() => chooseMode(m)}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="record-bottom">
        <button
          type="button"
          className={`rec-btn ${recording ? 'live' : ''} ${mode === 'photo' ? 'shutter' : ''}`}
          onClick={onRecord}
          aria-label={mode === 'photo' ? 'Take photo' : recording ? 'Stop' : 'Record'}
        >
          <span />
        </button>
        <p className="rec-label">
          {mode === 'photo' ? 'TAKE PHOTO' : recording ? `STOP · ${mm}:${ss}` : 'RECORD LP'}
        </p>

        <button type="button" className="tilt-btn" onClick={enableTilt} disabled={tiltOn}>
          {tiltOn
            ? `Tilt on · flat = audio, upright = camera${beta !== null ? ` (${Math.round(beta)}°)` : ''}`
            : 'Enable tilt: lay flat to record audio'}
        </button>
        {tiltDenied && (
          <p className="error small">Tilt sensor is unavailable. Use the PHOTO / VIDEO / AUDIO labels instead.</p>
        )}
      </div>
    </div>
  )
}
