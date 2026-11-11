# LP Travel — 경험 프로토타입 (웹앱)

여행의 순간(사진·영상·소리)을 LP에 "프레스"해서 앨범으로 남기는 앱의 **경험 프로토타입**입니다.
KAIST ID.30004 Experience Prototyping 과제용. Figma UI(week 10 / UI 섹션)를 기반으로 구현했습니다.

## 구현된 플로우 (현재: 4개 화면)
1. **홈** — 턴테이블 일러스트 + 하단에 살짝 걸친 앨범 스택
2. **앨범 스택** — 홈에서 쓸어올리기/내리기(스크롤·스와이프)하면 앨범들이 주르륵 펼쳐짐
3. **앨범 커버** — 앨범을 탭하면 커버가 서고(스택은 위아래로 뒤집힘) LP가 옆으로 삐져나옴 → 오른쪽으로 끌어서 "Pull out to open"
4. **LP 화면** — 화면이 옆으로 넘어가며 LP 재생 화면. 좌우 스와이프로 moment 전환, 탭하면 재생/정지, 하단 점이 moment 위치

데모 콘텐츠는 Paris 앨범에만 있습니다(moment 3개). 나머지 앨범은 빈 LP 화면이 나옵니다.

이전에 만든 촬영(기울기 센서)·노래/노트·프레스 화면은 `src/screens`에 보관 중이며 아직 연결되지 않았습니다.

## 실행
```bash
npm install
npm run dev      # 개발 서버 (같은 Wi-Fi의 폰에서 접속 가능)
npm run build    # dist/ 생성
```

## 배포
`dist/`를 정적 호스팅(Vercel / Netlify / GitHub Pages)에 올리면 됩니다.
카메라·마이크·기울기 센서는 **HTTPS에서만** 동작합니다 (localhost 제외).

## Figma와 다른 점 (의도적 단순화)
- 홈 → 스택 → 커버 → LP 화면까지만 구현. "Add New Album" 탭, 촬영/프레스 화면은 아직 미연결

## AI 사용 고지 (과제 appendix용)
코드는 Claude(Anthropic)의 도움으로 작성되었고, UI 디자인은 팀이 Figma에서 직접 만든 것을 기준으로 했습니다.

## 주의
참가자의 촬영 데이터는 기기 안에만 저장됩니다. 저장소에 커밋하지 마세요.

## 글꼴 체계 (Figma Section 3 기준)

| 용도 | 글꼴 | CSS 변수 |
|---|---|---|
| 도시명 · 큰 숫자("3 Days") · 메모 | Lora (SemiBold/Bold) | `--serif` |
| UI 텍스트 · 버튼 · 날짜 · 컨트롤 | Inter (Light~Bold) | `--sans` |
| "Press!" · "Completed" 같은 연출 문구 | DM Sans Light | `--light` |
| 도장 · 스탬프 | DM Mono | `--mono` |
| 한글 | Noto Sans KR (위 글꼴의 한글 대체) | — |

Figma 에 한두 번만 쓰인 Manrope · Roboto · SF Pro · Crimson Text · IBM Plex Mono 는 위 글꼴로 통일했다.
글꼴은 `@fontsource/*` 패키지로 앱에 포함되어 있어 외부 연결이 필요 없다.

## 사진 출처
Paris 외 도시 앨범(Lisbon·Kyoto·Reykjavik·Bangkok·New York·Barcelona·Jeju)의 사진은 [Unsplash](https://unsplash.com) 무료 사진(Unsplash License)입니다. 체험용 더미이며 실제 서비스에서는 사용자의 사진으로 대체됩니다.

## Blue Vinyl 부팅 화면
- 앱을 처음 열면 iPhone 스타일 홈 화면이 나오고, Blue Vinyl 아이콘을 누르면 확대 → 단색 배경 → LP 로고 → "Blue Vinyl" 텍스트 순서의 스플래시 후 앱으로 진입합니다. (`src/screens/Boot.tsx`)
- 로고는 SVG 컴포넌트(`src/Logo.tsx`)로 재현했고, 홈 화면의 다른 앱 아이콘은 자체 제작한 단순 도형입니다.
- `?boot=0` 을 주소 뒤에 붙이면 부팅 화면을 건너뜁니다.
- AI 사용: 로고 SVG 재현, 부팅 애니메이션 코드는 Claude(Sonnet 5.5)가 작성했습니다.

## 소포 디자인
- 팀 웹 프로토타입(blue-vinyl)의 소포(크래프트지·십자 끈·퍼포레이션 우표·소인·to/from)를 `src/Parcel.tsx` 로 이식해, 스택·홈·커버 화면의 소포에 공통 적용했습니다.
