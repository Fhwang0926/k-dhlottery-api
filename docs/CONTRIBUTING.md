# 개발 가이드

## 배경지식

### 작동 방식

동행복권 사이트는 `JSESSIONID`를 이용하여 유저를 인증합니다. 본 API에서는 `axios` + `axios-cookiejar-support`로 로그인한 후 쿠키(JSESSIONID)를 유지해 복권 구매·예치금 조회 등에 활용합니다.

### 트러블슈팅

#### CLI가 실행되지 않을 때

`npm run build` 후 실행하세요.

```bash
npm run build
node dist/cli.js --help
```

#### API 서버 포트 변경

환경 변수 `PORT`로 지정합니다.

```bash
# Windows PowerShell
$env:PORT=4000; npm run server

# Linux / macOS
PORT=4000 npm run server
```

### PR 전 확인사항

아래 명령어로 컨벤션 및 테스트를 확인합니다.

```bash
make lintfmt
make check
make test
```

또는:

```bash
npm run lint:fix
npm run lint
npm test
```

### 배포

메인테이너가 진행합니다.

1. `main` 브랜치 최신 커밋에 태그 추가 (예: `git tag v1.0.1`)
2. npm publish 또는 GitHub Releases 등으로 배포

### 참고자료

- 원본 Python 프로젝트: [roeniss/dhlottery-api](https://github.com/roeniss/dhlottery-api)
- 동행복권: [dhlottery.co.kr](https://dhlottery.co.kr/)

#### 로또645 구매 요청/응답 (참고)

요청 `param` 예시 (자동 3장):

```json
[
  {"genType":"0","arrGameChoiceNum":null,"alpabet":"A"},
  {"genType":"0","arrGameChoiceNum":null,"alpabet":"B"},
  {"genType":"0","arrGameChoiceNum":null,"alpabet":"C"}
]
```

응답 `arrGameChoiceNum` 예시: `["A|nn|nn|nn|nn|nn|nn3", ...]` (끝자리 1=수동, 2=반자동, 3=자동)
