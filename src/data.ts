/** 새 플로우(홈 → 앨범 스택 → 커버 → LP 화면)에서 쓰는 데이터. */

export interface FlowMoment {
  id: string
  /** 사진 또는 영상 파일 */
  src: string
  /** 영상일 때 첫 화면·썸네일로 쓰는 사진 */
  poster?: string
  kind?: 'photo' | 'video' | 'audio'
  /** 이 moment 의 음악 파일. 없으면 임시 멜로디가 나온다. (예: public/audio/paris-1.mp3) */
  audio?: string
  /** audio 파일에서 재생을 시작할 위치(초) */
  audioStart?: number
  /** 기록한 시각 (표시용) */
  time?: string
  /** 메모 */
  note?: string
  /** 세부 위치 (예: 카페 이름, 거리) */
  place?: string
  /** 같이 담은 노래 (표시용) */
  song?: { title: string; artist: string; /** 앨범 표지 (실제 앱에서는 Apple Music 아트워크) */ art?: string }
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
  /** 새로 만드는 중인 앨범 (정보 입력 전) */
  draft?: boolean
  /** 앨범 이름 */
  name?: string
  /** 배송 중인 LP (소포 상태) */
  delivery?: { startedAt: number; days: number }
  /** 종이비행기로 받은 LP: 보낸 사람 아이디 */
  sharedBy?: string
}

const img = (name: string) => `${import.meta.env.BASE_URL}img/${name}`
const audio = (name: string) => `${import.meta.env.BASE_URL}audio/${name}`

/** 임시 사진(일러스트)과 메모로 채운 여행 앨범. 실제 사진·음악으로 교체하면 된다. */
function trip(
  id: string,
  city: string,
  date: string,
  tone: string,
  moments: [string, string][],
  coverIdx = 1,
): FlowAlbum {
  return {
    id,
    city,
    date,
    tone,
    cover: img(`${id}-${coverIdx + 1}.jpg`),
    moments: moments.map(([time, note], i) => ({
      id: `${id}-${i + 1}`,
      src: `${import.meta.env.BASE_URL}video/${id}-${i + 1}.mp4`,
      poster: img(`${id}-${i + 1}.jpg`),
      kind: 'video',
      time,
      note,
      audio: audio('paris.mp3'),
      audioStart: 300 + i * 420 + id.length * 37,
    })),
  }
}

/** 오래된 순. 화면에서는 최신이 위로 오도록 뒤집어서 쓴다. */
export const FLOW_ALBUMS: FlowAlbum[] = [
  trip('barcelona', 'Barcelona, Spain', '2023.08', '#6b6b6b', [
    ['2023.08.12 · 19:50', '해 질 무렵 언덕에 올라 도시 전체를 내려다봤다. 뾰족한 첨탑들이 노을에 걸려 있었다.'],
    ['2023.08.12 · 21:30', '골목마다 불이 켜지기 시작했다. 타파스 한 접시에 시간 가는 줄 몰랐다.'],
    ['2023.08.14 · 09:15', '아침 햇살이 부드러운 날. 천천히 걸으며 마지막 날을 보냈다.'],
  ]),
  trip('newyork', 'New York, USA', '2023.11', '#7a7a7a', [
    ['2023.11.03 · 17:40', '퇴근 시간의 맨해튼. 건물마다 하나둘 창문에 불이 들어왔다.'],
    ['2023.11.03 · 21:10', '밤의 스카이라인. 차가운 바람 속에서도 한참을 서 있었다.'],
    ['2023.11.05 · 23:00', '숙소로 돌아오는 길, 도시는 끝까지 깨어 있었다.'],
  ]),
  trip('reykjavik', 'Reykjavik, Iceland', '2024.02', '#8c8c8c', [
    ['2024.02.18 · 22:20', '구름이 걷히자 하늘에 초록빛 띠가 흘렀다. 숨을 죽이고 올려다봤다.'],
    ['2024.02.18 · 23:05', '오로라가 가장 선명했던 밤. 손이 얼어도 카메라를 내려놓을 수 없었다.'],
    ['2024.02.20 · 06:40', '새벽의 산 능선. 푸르스름한 빛이 천천히 번졌다.'],
  ]),
  trip('bangkok', 'Bangkok, Thailand', '2024.07', '#9e9e9e', [
    ['2024.07.22 · 18:20', '사원의 첨탑 뒤로 하늘이 분홍빛으로 물들었다. 향 냄새가 바람에 실려 왔다.'],
    ['2024.07.22 · 19:00', '해가 지는 강가. 노을이 번질수록 도시의 소리가 낮아졌다.'],
    ['2024.07.24 · 17:45', '시장에서 산 망고를 먹으며 걷던 저녁.'],
  ]),
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
  trip('kyoto', 'Kyoto, Japan', '2025.04', '#666666', [
    ['2025.04.05 · 10:30', '벚꽃이 흩날리는 길 끝에 오층탑이 서 있었다. 분홍빛 하늘이 낮게 내려앉았다.'],
    ['2025.04.06 · 14:10', '산 그림자가 길어지는 오후. 절 마당에 앉아 한참 쉬었다.'],
    ['2025.04.07 · 20:00', '밤의 탑. 꽃잎이 가로등 불빛 속에서 별처럼 날렸다.'],
  ]),
  trip('lisbon', 'Lisbon, Portugal', '2025.06', '#858585', [
    ['2025.06.14 · 16:00', '언덕 위 주황색 지붕들이 햇빛에 반짝였다. 트램 소리가 골목을 채웠다.'],
    ['2025.06.15 · 18:30', '노을이 지붕마다 번져 도시 전체가 따뜻한 색이 됐다.'],
    ['2025.06.16 · 20:15', '저녁 창문마다 불이 켜졌다. 파두 선율이 어디선가 흘러나왔다.'],
  ]),
  trip('jeju', 'Jeju, Korea', '2025.09', '#949494', [
    ['2025.09.20 · 11:00', '맑은 날 한라산이 바다 너머로 또렷하게 보였다. 바람이 시원했다.'],
    ['2025.09.21 · 17:30', '오후의 바다가 짙은 청록으로 깊어졌다. 파도 소리만 들렸다.'],
    ['2025.09.22 · 18:40', '해가 바다로 내려앉는 시간. 하늘이 주황빛으로 물들었다.'],
  ]),
]

/** 체험용 임시 곡 (실제로는 기록할 때 감지된 노래가 들어간다) */
const SONGS: Record<string, [string, string][]> = {
  paris: [['La Vie en Rose', 'Édith Piaf'], ['Les Champs-Élysées', 'Joe Dassin'], ["Comptine d'un autre été", 'Yann Tiersen']],
  barcelona: [['Barcelona', 'Freddie Mercury & Montserrat Caballé'], ['Me gustas tú', 'Manu Chao'], ['Bamboleo', 'Gipsy Kings']],
  newyork: [['New York, New York', 'Frank Sinatra'], ['Empire State of Mind', 'Jay-Z ft. Alicia Keys'], ['New York State of Mind', 'Billy Joel']],
  reykjavik: [['Hoppípolla', 'Sigur Rós'], ['Jóga', 'Björk'], ['Near Light', 'Ólafur Arnalds']],
  bangkok: [['Maria También', 'Khruangbin'], ['White Gloves', 'Khruangbin'], ['Evan Finds the Third Room', 'Khruangbin']],
  kyoto: [['Summer', 'Joe Hisaishi'], ['Merry Christmas Mr. Lawrence', 'Ryuichi Sakamoto'], ['First Love', 'Hikaru Utada']],
  lisbon: [['O Pastor', 'Madredeus'], ['Estranha Forma de Vida', 'Amália Rodrigues'], ['Gente da Minha Terra', 'Mariza']],
  jeju: [['Palette', 'IU'], ['Little Star', 'Standing Egg'], ['Wi Ing Wi Ing', 'HYUKOH']],
}
for (const a of FLOW_ALBUMS) {
  const list = SONGS[a.id]
  if (!list) continue
  a.moments.forEach((m, i) => {
    // 모먼트가 곡을 나누지 않는다: 한 곡이 여러 모먼트(여러 날)에 걸쳐 깔린다
    const t = list[[0, 1, 1, 2, 2, 2][i % 6] % list.length]
    if (!m.song) m.song = { title: t[0], artist: t[1] }
  })
}

/** 회고 화면 배경색: 기본 파란색(#545e85)에서 크게 벗어나지 않게, 각 여행 대표 사진의 색을 살짝 섞은 값 */
const LP_BG: Record<string, string> = {
  barcelona: '#6a627a',
  newyork: '#5b5c80',
  reykjavik: '#587390',
  bangkok: '#55776f',
  kyoto: '#6b5a78',
  lisbon: '#76667a',
  jeju: '#4f6f98',
}
export const lpBg = (id?: string) => (id && LP_BG[id]) || '#545e85'

/** 회고 화면 배경: 같은 색에서 위는 아주 살짝 밝고 아래는 살짝 깊은 은은한 그라데이션 */
export const lpBgImage = (id?: string) => {
  const c = lpBg(id)
  return `linear-gradient(180deg, color-mix(in srgb, ${c} 90%, white) 0%, ${c} 55%, color-mix(in srgb, ${c} 90%, black) 100%)`
}
