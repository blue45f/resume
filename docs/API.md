# API 문서

> Base URL: `/api`
> 인증: Bearer 토큰 또는 httpOnly 쿠키

## 인증

### POST /auth/register
이메일 회원가입

**Request:**
```json
{ "email": "user@example.com", "password": "12345678", "name": "홍길동" }
```

**Response:** `{ "token": "jwt..." }`

### POST /auth/login
이메일 로그인

**Request:** `{ "email": "user@example.com", "password": "12345678" }`
**Response:** `{ "token": "jwt..." }`

### GET /auth/providers
사용 가능한 소셜 로그인 목록

**Response:** `["google", "github"]`

### GET /auth/me
현재 로그인 사용자 정보

**Response:** `{ "id": "...", "email": "...", "name": "...", "provider": "local" }`

### POST /auth/change-password
비밀번호 변경 (로그인 필요)

**Request:** `{ "currentPassword": "old", "newPassword": "new12345" }`

### DELETE /auth/account
계정 삭제 (로그인 필요, cascade 삭제)

### POST /auth/logout
로그아웃 (쿠키 삭제)

## 이력서

### GET /resumes
내 이력서 목록 (paginated)

**Query:** `page`, `limit`, `public=true`
**Response:** `{ "data": [...], "total": 10, "page": 1, "totalPages": 1 }`

### POST /resumes
이력서 생성

### GET /resumes/:id
이력서 상세 (9개 섹션 포함)

### PUT /resumes/:id
이력서 수정

### DELETE /resumes/:id
이력서 삭제

### POST /resumes/:id/duplicate
이력서 복제

### GET /resumes/:id/export/text
텍스트 형식 다운로드

### GET /resumes/:id/export/markdown
마크다운 형식 다운로드

## 분석

### GET /resumes/dashboard/analytics
사용자 대시보드 분석

### GET /resumes/trend/:resumeId
이력서 변경 추이 (버전별 섹션 수)

**Response:** `[{ "version": 1, "sections": 5, "createdAt": "..." }]`

### GET /resumes/popular-skills
공개 이력서 기반 인기 기술 스택

**Response:** `[{ "name": "react", "count": 15 }, { "name": "typescript", "count": 12 }]`

## AI 변환

### POST /resumes/:id/transform
LLM 양식 변환

**Request:** `{ "templateType": "standard", "provider": "gemini" }`

### POST /resumes/:id/transform/stream
스트리밍 변환 (SSE)

### POST /resumes/:id/transform/feedback
AI 이력서 피드백

### POST /resumes/:id/transform/job-match
JD 매칭 분석

**Request:** `{ "jobDescription": "..." }`

### POST /resumes/:id/transform/interview
면접 질문 생성

## 지원 관리

### GET /applications
지원 목록

### GET /applications/stats
상태별 통계

### POST /applications
지원 추가

**Request:** `{ "company": "네이버", "position": "프론트엔드", "url": "...", "status": "applied" }`

### PUT /applications/:id
지원 수정

### DELETE /applications/:id
지원 삭제

## 공유

### POST /resumes/:id/share
공유 링크 생성

**Request:** `{ "expiresInHours": 48, "password": "optional" }`

### GET /shared/:token
공유 이력서 조회

## 댓글

### GET /resumes/:resumeId/comments
이력서 댓글 목록 (공개 이력서만)

**Response:** `[{ "id": "...", "authorName": "취준생A", "content": "좋은 이력서네요", "createdAt": "..." }]`

### POST /resumes/:resumeId/comments
댓글 작성 (로그인 필요)

**Request:** `{ "content": "의견 내용 (5-500자)" }`

### DELETE /resumes/:resumeId/comments/:commentId
댓글 삭제 (작성자만)

## 북마크

### POST /resumes/:id/bookmark
북마크 추가 (로그인 필요)

### DELETE /resumes/:id/bookmark
북마크 해제

### GET /resumes/bookmarks/list
내 북마크 목록

## 관리자

### GET /auth/admin/users
전체 사용자 목록 (관리자 전용)

**Response:** `[{ "id": "...", "name": "...", "email": "...", "provider": "...", "role": "user", "createdAt": "..." }]`

### POST /auth/admin/users/:userId/role
사용자 역할 변경 (관리자 전용)

**Request:** `{ "role": "admin" }`  
**Response:** `{ "success": true, "userId": "...", "role": "admin" }`

### GET /health/admin/stats
사이트 전체 통계

**Response:**
```json
{
  "users": { "total": 10, "today": 1, "week": 3, "month": 8 },
  "resumes": { "total": 25, "today": 2, "week": 5, "public": 16 },
  "content": { "templates": 26, "tags": 8, "comments": 15, "versions": 50 },
  "activity": { "applications": 30, "transforms": 12, "totalViews": 1500 }
}
```

## 알림

### GET /notifications
전체 알림 목록 (최근 50개)

### GET /notifications/unread
읽지 않은 알림 (최근 20개)

### GET /notifications/count
읽지 않은 알림 수

**Response:** `{ "count": 3 }`

### POST /notifications/read-all
모든 알림을 읽음 처리

### POST /notifications/:id/read
특정 알림을 읽음 처리

### DELETE /notifications/cleanup
30일 이상 지난 읽은 알림 삭제 (관리자 전용)

## 지원 댓글

### GET /applications/:id/comments
공개 지원의 댓글 목록

### POST /applications/:id/comments
지원에 댓글 작성 (로그인 필요)

**Request:** `{ "content": "조언 내용 (5자 이상)" }`

## 헬스체크

### GET /health
서버 상태 (DB, 메모리, 버전, OAuth 프로바이더 상태)
