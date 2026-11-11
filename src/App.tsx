import { FLOW_ALBUMS } from './data'
import Records from './screens/Records'
import Boot from './screens/Boot'
import CarveScene from './screens/CarveScene'

/**
 * 플로우: 홈 → (쓸어내리기) 앨범 스택 → (앨범 선택) 커버 + LP 빼기 → (옆으로 전환) LP 화면
 * 촬영·프레스 등 나머지 화면은 src/screens 에 보관 중이며, 다음 단계에서 다시 연결한다.
 */
export default function App() {
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('carve') === '1')
    return (
      <div className="stage">
        <div className="app">
          <CarveScene loop />
        </div>
      </div>
    )
  return (
    <div className="stage">
      <div className="app">
        <Boot>
          <Records albums={FLOW_ALBUMS} />
        </Boot>
      </div>
    </div>
  )
}
