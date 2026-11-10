/** 새 플로우(홈 → 앨범 스택 → 커버 → LP 화면)에서 쓰는 데이터. */

export interface FlowMoment {
  id: string
  /** 사진 또는 영상 파일 */
  src: string
  kind?: 'photo' | 'video'
  /** 이 moment 의 음악 파일. 없으면 임시 멜로디가 나온다. (예: public/audio/paris-1.mp3) */
  audio?: string
  /** audio 파일에서 재생을 시작할 위치(초) */
  audioStart?: number
  /** 기록한 시각 (표시용) */
  time?: string
  /** 메모 */
  note?: string
  /** 같이 담은 노래 (표시용) */
  song?: { title: string; artist: string }
}

export interface FlowAlbum {
  id: string
  city: string
  date: string
  /** 슬랩(앨범 옆면) 색 — Figma 값 */
  tone: string
  /** 커버 사진 (없으면 회색 슬리브) */
  cover?: string
  moments: FlowMoment[]
}

const img = (name: string) => `${import.meta.env.BASE_URL}img/${name}`
const audio = (name: string) => `${import.meta.env.BASE_URL}audio/${name}`

/** 오래된 순. 화면에서는 최신이 위로 오도록 뒤집어서 쓴다. */
export const FLOW_ALBUMS: FlowAlbum[] = [
  { id: 'barcelona', city: 'Barcelona, Spain', date: '2023.08', tone: '#6b6b6b', moments: [] },
  { id: 'newyork', city: 'New York, USA', date: '2023.11', tone: '#7a7a7a', moments: [] },
  { id: 'reykjavik', city: 'Reykjavik, Iceland', date: '2024.02', tone: '#8c8c8c', moments: [] },
  { id: 'bangkok', city: 'Bangkok, Thailand', date: '2024.07', tone: '#9e9e9e', moments: [] },
  {
    id: 'paris',
    city: 'Paris, France',
    date: '2024.12',
    tone: '#666666',
    cover: img('paris-museum.jpg'),
    moments: [
      {
        id: 'paris-river',
        src: img('paris-river.jpg'),
        time: '2024.12.03 · 18:40',
        note: '해 질 녘 강가. 물 위로 노을이 번지고, 자전거 두 대가 천천히 지나갔다.',
        audio: audio('paris.mp3'),
        audioStart: 0,
      },
      {
        id: 'paris-museum',
        src: img('paris-museum.jpg'),
        time: '2024.12.04 · 13:10',
        note: '파란 하늘에 비행기구름이 길게 그어져 있었다. 전시를 보러 가는 길.',
        audio: audio('paris.mp3'),
        audioStart: 600,
      },
      {
        id: 'paris-street',
        src: img('paris-street.jpg'),
        time: '2024.12.05 · 16:25',
        note: '골목 끝에 에펠탑이 보였다. 걷다가 한참을 멈춰 서 있었다.',
        audio: audio('paris.mp3'),
        audioStart: 1200,
      },
    ],
  },
  { id: 'kyoto', city: 'Kyoto, Japan', date: '2025.04', tone: '#666666', moments: [] },
  { id: 'lisbon', city: 'Lisbon, Portugal', date: '2025.06', tone: '#858585', moments: [] },
  { id: 'jeju', city: 'Jeju, Korea', date: '2025.09', tone: '#949494', moments: [] },
]
