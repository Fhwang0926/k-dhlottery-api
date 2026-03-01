# 비공식 동행복권 API (Node.js)

[동행복권](https://dhlottery.co.kr/) 사이트를 터미널에서 이용할 수 있게 랩핑한 API입니다.  
원본 Python 프로젝트 [roeniss/dhlottery-api](https://github.com/roeniss/dhlottery-api)를 Node.js로 마이그레이션한 버전입니다.

## 요구사항

- Node.js 18 이상

## 설치 및 사용법

### npm 패키지로 설치 (배포 후)

```bash
npm install -g k-dhapi
# 또는
npx k-dhapi --help

dhapi buy-lotto645 -y
```

설치 후 실행 명령어는 `dhapi`입니다 (패키지 이름은 `k-dhapi`).

### 소스에서 설치

```bash
git clone <this-repo>
cd k-dhlottery-api
npm install
npm run build

# 기본 도움말
dhapi --help
# 또는
node dist/cli.js --help

# 로또6/45 구매 도움말
dhapi buy-lotto645 --help

# 자동모드 5장 구매 & 확인절차 스킵
dhapi buy-lotto645 -y
```

전역 설치 후 사용:

```bash
npm link
dhapi buy-lotto645 -y
```

## 구현된 기능들

- [로또6/45 구매](https://dhlottery.co.kr/gameInfo.do?method=gameMethod&wiselog=H_B_1_1) (`buy-lotto645`)
  - 자동, 수동, 반자동 모드로 구매 가능합니다.
  - 한 번에 최대 5장까지 구매 가능합니다.
  - 매주 최대 5장까지 구매 가능합니다 (동행복권 측의 온라인 구매 관련 정책입니다).
- [예치금 현황 조회](https://dhlottery.co.kr/userSsl.do?method=myPage) (`show-balance`)
  - 현재 보유한 예치금 정보를 조회합니다.
- [고정 가상계좌 입금을 위한 세팅](https://dhlottery.co.kr/userSsl.do?method=myPage) (`assign-virtual-account`)
  - 개인에게 할당된 가상계좌에 입금하는 형태로 예치금을 충전할 수 있습니다. 이 때 얼마를 입금할건지 사이트에서 미리 선택해두어야 하는데, 이 작업을 대신 수행합니다.
  - 입금은 직접 진행해야 합니다.
  - 간편 충전 기능은 구현되지 않았습니다.

### 유틸성 기능들

- 복수 프로필 지정
  - 두 개 이상의 프로필을 사용할 수 있습니다. 고급 설정 섹션을 참고해주세요.
- 프로필 목록 조회 (`show-profiles`)
  - 설정된 프로필 이름들을 확인할 수 있습니다.

## 고급 설정

### 프로필 (계정) 설정

> [!NOTE] 최초 프로그램을 실행할 때 프로필 정보를 세팅하는 과정이 진행됩니다. 이 섹션에선 직접 프로필 정보 파일을 수정하는 법을 안내합니다.

`~/.dhapi/credentials` (Windows: `%USERPROFILE%\.dhapi\credentials`) 파일을 사용해 프로필 정보를 수정하거나 여러 계정을 설정할 수 있습니다. toml 포맷을 사용하고 있으며, 아래와 같은 형식으로 작성할 수 있습니다.

```toml
[default]
username = "dhlotter_id"
password = "****"

[another_profile]
username = "dhlotter_second_id"
password = "****"
```

이후 `-p` 플래그로 프로필을 골라 사용합니다.

## 명령어 예시

```bash
# 자동 5장 (기본)
dhapi buy-lotto645

# 자동 1장
dhapi buy-lotto645 ""

# 수동 1장
dhapi buy-lotto645 "1,2,3,4,5,6"

# 반자동 1장 (1,2,3 고정)
dhapi buy-lotto645 "1,2,3"

# 수동 1장 + 반자동 1장
dhapi buy-lotto645 "1,2,3,4,5,6" "7,8,9"

# 확인 없이 자동 5장
dhapi buy-lotto645 -y

# 예치금 조회
dhapi show-balance

# 구매 내역 (최근 14일)
dhapi show-buy-list -f json

# 기간 지정
dhapi show-buy-list -s 20250101 -e 20250131
```

## 백엔드 API 서버 (REST API)

CLI 외에 HTTP API 서버로 같은 기능을 사용할 수 있습니다.

```bash
npm run server
# 포트 지정 (Windows: set PORT=4000 && npm run server)
PORT=4000 npm run server
```

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/profiles` | 프로필 목록 |
| GET | `/api/balance` | 예치금 현황 (query: `profile`) |
| POST | `/api/buy-lotto645` | 로또 구매 (body: `profile`, `tickets`, `skipConfirm`) |
| GET | `/api/buy-list` | 구매 내역 (query: `profile`, `format`, `startDate`, `endDate`) |
| POST | `/api/assign-virtual-account` | 가상계좌 세팅 (body: `profile`, `amount`) |

성공 시 `{ "success": true, "data": ... }`, 실패 시 `{ "success": false, "error": "메시지" }` 형식입니다.

## npm 패키지 배포

이 프로젝트를 npm에 배포하려면:

1. [npmjs.com](https://www.npmjs.com/) 회원가입 후 `npm login`
2. 패키지 이름: 이 프로젝트는 npm에서 이미 사용 중인 `dhapi`와 구분하기 위해 `k-dhapi`로 배포합니다. 스코프 패키지(예: `@내계정/dhapi`)로 쓰려면 `name`을 변경하면 됩니다.
3. 버전 업데이트 후 배포:

```bash
npm run build
npm test
npm publish
```

- `prepublishOnly` 스크립트로 publish 전에 자동으로 `npm run build`가 실행됩니다.
- 스코프 패키지(`@xxx/dhapi`)로 배포할 때는 `npm publish --access public`이 필요할 수 있습니다. (`publishConfig.access`가 이미 `public`으로 설정되어 있음)

배포 전에 포함되는 파일 확인: `npm pack --dry-run`

### GitHub Actions로 태그 푸시 시 자동 배포

`v*` 형태의 태그를 푸시하면 자동으로 npm에 배포됩니다.

1. **npm 인증 토큰 발급**  
   [npm → Access Tokens](https://www.npmjs.com/account/tokens)에서 "Generate New Token" → "Automation" 또는 "Classic" 선택 후 토큰 복사.

2. **GitHub 저장소에 시크릿 추가**  
   저장소 **Settings → Secrets and variables → Actions**에서 New repository secret 추가:
   - Name: `NPM_TOKEN`
   - Value: 위에서 복사한 npm 토큰

3. **버전 올리고 태그 푸시**

```bash
# package.json의 version 수정 후 (예: 1.0.1)
git add package.json
git commit -m "chore: release 1.0.1"
git tag v1.0.1
git push origin main
git push origin v1.0.1
```

태그 `v1.0.1`을 푸시하면 `.github/workflows/publish-npm.yml`이 실행되어 빌드·테스트 후 npm에 publish됩니다.

## 기부하기

이 프로그램을 사용해서 1등에 당첨된다면, [원작자 roeniss](https://github.com/roeniss)에게 꼭 1000만원을 기부해주시길 바랍니다.

원본 Python 프로젝트: [Buy Me A Coffee](https://www.buymeacoffee.com/roeniss)

## 기여하기

기여는 대환영합니다! [CONTRIBUTING.md](docs/CONTRIBUTING.md) 파일을 참고해주세요.

## 라이선스

MIT. 원본 [dhlottery-api](https://github.com/roeniss/dhlottery-api)는 Apache-2.0 라이선스입니다.
