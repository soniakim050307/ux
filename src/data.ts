/** 새 플로우(홈 → 앨범 스택 → 커버 → LP 화면)에서 쓰는 데이터. */

export interface FlowMoment {
  id: string
  src: string
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
      { id: 'paris-river', src: img('paris-river.jpg') },
      { id: 'paris-museum', src: img('paris-museum.jpg') },
      { id: 'paris-street', src: img('paris-street.jpg') },
    ],
  },
  { id: 'kyoto', city: 'Kyoto, Japan', date: '2025.04', tone: '#666666', moments: [] },
  { id: 'lisbon', city: 'Lisbon, Portugal', date: '2025.06', tone: '#858585', moments: [] },
  { id: 'jeju', city: 'Jeju, Korea', date: '2025.09', tone: '#949494', moments: [] },
]
