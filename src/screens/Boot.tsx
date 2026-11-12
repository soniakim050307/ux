import { useEffect, useState } from 'react'
import { BlueVinylDisc, BlueVinylIcon, BlueVinylWord } from '../Logo'
import { AppIcon, type IconKind } from './BootIcons'

/** 가짜 홈 화면 아이콘 (실제 앱 아이콘 대신 단순한 자체 글리프) */
const APPS: { name: string; kind: IconKind }[] = [
  { name: '메시지', kind: 'messages' },
  { name: '캘린더', kind: 'calendar' },
  { name: '사진', kind: 'photos' },
  { name: '카메라', kind: 'camera' },
  { name: '지도', kind: 'maps' },
  { name: '날씨', kind: 'weather' },
  { name: '시계', kind: 'clock' },
  { name: '메모', kind: 'notes' },
  { name: '음악', kind: 'music' },
  { name: '책', kind: 'books' },
  { name: '설정', kind: 'settings' },
  { name: '파일', kind: 'files' },
]
const DOCK: IconKind[] = ['phone', 'browser', 'mail', 'music']

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
                  <BlueVinylDisc size={76} />
                </div>
                <div className="bt-word">
                  <span><BlueVinylWord height={41} /></span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bt-home">
              <div className="bt-wall" />
              <div className="bt-island" />
              <div className="bt-status">
                <b>9:41</b>
                <span className="bt-sig">
                  <svg viewBox="0 0 18 12" width="18" height="12" aria-hidden>
                    <rect x="0" y="8" width="3" height="4" rx="0.8" fill="#fff" />
                    <rect x="5" y="5.5" width="3" height="6.5" rx="0.8" fill="#fff" />
                    <rect x="10" y="3" width="3" height="9" rx="0.8" fill="#fff" />
                    <rect x="15" y="0" width="3" height="12" rx="0.8" fill="#fff" />
                  </svg>
                  <svg viewBox="0 0 17 12" width="17" height="12" aria-hidden>
                    <path d="M8.5 11.2 6 8.6a3.6 3.6 0 0 1 5 0Zm-5-5a7.100 7.100 0 0 1 10 0l-1.400 1.400a5.100 5.100 0 0 0-7.200 0Zm-2.600-2.600a10.800 10.800 0 0 1 15.200 0l-1.400 1.400a8.800 8.800 0 0 0-12.400 0Z" fill="#fff" />
                  </svg>
                  <em><i /></em>
                </span>
              </div>
              <div className="bt-grid">
                {APPS.slice(0, 8).map((a) => (
                  <div className="bt-app" key={a.name}>
                    <div className="bt-ic"><AppIcon kind={a.kind} /></div>
                    <span>{a.name}</span>
                  </div>
                ))}
                <button className="bt-app bt-bv" onClick={() => stage === 'home' && setStage('opening')} aria-label="Blue Vinyl 열기">
                  <div className="bt-ic bt-ic-bv"><BlueVinylIcon size={60} /></div>
                  <span>Blue Vinyl</span>
                </button>
                {APPS.slice(8).map((a) => (
                  <div className="bt-app" key={a.name}>
                    <div className="bt-ic"><AppIcon kind={a.kind} /></div>
                    <span>{a.name}</span>
                  </div>
                ))}
              </div>
              <div className="bt-dots"><i className="on" /><i /></div>
              <div className="bt-search">
                <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden><circle cx="6.500" cy="6.500" r="4.800" fill="none" stroke="#fff" strokeWidth="1.600" /><path d="m10.200 10.200 4 4" stroke="#fff" strokeWidth="1.600" strokeLinecap="round" /></svg>
                검색
              </div>
              <div className="bt-dock">
                {DOCK.map((a, i) => (
                  <div className="bt-ic" key={i}><AppIcon kind={a} /></div>
                ))}
              </div>
              <div className="bt-homebar" />
              {stage === 'opening' && (
                <div className="bt-zoom"><BlueVinylIcon size={60} /></div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
