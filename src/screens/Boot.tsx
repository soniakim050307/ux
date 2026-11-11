import { useEffect, useState } from 'react'
import { BlueVinylDisc, BlueVinylIcon } from '../Logo'

/** 가짜 홈 화면 아이콘 (실제 앱 아이콘 대신 단순한 자체 도형) */
const APPS: { name: string; c: string; g: string }[] = [
  { name: '메시지', c: '#6fcf7f', g: '✉' },
  { name: '캘린더', c: '#f4f1ec', g: '11' },
  { name: '사진', c: '#f1d9a6', g: '❀' },
  { name: '카메라', c: '#9aa0a8', g: '◉' },
  { name: '지도', c: '#8fc7a0', g: '➤' },
  { name: '날씨', c: '#7fb4e8', g: '☀' },
  { name: '시계', c: '#2b2b30', g: '◷' },
  { name: '메모', c: '#f2cf6b', g: '≡' },
  { name: '음악', c: '#e98aa0', g: '♪' },
  { name: '책', c: '#f0a45f', g: '❡' },
  { name: '설정', c: '#a7a9b0', g: '⚙' },
  { name: '파일', c: '#79a6e6', g: '▤' },
]
const DOCK = [
  { c: '#6fcf7f', g: '✆' },
  { c: '#6fa8e8', g: '◎' },
  { c: '#f4f1ec', g: '✉' },
  { c: '#e98aa0', g: '♪' },
]

type Stage = 'home' | 'opening' | 'splash' | 'done'

export default function Boot({ children }: { children: React.ReactNode }) {
  const skip = typeof location !== 'undefined' && new URLSearchParams(location.search).get('boot') === '0'
  const [stage, setStage] = useState<Stage>(skip ? 'done' : 'home')

  useEffect(() => {
    if (stage === 'opening') {
      const t = setTimeout(() => setStage('splash'), 520)
      return () => clearTimeout(t)
    }
    if (stage === 'splash') {
      const t = setTimeout(() => setStage('done'), 4300)
      return () => clearTimeout(t)
    }
  }, [stage])

  return (
    <>
      {stage === 'done' && children}
      {stage !== 'done' && (
        <div className={`bt bt-${stage}`}>
          {stage === 'splash' ? (
            <div className="bt-splash">
              <div className="bt-lock">
                <div className="bt-disc">
                  <BlueVinylDisc size={86} color="#7378b0" label="#f4efe6" />
                </div>
                <div className="bt-word">
                  <span>Blue Vinyl</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bt-home">
              <div className="bt-wall" />
              <div className="bt-status">
                <b>9:41</b>
                <span className="bt-sig">
                  <i /><i /><i /><i />
                  <em />
                </span>
              </div>
              <div className="bt-grid">
                {APPS.slice(0, 8).map((a) => (
                  <div className="bt-app" key={a.name}>
                    <div className="bt-ic" style={{ background: a.c }}>{a.g}</div>
                    <span>{a.name}</span>
                  </div>
                ))}
                <button className="bt-app bt-bv" onClick={() => stage === 'home' && setStage('opening')} aria-label="Blue Vinyl 열기">
                  <div className="bt-ic bt-ic-bv"><BlueVinylIcon size={60} /></div>
                  <span>Blue Vinyl</span>
                </button>
                {APPS.slice(8).map((a) => (
                  <div className="bt-app" key={a.name}>
                    <div className="bt-ic" style={{ background: a.c }}>{a.g}</div>
                    <span>{a.name}</span>
                  </div>
                ))}
              </div>
              <div className="bt-dots"><i className="on" /><i /></div>
              <div className="bt-dock">
                {DOCK.map((a, i) => (
                  <div className="bt-ic" key={i} style={{ background: a.c }}>{a.g}</div>
                ))}
              </div>
              {stage === 'opening' && (
                <div className="bt-zoom"><BlueVinylIcon size={60} rounded={false} /></div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
