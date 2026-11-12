/**
 * LP 음악 재생.
 *  - moment.audio 파일이 있으면 그 파일을 재생한다 (public/audio/*.mp3 등).
 *  - 없으면 임시로 WebAudio 로 만든 잔잔한 반복 멜로디를 들려준다 (moment 마다 다른 곡조).
 * 반드시 사용자 제스처(탭/드래그 끝) 안에서 start 를 불러야 소리가 난다.
 */

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
export function playMusic(opts: { src?: string; seed: number; start?: number }): () => void {
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
    void el.play().catch(() => {})
    return () => {
      el.pause()
      el.src = ''
    }
  }
  return synth(opts.seed)
}
