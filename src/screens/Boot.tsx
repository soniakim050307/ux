import { useEffect, useState } from 'react'
import { BlueVinylDisc, BlueVinylIcon, BlueVinylWord } from '../Logo'
import { AppIcon, type IconKind } from './BootIcons'

const DOCK: IconKind[] = ['phone', 'browser', 'messages', 'music']
const ICON = (kind: IconKind, name: string, extra = '') => (
  <div className={`bt-app ${extra}`} key={name}>
    <div className="bt-ic"><AppIcon kind={kind} /></div>
    <span>{name}</span>
  </div>
)
const photo = (n: string) => `${import.meta.env.BASE_URL}img/${n}`

type Stage = 'home' | 'opening' | 'splash' | 'done'

export default function Boot({ children, onPip }: { children: React.ReactNode; onPip?: () => void }) {
  const [viaPip, setViaPip] = useState(false)
  const skip = typeof location !== 'undefined' && new URLSearchParams(location.search).get('boot') === '0'
  const [stage, setStage] = useState<Stage>(skip ? 'done' : 'home')

  useEffect(() => {
    if (stage === 'opening') {
      const t = setTimeout(() => setStage('splash'), 520)
      return () => clearTimeout(t)
    }
    if (stage === 'splash') {
      const t = setTimeout(() => setStage('done'), viaPip ? 1500 : 4300)
      return () => clearTimeout(t)
    }
  }, [stage, viaPip])

  return (
    <>
      {stage === 'done' && children}
      {stage !== 'done' && (
        <div className={`bt bt-${stage}`}>
          {stage === 'splash' ? (
            <div className={`bt-splash${viaPip ? ' short' : ''}`}>
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
                {ICON('clock', '시계')}
                {ICON('camera', '카메라')}
                <div className="bt-wcell">
                  <div className="bt-w bt-act">
                    <svg viewBox="0 0 60 60" width="62" height="62" aria-hidden>
                      {[['#fa114f', 26, 0.75], ['#a6ff00', 19, 0.63], ['#00e0ff', 12, 0.34]].map(([c, r, f]) => (
                        <g key={String(c)} fill="none" strokeWidth="6" strokeLinecap="round">
                          <circle cx="30" cy="30" r={r as number} stroke={String(c)} opacity=".25" />
                          <circle cx="30" cy="30" r={r as number} stroke={String(c)} strokeDasharray={`${2 * Math.PI * (r as number) * (f as number)} 999`} transform="rotate(-90 30 30)" />
                        </g>
                      ))}
                    </svg>
                    <div><b style={{ color: '#fa114f' }}>375/500<small>CAL</small></b><b style={{ color: '#a6ff00' }}>19/30<small>MIN</small></b><b style={{ color: '#00e0ff' }}>4/12<small>HRS</small></b></div>
                  </div>
                  <span className="bt-wl">활동</span>
                </div>
                {ICON('tv', 'TV')}
                {ICON('stocks', '주식')}
                <div className="bt-wcell bt-wphoto">
                  <div className="bt-w bt-pic" style={{ backgroundImage: `url(${photo('reykjavik-1.jpg')})` }}>
                    <b>REYKJAVIK</b><small>Feb 18, 2024</small>
                  </div>
                  <span className="bt-wl">사진</span>
                </div>
                {ICON('mail', '메일')}
                {ICON('files', '파일')}
                <button className="bt-app bt-bv" onClick={() => stage === 'home' && setStage('opening')} aria-label="Blue Vinyl 열기">
                  <div className="bt-ic bt-ic-bv"><BlueVinylIcon size={60} /></div>
                  <span>Blue Vinyl</span>
                </button>
                {ICON('weather', '날씨')}
                {ICON('health', '건강')}
                {ICON('home', '홈')}
                <div className="bt-wcell bt-wmusic">
                  <div className="bt-w bt-mus">
                    <div className="bt-alb"><BlueVinylDisc size={44} /></div>
                    <b>Hoppípolla</b><small>Sigur Rós</small>
                  </div>
                  <span className="bt-wl">음악</span>
                </div>
                {ICON('news', '뉴스')}
                {ICON('photos', '사진')}
              </div>
              <button
                type="button"
                className="bt-pip"
                aria-label="기록하기"
                onClick={() => {
                  if (stage !== 'home') return
                  setViaPip(true)
                  onPip?.()
                  setStage('opening')
                }}
              >
                <i />
              </button>
              <div className="bt-dots"><i className="on" /><i /></div>
              <div className="bt-dock">
                {DOCK.map((a, i) => (
                  <div className="bt-ic" key={i}><AppIcon kind={a} /></div>
                ))}
              </div>
              <div className="bt-homebar" />
              {stage === 'opening' && (
                <div className={`bt-zoom${viaPip ? ' pip' : ''}`}>{viaPip ? null : <BlueVinylIcon size={60} />}</div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
