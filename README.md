# LP Travel — 경험 프로토타입 (웹앱)

여행의 순간(사진·영상·소리)을 LP에 "프레스"해서 앨범으로 남기는 앱의 **경험 프로토타입**입니다.
KAIST ID.30004 Experience Prototyping 과제용. Figma UI(week 10 / UI 섹션)를 기반으로 구현했습니다.

## 구현된 핵심 플로우
앨범 목록 → 앨범(LP) → Edit → 촬영(PHOTO / VIDEO / AUDIO) → 노래·노트 → PRESS INTO LP → 앨범 복귀 → Replay

- 폰을 **평평하게 눕히면 오디오**, **세우면 카메라** 모드로 자동 전환 (Enable tilt 버튼, iOS는 권한 필요)
- 촬영 파일은 브라우저 IndexedDB, 앨범 정보는 localStorage에 저장 (새로고침해도 유지)

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
- 핵심 경험만 구현 (온보딩, Finish my journey, 앨범 감상 화면 등은 미구현)
- 노래는 메타데이터만 (재생 없음), 기본 선택 노래 없음
- 시드 앨범은 비어 있음

## AI 사용 고지 (과제 appendix용)
코드는 Claude(Anthropic)의 도움으로 작성되었고, UI 디자인은 팀이 Figma에서 직접 만든 것을 기준으로 했습니다.

## 주의
참가자의 촬영 데이터는 기기 안에만 저장됩니다. 저장소에 커밋하지 마세요.
