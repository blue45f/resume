# API 레퍼런스

> **Base URL:** `/api`
> **인증:** Bearer 토큰 (Authorization 헤더) 또는 httpOnly 쿠키 (`token`)
> **Swagger UI:** `http://localhost:3001/api/docs` (개발 환경 전용)

---

## 목차

- [인증 (Auth)](#인증-auth)
- [이력서 (Resumes)](#이력서-resumes)
- [AI / LLM 변환](#ai--llm-변환)
- [AI 자동 생성](#ai-자동-생성)
- [버전 관리 (Versions)](#버전-관리-versions)
- [공유 (Share)](#공유-share)
- [댓글 (Comments)](#댓글-comments)
- [북마크 (Bookmarks)](#북마크-bookmarks)
- [태그 (Tags)](#태그-tags)
- [첨부파일 (Attachments)](#첨부파일-attachments)
- [템플릿 (Templates)](#템플릿-templates)
- [자기소개서 (Cover Letters)](#자기소개서-cover-letters)
- [채용 공고 (Jobs)](#채용-공고-jobs)
- [지원 관리 (Applications)](#지원-관리-applications)
- [소셜 / 네트워킹 (Social)](#소셜--네트워킹-social)
- [알림 (Notifications)](#알림-notifications)
- [헬스체크 / 통계 (Health)](#헬스체크--통계-health)
- [관리자 (Admin)](#관리자-admin)
- [Rate Limits](#rate-limits)

---

## 인증 (Auth)

모든 인증 엔드포인트는 `/api/auth` 하위에 위치합니다.

### GET /auth/providers
사용 가능한 소셜 로그인 프로바이더 목록. **공개**

**Response:** `["google", "github", "kakao"]`

### POST /auth/register
이메일 회원가입. **공개**

**Request:**
```json
{
  "email": "user@example.com",
  "password": "12345678",
  "name": "홍길동",
  "userType": "individual",
  "companyName": "회사명 (리크루터)",
  "companyTitle": "직함 (리크루터)"
}
```

**Response:** `{ "token": "jwt..." }`
쿠키에도 `token`이 httpOnly로 설정됩니다.

### POST /auth/login
이메일 로그인. **공개**

**Request:** `{ "email": "user@example.com", "password": "12345678" }`

**Response:** `{ "token": "jwt..." }`

### POST /auth/logout
로그아웃 (쿠키 삭제). **공개**

**Response:** `{ "success": true }`

### GET /auth/me
내 프로필 정보 조회. **인증 필요**

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "홍길동",
  "provider": "local",
  "role": "user",
  "userType": "individual",
  "avatar": "https://...",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

### PATCH /auth/profile
프로필 수정. **인증 필요**

**Request:** `{ "name": "새이름", "userType": "recruiter", "companyName": "네이버", "companyTitle": "리크루터" }`

### POST /auth/change-password
비밀번호 변경. **인증 필요**

**Request:** `{ "currentPassword": "old", "newPassword": "new12345" }`

### DELETE /auth/account
계정 삭제 (모든 데이터 영구 삭제, cascade). **인증 필요**

### GET /auth/linked-accounts
연결된 소셜 계정 정보. **인증 필요**

### GET /auth/link/:provider
소셜 계정 연동 시작 (google/github/kakao). **인증 필요**
OAuth 페이지로 리다이렉트됩니다.

### OAuth 흐름

| 프로바이더 | 로그인 URL | 콜백 URL |
|-----------|-----------|---------|
| Google | `GET /auth/google` | `GET /auth/google/callback` |
| GitHub | `GET /auth/github` | `GET /auth/github/callback` |
| Kakao | `GET /auth/kakao` | `GET /auth/kakao/callback` |

모두 **공개** 엔드포인트이며 OAuth 흐름 완료 후 프론트엔드로 리다이렉트합니다.

---

## 이력서 (Resumes)

### GET /resumes
내 이력서 목록 (로그인 시) 또는 공개 이력서 목록. **인증 필요**

**Query:** `page` (기본 1), `limit` (기본 20, 최대 50), `public=true`

**Response:**
```json
{
  "data": [{ "id": "...", "title": "...", "theme": "modern", "viewCount": 10, "createdAt": "..." }],
  "total": 10,
  "page": 1,
  "totalPages": 1
}
```

### GET /resumes/public
공개 이력서 검색/목록. **공개** (60초 캐시)

**Query:** `q` (검색어), `tag` (태그), `sort` (정렬), `page`, `limit`

### GET /resumes/@:username/:slug
슬러그로 이력서 조회. **공개** (60초 캐시)

### GET /resumes/:id
이력서 상세 조회 (모든 섹션 포함). **인증 필요**

### POST /resumes
이력서 생성. **인증 필요**

### PUT /resumes/:id
이력서 수정. **인증 필요**

### DELETE /resumes/:id
이력서 삭제. **인증 필요**

### POST /resumes/:id/duplicate
이력서 복제. **인증 필요**

### PATCH /resumes/:id/visibility
이력서 공개/비공개 설정. **인증 필요**

**Request:** `{ "visibility": "public" }`

### PATCH /resumes/:id/slug
이력서 공개 URL 슬러그 변경. **인증 필요**

**Request:** `{ "slug": "my-resume" }`

### PATCH /resumes/:id/transfer
이력서 소유권 이전. **관리자 전용**

**Request:** `{ "newUserId": "uuid" }`

### GET /resumes/:id/export/text
텍스트 형식 다운로드. **인증 필요**

### GET /resumes/:id/export/markdown
마크다운 형식 다운로드. **인증 필요**

### GET /resumes/:id/export/json
JSON 형식 다운로드. **인증 필요**

### GET /resumes/dashboard/analytics
사용자 대시보드 분석. **인증 필요**

### GET /resumes/trend/:resumeId
이력서 변경 추이. **인증 필요**

**Response:** `[{ "version": 1, "sections": 5, "createdAt": "..." }]`

### GET /resumes/popular-skills
인기 기술 스택. **공개**

**Response:** `[{ "name": "react", "count": 15 }]`

### GET /resumes/analytics/:resumeId
이력서 분석 통계. **인증 필요**

---

## AI / LLM 변환

모든 변환 엔드포인트는 `/api/resumes/:resumeId/transform` 하위에 위치합니다.

### POST /resumes/:resumeId/transform
LLM 양식 변환. **인증 필요** | Rate: 5 req/min

**Request:**
```json
{
  "templateType": "standard",
  "provider": "gemini",
  "customPrompt": "선택 사항"
}
```

templateType 옵션: `standard`, `career-description`, `cover-letter`, `linkedin`, `english`, `developer`, `designer`, `custom`

### POST /resumes/:resumeId/transform/stream
LLM 양식 변환 (SSE 스트리밍). **인증 필요** | Rate: 5 req/min

SSE 이벤트 형식: `{ "type": "chunk|complete|error", "content": "...", "message": "..." }`

### POST /resumes/:resumeId/transform/feedback
AI 이력서 피드백. **인증 필요** | Rate: 3 req/min

**Request:** `{ "provider": "gemini" }` (provider 선택 사항)

**Response:**
```json
{
  "score": 78,
  "grade": "B+",
  "strengths": ["경력 서술이 구체적", "기술 스택 풍부"],
  "improvements": ["자기소개 보완 필요"],
  "sectionAnalysis": { "experience": { "score": 85, "feedback": "..." } }
}
```

### POST /resumes/:resumeId/transform/job-match
JD 매칭 분석. **인증 필요** | Rate: 3 req/min

**Request:** `{ "jobDescription": "채용공고 전문...", "provider": "gemini" }`

**Response:**
```json
{
  "matchRate": 72,
  "matchedSkills": ["React", "TypeScript"],
  "missingSkills": ["Kubernetes"],
  "suggestions": ["클라우드 경험 추가 권장"]
}
```

### POST /resumes/:resumeId/transform/interview
AI 면접 질문 생성. **인증 필요** | Rate: 3 req/min

**Request:** `{ "jobRole": "프론트엔드 개발자", "provider": "gemini" }`

**Response:**
```json
{
  "questions": [
    { "question": "React에서 상태 관리 전략은?", "sampleAnswer": "...", "category": "기술", "difficulty": "중" }
  ]
}
```

### GET /resumes/:resumeId/transform/history
변환 이력 목록. **인증 필요**

### GET /resumes/:resumeId/transform/providers
사용 가능한 LLM 프로바이더 목록. **인증 필요**

**Response:** `[{ "id": "gemini", "name": "Google Gemini", "free": true }, ...]`

### GET /resumes/:resumeId/transform/usage
AI 변환 사용량 통계. **인증 필요**

---

## AI 자동 생성

### POST /auto-generate/preview
비정형 텍스트로 이력서 미리보기 (저장 안 함). **인증 필요** | Rate: 5 req/min

**Request:**
```json
{
  "rawText": "홍길동, 프론트엔드 개발자 3년차...",
  "instruction": "개발자 이력서로 변환해주세요"
}
```

### POST /auto-generate/create
비정형 텍스트로 이력서 자동 생성 + DB 저장. **인증 필요** | Rate: 5 req/min

**Response:**
```json
{
  "resume": { "id": "...", "title": "...", "sections": { ... } },
  "tokensUsed": 1500,
  "provider": "gemini",
  "model": "gemini-2.0-flash"
}
```

---

## 버전 관리 (Versions)

### GET /resumes/:resumeId/versions
이력서 버전 목록. **인증 필요**

### GET /resumes/:resumeId/versions/:versionId
특정 버전 상세. **인증 필요**

### POST /resumes/:resumeId/versions/:versionId/restore
특정 버전으로 복원. **인증 필요**

---

## 공유 (Share)

### POST /resumes/:resumeId/share
공유 링크 생성. **인증 필요** (소유자만)

**Request:**
```json
{
  "expiresInHours": 48,
  "password": "optional-password"
}
```

### GET /resumes/:resumeId/share
이력서의 공유 링크 목록. **인증 필요**

### DELETE /share/:id
공유 링크 삭제. **인증 필요**

### GET /shared/:token
공유된 이력서 조회. **공개**

**Query:** `password` (비밀번호가 설정된 링크)

---

## 댓글 (Comments)

### GET /resumes/:resumeId/comments
이력서 댓글 목록. **공개**

**Response:**
```json
[{ "id": "...", "authorName": "취준생A", "content": "좋은 이력서네요", "createdAt": "..." }]
```

### POST /resumes/:resumeId/comments
댓글 작성. **인증 필요** | Rate: 5 req/min

**Request:** `{ "content": "의견 내용 (5-500자)", "authorName": "익명 (선택)" }`

### DELETE /resumes/:resumeId/comments/:commentId
댓글 삭제. **인증 필요** (작성자 또는 관리자)

---

## 북마크 (Bookmarks)

### GET /resumes/bookmarks/list
내 북마크 목록. **인증 필요**

### GET /resumes/:id/bookmark/status
북마크 여부 확인. **인증 필요**

**Response:** `{ "bookmarked": true }`

### POST /resumes/:id/bookmark
북마크 추가. **인증 필요**

### DELETE /resumes/:id/bookmark
북마크 해제. **인증 필요**

---

## 태그 (Tags)

### GET /tags
태그 목록. **인증 필요**

### POST /tags
태그 생성. **인증 필요**

**Request:** `{ "name": "프론트엔드", "color": "#3B82F6" }`

### DELETE /tags/:id
태그 삭제. **인증 필요** (소유자 또는 관리자)

### POST /tags/:tagId/resumes/:resumeId
이력서에 태그 추가. **인증 필요**

### DELETE /tags/:tagId/resumes/:resumeId
이력서에서 태그 제거. **인증 필요**

---

## 첨부파일 (Attachments)

### POST /resumes/:resumeId/attachments
파일 업로드. **인증 필요** (multipart/form-data)

**Form fields:** `file` (파일), `category` (카테고리), `description` (설명)

### GET /resumes/:resumeId/attachments
이력서 첨부파일 목록. **인증 필요**

### GET /attachments/:id/download
파일 다운로드. **인증 필요**

### DELETE /attachments/:id
파일 삭제. **인증 필요**

---

## 템플릿 (Templates)

### GET /templates
템플릿 목록 (5분 캐시). **인증 필요**

### GET /templates/public
공개 템플릿 목록. **공개**

**Query:** `category` (카테고리 필터)

### GET /templates/:id
템플릿 상세. **인증 필요**

### POST /templates
템플릿 생성. **인증 필요**

### PUT /templates/:id
템플릿 수정. **인증 필요** (소유자 또는 관리자)

### DELETE /templates/:id
템플릿 삭제. **인증 필요** (소유자 또는 관리자)

### POST /templates/seed
기본 템플릿 시드 데이터 생성. **인증 필요**

### POST /templates/local-transform/:resumeId
로컬 변환 (LLM 불필요). **인증 필요**

**Request:** `{ "templateId": "uuid" }` 또는 `{ "preset": "developer" }`

### GET /templates/presets/list
로컬 변환 프리셋 목록. **인증 필요**

**Response:**
```json
[
  { "id": "standard", "name": "표준 이력서", "description": "전체 섹션을 기본 순서로 표시" },
  { "id": "developer", "name": "개발자 이력서", "description": "기술 스택과 프로젝트를 우선 배치" },
  { "id": "career-focused", "name": "경력 중심", "description": "경력과 프로젝트를 강조" },
  { "id": "academic", "name": "학술/연구용", "description": "학력과 수상을 우선 배치" },
  { "id": "minimal", "name": "미니멀", "description": "핵심 정보만 간결하게" }
]
```

---

## 자기소개서 (Cover Letters)

### GET /cover-letters
내 자소서 목록. **인증 필요**

### GET /cover-letters/:id
자소서 상세. **인증 필요**

### POST /cover-letters
자소서 저장. **인증 필요**

**Request:**
```json
{
  "resumeId": "uuid",
  "company": "네이버",
  "position": "프론트엔드 개발자",
  "tone": "formal",
  "jobDescription": "채용공고...",
  "content": "자소서 본문..."
}
```

### PUT /cover-letters/:id
자소서 수정. **인증 필요**

### DELETE /cover-letters/:id
자소서 삭제. **인증 필요**

### GET /cover-letters/resume/:resumeId
이력서별 자소서 목록. **인증 필요**

---

## 채용 공고 (Jobs)

### GET /jobs
채용 공고 목록. **공개**

**Query:** `q` (검색어), `status` (active/closed, 기본 active)

### GET /jobs/my
내 채용 공고. **인증 필요**

### GET /jobs/:id
채용 공고 상세. **공개**

### POST /jobs
채용 공고 등록. **인증 필요** (리크루터/기업)

**Request:**
```json
{
  "company": "네이버",
  "position": "프론트엔드 개발자",
  "location": "성남",
  "salary": "5000만",
  "skills": "React,TypeScript",
  "description": "상세 설명...",
  "type": "fulltime"
}
```

type 옵션: `fulltime`, `contract`, `parttime`, `intern`

### PUT /jobs/:id
채용 공고 수정. **인증 필요** (소유자)

### DELETE /jobs/:id
채용 공고 삭제. **인증 필요** (소유자 또는 관리자)

---

## 지원 관리 (Applications)

### GET /applications
지원 내역 목록. **인증 필요**

### GET /applications/stats
지원 통계 (상태별). **인증 필요**

### POST /applications
지원 내역 추가. **인증 필요**

**Request:**
```json
{
  "company": "네이버",
  "position": "프론트엔드",
  "url": "https://...",
  "status": "applied"
}
```

status 옵션: `applied`, `screening`, `interview`, `offer`, `rejected`

### PUT /applications/:id
지원 내역 수정 (상태 변경 등). **인증 필요**

### DELETE /applications/:id
지원 내역 삭제. **인증 필요**

### GET /applications/:id/comments
지원 내역 댓글 목록 (공개 지원만). **공개**

### POST /applications/:id/comments
지원 내역에 댓글 작성. **인증 필요** | Rate: 5 req/min

**Request:** `{ "content": "조언 내용" }`

---

## 소셜 / 네트워킹 (Social)

### POST /social/follow/:userId
팔로우. **인증 필요** | Rate: 10 req/min

### DELETE /social/follow/:userId
언팔로우. **인증 필요**

### GET /social/followers
내 팔로워 목록. **인증 필요**

### GET /social/following
내 팔로잉 목록. **인증 필요**

### POST /social/scout
스카우트 메시지 전송. **인증 필요** | Rate: 10 req/min

**Request:**
```json
{
  "receiverId": "uuid",
  "resumeId": "uuid (선택)",
  "company": "네이버",
  "position": "개발자",
  "message": "스카우트 내용..."
}
```

### GET /social/scouts
받은 스카우트 목록. **인증 필요**

### POST /social/scouts/:id/read
스카우트 읽음 처리. **인증 필요**

### GET /social/messages
대화 목록. **인증 필요**

### GET /social/messages/unread/count
읽지 않은 쪽지 수. **인증 필요**

**Response:** `{ "count": 3 }`

### GET /social/messages/:partnerId
대화 내용. **인증 필요**

### POST /social/messages/:receiverId
쪽지 보내기. **인증 필요** | Rate: 10 req/min

**Request:** `{ "content": "메시지 내용" }`

---

## 알림 (Notifications)

### GET /notifications
전체 알림 목록 (최근 50개). **인증 필요**

### GET /notifications/unread
읽지 않은 알림 (최근 20개). **인증 필요**

### GET /notifications/count
읽지 않은 알림 수. **인증 필요**

**Response:** `{ "count": 3 }`

### POST /notifications/read-all
모든 알림 읽음 처리. **인증 필요**

### POST /notifications/:id/read
특정 알림 읽음 처리. **인증 필요**

### DELETE /notifications/cleanup
30일 이상 지난 읽은 알림 삭제. **관리자 전용** (superadmin)

---

## 헬스체크 / 통계 (Health)

### GET /health
서버 상태 확인 (간단). **공개** (10초 캐시)

**Response:** `{ "status": "ok", "timestamp": "...", "version": "2.0.0" }`

### GET /health/detailed
서버 상태 상세. **공개** (10초 캐시)

**Response:**
```json
{
  "status": "ok",
  "version": "2.0.0",
  "environment": "production",
  "uptime": 3600,
  "database": "ok",
  "storage": "cloudinary",
  "memory": { "rss": 120, "heapUsed": 80 },
  "stats": { "resumes": 100, "users": 50 },
  "providers": { "google": true, "github": true, "kakao": false }
}
```

### GET /health/stats
공개 사이트 통계. **공개** (60초 캐시)

**Response:**
```json
{
  "users": { "total": 50 },
  "resumes": { "total": 100 },
  "activity": { "totalViews": 1500 },
  "content": { "templates": 26 }
}
```

### GET /health/usage
내 사용량 조회. **인증 필요**

---

## 관리자 (Admin)

### GET /auth/admin/users
전체 사용자 목록. **관리자 전용** (admin/superadmin)

**Query:** `search` (이름/이메일 검색)

### POST /auth/admin/users/:userId/role
사용자 역할 변경. **관리자 전용**

**Request:** `{ "role": "admin" }`

### GET /health/admin/stats
사이트 전체 통계. **관리자 전용** (30초 캐시)

**Response:**
```json
{
  "users": { "total": 50, "today": 2, "week": 8, "month": 20 },
  "resumes": { "total": 100, "today": 5, "week": 15, "public": 60 },
  "content": { "templates": 26, "tags": 12, "comments": 50, "versions": 200 },
  "activity": { "applications": 80, "transforms": 30, "totalViews": 1500 }
}
```

---

## Rate Limits

전역 Rate Limit은 NestJS Throttler로 관리됩니다. 특정 엔드포인트에는 추가 제한이 적용됩니다.

| 엔드포인트 | 제한 | 윈도우 |
|-----------|------|--------|
| AI 변환 (transform) | 5 req | 60초 |
| AI 피드백/JD매칭/면접 | 3 req | 60초 |
| AI 자동 생성 | 5 req | 60초 |
| 댓글 작성 | 5 req | 60초 |
| 팔로우/스카우트/쪽지 | 10 req | 60초 |

Rate Limit 초과 시 `429 Too Many Requests` 응답이 반환됩니다.

---

## 공통 응답 형식

### 에러 응답

```json
{
  "statusCode": 401,
  "message": "로그인이 필요합니다",
  "error": "Unauthorized"
}
```

### 인증 실패: `401 Unauthorized`
### 권한 부족: `403 Forbidden`
### 리소스 없음: `404 Not Found`
### Rate Limit: `429 Too Many Requests`
### 서버 에러: `500 Internal Server Error`
