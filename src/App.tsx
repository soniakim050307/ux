import { useState } from 'react'
import { FLOW_ALBUMS } from './data'
import Records from './screens/Records'
import Boot from './screens/Boot'
import Capture from './screens/Capture'
import PressSeq from './screens/PressSeq'
import CarveScene from './screens/CarveScene'

/**
 * 플로우: 홈 → (쓸어내리기) 앨범 스택 → (앨범 선택) 커버 + LP 빼기 → (옆으로 전환) LP 화면
 * 촬영·프레스 등 나머지 화면은 src/screens 에 보관 중이며, 다음 단계에서 다시 연결한다.
 */
export default function App() {
  const [cap, setCap] = useState(false)
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('carve') === '1')
    return (
      <div className="stage">
        <div className="app">
          <CarveScene loop />
        </div>
      </div>
    )
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('press') === '1')
    return (
      <div className="stage">
        <div className="app">
          <PressSeq city="Reykjavik, Iceland" onFinish={() => {}} />
        </div>
      </div>
    )
  return (
    <div className="stage">
      <div className="app">
        <Boot onPip={() => setCap(true)}>
          <Records albums={FLOW_ALBUMS} />
          {cap && (
            <div className="cap-over">
              <Capture title="New Journey" index={1} onClose={() => setCap(false)} onDone={() => setCap(false)} />
            </div>
          )}
        </Boot>
      </div>
    </div>
  )
}
