# OAuth 소셜 로그인 설정 가이드

이력서 플랫폼의 Google, GitHub, Kakao 소셜 로그인을 설정하는 방법입니다.

## 사전 준비

| 항목               | 값                                                        |
| ------------------ | --------------------------------------------------------- |
| **백엔드 API URL** | `https://resume-api-464016453534.asia-northeast3.run.app` |
| **프론트엔드 URL** | `https://resume-gongbang.vercel.app`                      |
| **콜백 URL 패턴**  | `{API_URL}/api/auth/{provider}/callback`                  |
| **GCP 프로젝트**   | `resume-platform-prod` (project number `464016453534`)    |

> 로컬 개발 시 `http://localhost:3001`을 사용합니다. OAuth Client는 운영과 로컬 모두 같은 client를 공유 (redirect URI 두 개 등록).

---

## 1. Google OAuth 설정

### 1-1. Google Cloud Console에서 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 상단의 프로젝트 선택 → **새 프로젝트** 클릭
3. 프로젝트 이름: `Resume Platform` → **만들기**

### 1-2. OAuth 동의 화면 설정

1. 좌측 메뉴 → **API 및 서비스** → **OAuth 동의 화면**
2. User Type: **외부** 선택 → **만들기**
3. 앱 정보 입력:
   - 앱 이름: `Resume Platform`
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처: 본인 이메일
4. 범위 → **범위 추가** → `email`, `profile` 선택 → 저장
5. 테스트 사용자 → 본인 이메일 추가 (게시 전까지 필요)

### 1-3. OAuth 클라이언트 ID 생성

1. 좌측 메뉴 → **사용자 인증 정보** → **사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
2. 애플리케이션 유형: **웹 애플리케이션**
3. 이름: `Resume Platform`
4. **승인된 리디렉션 URI** 추가:
   ```
   https://resume-api-464016453534.asia-northeast3.run.app/api/auth/google/callback
   http://localhost:3001/api/auth/google/callback
   ```
5. **만들기** → Client ID와 Client Secret 복사

> ⚠️ OAuth Client는 반드시 `resume-platform-prod` 프로젝트에서 발급하세요. 다른 프로젝트(특히 미사용 프로젝트)에서 발급하면 그 프로젝트가 정리·삭제될 때 client가 같이 사라져 운영에서 `deleted_client` 에러가 발생합니다.

### 1-4. 환경변수 설정

```bash
# .env
GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx
```

---

## 2. GitHub OAuth 설정

### 2-1. OAuth App 생성

1. [GitHub Developer Settings](https://github.com/settings/developers) 접속
2. **OAuth Apps** → **New OAuth App**
3. 정보 입력:
   - Application name: `Resume Platform`
   - Homepage URL: `https://resume-gongbang.vercel.app`
   - Authorization callback URL:
     ```
     https://resume-api-464016453534.asia-northeast3.run.app/api/auth/github/callback
     ```
4. **Register application**

### 2-2. Client Secret 생성

1. 생성된 앱 페이지에서 **Generate a new client secret** 클릭
2. Client ID와 Client Secret 복사

### 2-3. 환경변수 설정

```bash
# .env
GITHUB_CLIENT_ID=Ov23lixxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> GitHub OAuth는 콜백 URL을 **하나만** 등록할 수 있습니다.
> 로컬 개발 시에는 별도의 OAuth App을 만들거나, 콜백 URL을 변경해야 합니다.

---

## 3. Kakao OAuth 설정

### 3-1. 애플리케이션 생성

1. [Kakao Developers](https://developers.kakao.com/) 접속 → 로그인
2. **내 애플리케이션** → **애플리케이션 추가하기**
3. 앱 이름: `Resume Platform` → **저장**

### 3-2. 카카오 로그인 활성화

1. 좌측 메뉴 → **카카오 로그인** → **활성화 설정** → **ON**
2. **Redirect URI** 추가:
   ```
   https://resume-api-464016453534.asia-northeast3.run.app/api/auth/kakao/callback
   http://localhost:3001/api/auth/kakao/callback
   ```

### 3-3. 동의 항목 설정

1. 좌측 메뉴 → **카카오 로그인** → **동의항목**
2. 다음 항목을 **필수 동의**로 설정:
   - 닉네임
   - 프로필 사진
   - 카카오계정(이메일)

### 3-4. REST API 키 확인

1. **앱 설정** → **앱 키** → **REST API 키** 복사

### 3-5. 환경변수 설정

```bash
# .env
KAKAO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 4. GCP Cloud Run 환경변수 설정 (운영)

로컬 `.env`와 별개로, Cloud Run의 `resume-api` 서비스에도 동일한 환경변수를 설정해야 합니다.

```bash
gcloud run services update resume-api \
  --region=asia-northeast3 \
  --project=resume-platform-prod \
  --update-env-vars 'GOOGLE_CLIENT_ID=...,GOOGLE_CLIENT_SECRET=...'
```

> ⚠️ **`--set-env-vars` 금지**: 다른 환경변수가 모두 사라집니다. 반드시 `--update-env-vars` 사용 (메모리 `feedback_gcp_deploy_envvars` 참조).

| Key                    | Value                                                          |
| ---------------------- | -------------------------------------------------------------- |
| `API_URL`              | `https://resume-api-464016453534.asia-northeast3.run.app`      |
| `FRONTEND_URL`         | `https://resume-gongbang.vercel.app`                           |
| `ALLOWED_ORIGINS`      | `https://resume-gongbang.vercel.app` (콤마 구분으로 추가 가능) |
| `JWT_SECRET`           | (안전한 랜덤 문자열, 32자 이상)                                |
| `GOOGLE_CLIENT_ID`     | (Google에서 발급)                                              |
| `GOOGLE_CLIENT_SECRET` | (Google에서 발급)                                              |
| `GITHUB_CLIENT_ID`     | (GitHub에서 발급)                                              |
| `GITHUB_CLIENT_SECRET` | (GitHub에서 발급)                                              |
| `KAKAO_CLIENT_ID`      | (Kakao에서 발급)                                               |

업데이트 직후 Cloud Run이 자동으로 새 revision을 배포합니다.

---

## 5. 동작 확인

1. 프론트엔드 접속: `https://resume-gongbang.vercel.app/login`
2. 각 소셜 로그인 버튼 클릭
3. 인증 후 홈페이지로 리다이렉트되면 성공

### 트러블슈팅

| 증상                                | 원인                                        | 해결                                                                                    |
| ----------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------- |
| 로그인 버튼 클릭 후 빈 페이지       | OAuth 키 미설정                             | `.env`에 키 추가 후 서버 재시작                                                         |
| `redirect_uri_mismatch` 에러        | 콜백 URL 불일치                             | 프로바이더 콘솔에서 URL 정확히 일치시키기                                               |
| `login?error=xxx_failed` 리다이렉트 | 토큰 교환 실패                              | Client Secret 확인, API_URL 환경변수 확인                                               |
| 로그인 후 홈으로 안 감              | FRONTEND_URL 미설정                         | `.env`에 `FRONTEND_URL` 추가                                                            |
| Kakao 로그인만 실패                 | 동의항목 미설정                             | Kakao 콘솔에서 이메일 동의항목 필수로 설정                                              |
| `액세스 차단됨: 401 deleted_client` | OAuth Client가 발급된 GCP 프로젝트가 삭제됨 | `resume-platform-prod`에서 OAuth Client 재발급 후 Cloud Run env 갱신                    |
| `redirect_uri_mismatch` (운영만)    | Google Console에 운영 콜백 URL 미등록       | `https://resume-api-464016453534.asia-northeast3.run.app/api/auth/google/callback` 추가 |

---

## 6. 로컬 개발 환경

로컬에서 OAuth를 테스트하려면 콜백 URL을 `localhost`로 설정해야 합니다.

```bash
# .env (로컬)
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173
```

각 프로바이더 콘솔에 `http://localhost:3001/api/auth/{provider}/callback`도 추가하세요.
Google과 Kakao는 여러 콜백 URL을 허용하므로 운영/로컬 모두 등록 가능합니다.
GitHub은 하나만 가능하므로 로컬용 OAuth App을 별도로 만드는 것을 추천합니다.
