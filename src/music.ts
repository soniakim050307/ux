/**
 * LP 음악 재생.
 *  - moment.audio 파일이 있으면 그 파일을 재생한다 (public/audio/*.mp3 등).
 *  - 없으면 임시로 WebAudio 로 만든 잔잔한 반복 멜로디를 들려준다 (moment 마다 다른 곡조).
 * 반드시 사용자 제스처(탭/드래그 끝) 안에서 start 를 불러야 소리가 난다.
 */

import { findPreview } from './preview'

let ctx: AudioContext | null = null

function audioCtx(): AudioContext | null {
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

// 곡마다 (근음 MIDI, 코드 진행) 이 다르다
const TUNES = [
  { root: 57, prog: [0, 5, 3, 7] }, // A
  { root: 60, prog: [0, 7, 9, 5] }, // C
  { root: 55, prog: [0, 3, 8, 7] }, // G
]
const MAJOR = [0, 2, 4, 7, 9, 12, 14]
const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

function synth(seed: number): () => void {
  const c = audioCtx()
  if (!c) return () => {}
  const tune = TUNES[seed % TUNES.length]
  const master = c.createGain()
  master.gain.setValueAtTime(0, c.currentTime)
  master.gain.linearRampToValueAtTime(0.16, c.currentTime + 0.6)
  master.connect(c.destination)

  const note = (midi: number, when: number, dur: number, type: OscillatorType, vol: number) => {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.value = hz(midi)
    g.gain.setValueAtTime(0, when)
    g.gain.linearRampToValueAtTime(vol, when + 0.03)
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur)
    o.connect(g).connect(master)
    o.start(when)
    o.stop(when + dur + 0.05)
  }

  let step = 0
  const tick = () => {
    const t = c.currentTime + 0.05
    const chord = tune.prog[Math.floor(step / 8) % tune.prog.length]
    if (step % 8 === 0) {
      ;[0, 4, 7].forEach((iv) => note(tune.root - 12 + chord + iv, t, 3.6, 'sine', 0.35))
    }
    if (step % 2 === 0 || Math.random() < 0.4) {
      const deg = MAJOR[(step * 3 + Math.floor(Math.random() * 3)) % MAJOR.length]
      note(tune.root + 12 + chord + deg, t, 1.4, 'triangle', 0.4)
    }
    step++
  }
  tick()
  const timer = window.setInterval(tick, 420)

  return () => {
    clearInterval(timer)
    const t = c.currentTime
    master.gain.cancelScheduledValues(t)
    master.gain.setValueAtTime(master.gain.value, t)
    master.gain.linearRampToValueAtTime(0, t + 0.25)
    window.setTimeout(() => master.disconnect(), 400)
  }
}

/** 재생을 시작하고, 멈추는 함수를 돌려준다. */
export function playMusic(opts: { src?: string; seed: number; start?: number; fadeIn?: number }): () => void {
  if (opts.src) {
    const el = new Audio(opts.src)
    el.loop = true
    const start = opts.start ?? 0
    if (start > 0) {
      el.addEventListener('loadedmetadata', () => {
        // 파일이 짧아졌으므로 시작 지점은 길이 안으로 접어 넣는다
        const d = el.duration
        el.currentTime = isFinite(d) && d > 0 ? start % d : 0
      })
    }
    // 서서히 커지게: 볼륨을 0에서 1까지 fadeIn 초 동안 올린다
    let fade = 0
    if (opts.fadeIn && opts.fadeIn > 0) {
      el.volume = 0
      const t0 = performance.now()
      fade = window.setInterval(() => {
        const x = Math.min(1, (performance.now() - t0) / (opts.fadeIn! * 1000))
        el.volume = x * x // 처음엔 아주 천천히
        if (x >= 1) clearInterval(fade)
      }, 60)
    }
    void el.play().catch(() => {})
    return () => {
      clearInterval(fade)
      el.pause()
      el.src = ''
    }
  }
  return synth(opts.seed)
}

/* ───────── 30초 믹스: 노래 미리듣기 + 현장음 ─────────
 * 0–20초   노래가 서서히 커지고, 현장음이 아주 작게 깔린다
 * 20–27초  현장음이 커지면서 노래는 줄어든다 (노래 → 현장음으로 넘어가는 이음새)
 * 27–32초  노래는 사라지고 현장음도 천천히 꺼진다
 * 현장음은 촬영한 영상의 소리가 있으면 그것을, 없으면 임시로 만든 잔잔한 바람소리를 쓴다. */
const MIX_LEN = 32

function ambience(): { gain: (v: number) => void; stop: () => void } | null {
  const c = audioCtx()
  if (!c) return null
  const len = c.sampleRate * 4
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1
    b0 = 0.99765 * b0 + w * 0.099046
    b1 = 0.963 * b1 + w * 0.2965164
    b2 = 0.57 * b2 + w * 1.0526913
    d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18
  }
  const src = c.createBufferSource()
  src.buffer = buf
  src.loop = true
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 900
  const lfo = c.createOscillator() // 파도처럼 천천히 일렁이게
  const lfoG = c.createGain()
  lfo.frequency.value = 0.13
  lfoG.gain.value = 350
  lfo.connect(lfoG).connect(lp.frequency)
  const g = c.createGain()
  g.gain.value = 0
  src.connect(lp).connect(g).connect(c.destination)
  src.start()
  lfo.start()
  return {
    gain: (v) => g.gain.setTargetAtTime(v, c.currentTime, 0.4),
    stop: () => {
      g.gain.setTargetAtTime(0, c.currentTime, 0.1)
      window.setTimeout(() => {
        try {
          src.stop()
          lfo.stop()
          g.disconnect()
        } catch {
          /* already stopped */
        }
      }, 400)
    },
  }
}

export function playMix(opts: { previewUrl?: string; field?: string }): () => void {
  const song = new Audio(opts.previewUrl ?? '')
  song.volume = 0
  let fieldEl: HTMLAudioElement | null = null
  let amb: ReturnType<typeof ambience> = null
  if (opts.field) {
    fieldEl = new Audio(opts.field)
    fieldEl.loop = true
    fieldEl.volume = 0
    void fieldEl.play().catch(() => {})
  } else amb = ambience()
  if (opts.previewUrl) void song.play().catch(() => {})
  const clamp = (x: number) => Math.max(0, Math.min(1, x))
  const ramp = (t: number, a: number, b: number) => clamp((t - a) / (b - a))
  const t0 = performance.now()
  const id = window.setInterval(() => {
    const t = (performance.now() - t0) / 1000
    const sIn = ramp(t, 0, 1.6)
    const duck = 1 - 0.7 * ramp(t, 20, 24) // 현장음이 올라오면 노래를 낮춘다
    const sOut = 1 - ramp(t, 26, 30)
    song.volume = clamp(sIn * duck * sOut)
    const bed = 0.1 + 0.45 * ramp(t, 20, 25) // 처음엔 아주 작게, 이음새에서 커진다
    const fOut = 1 - ramp(t, 28, MIX_LEN)
    const f = clamp(bed * fOut * ramp(t, 0.5, 3))
    if (fieldEl) fieldEl.volume = f
    amb?.gain(f * 0.9)
    if (t >= MIX_LEN) clearInterval(id)
  }, 60)
  return () => {
    clearInterval(id)
    song.pause()
    song.src = ''
    if (fieldEl) {
      fieldEl.pause()
      fieldEl.src = ''
    }
    amb?.stop()
  }
}

/** 모먼트의 노래 제목에 맞는 30초 미리듣기를 믹스로 튼다. 못 찾으면 다른 노래 대신 현장음만. 멈추는 함수를 돌려준다. */
export function playForMoment(m: { song?: { title: string; artist: string }; kind?: string; src: string } | undefined, fadeFieldOnly = false): () => void {
  let stop: (() => void) | undefined
  let dead = false
  const recorded = m?.kind === 'video' && m.src.startsWith('blob:') ? m.src : undefined
  void (m?.song ? findPreview(m.song.title, m.song.artist) : Promise.resolve(null)).then((pv) => {
    if (dead) return
    stop = playMix({ previewUrl: fadeFieldOnly ? undefined : pv?.url, field: recorded })
  })
  return () => {
    dead = true
    stop?.()
  }
}
