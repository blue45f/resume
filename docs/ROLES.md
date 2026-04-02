# 역할 및 권한 체계

## 역할 계층

```
superadmin (최고 관리자)
  └── admin (관리자)
       └── user (일반 사용자)
```

| 역할 | 설명 | 기본 할당 |
|------|------|----------|
| `superadmin` | 시스템 전체 관리 권한 | blue45f |
| `admin` | 콘텐츠 관리 권한 | superadmin이 지정 |
| `user` | 일반 사용자 | 회원가입 시 기본값 |

## 권한 매트릭스

### 시스템 관리

| 기능 | superadmin | admin | user |
|------|:---:|:---:|:---:|
| 사용자 역할 변경 | ✅ | ❌ | ❌ |
| 요금제 설정 변경 | ✅ | ❌ | ❌ |
| 알림 일괄 정리 | ✅ | ❌ | ❌ |
| 사이트 통계 조회 | ✅ | ✅ | ❌ |
| 사용자 목록 조회 | ✅ | ✅ | ❌ |

### 콘텐츠 관리

| 기능 | superadmin | admin | user |
|------|:---:|:---:|:---:|
| 모든 이력서 삭제 | ✅ | ✅ | ❌ |
| 이력서 공개→비공개 전환 | ✅ | ✅ | 본인만 |
| 모든 댓글 삭제 | ✅ | ✅ | 본인만 |
| 템플릿 수정/삭제 | ✅ | ✅ | 본인만 |
| 태그 삭제 | ✅ | ✅ | 본인만 |

### 일반 기능

| 기능 | superadmin | admin | user |
|------|:---:|:---:|:---:|
| 이력서 CRUD | ✅ | ✅ | ✅ |
| AI 변환/분석 | ✅ | ✅ | 플랜 제한 |
| 자소서 생성 | ✅ | ✅ | Pro+ |
| 이력서 번역 | ✅ | ✅ | Pro+ |
| 지원 관리 | ✅ | ✅ | ✅ |
| 댓글/북마크 | ✅ | ✅ | ✅ |
| 팔로우/쪽지 | ✅ | ✅ | ✅ |
| 스카우트 전송 | ✅ | ✅ | ✅ |
| 설정/비번 변경 | ✅ | ✅ | ✅ |
| 계정 삭제 | ✅ | ✅ | ✅ |

## 구독 플랜별 기능 제한

| 기능 | Free | Pro (₩9,900/월) | Enterprise (₩29,900/월) |
|------|:---:|:---:|:---:|
| 이력서 수 | 3개 | 무제한 | 무제한 |
| AI 변환 | 월 5회 | 무제한 | 무제한 |
| 테마 | 3종 | 15종 | 15종 |
| 내보내기 | TXT | TXT, MD | TXT, MD |
| ATS 검사 | ✅ | ✅ | ✅ |
| AI 코칭 | ❌ | ✅ | ✅ |
| 자소서 생성 | ❌ | ✅ | ✅ |
| 다국어 번역 | ❌ | ✅ | ✅ |
| 지원 관리 | ✅ | ✅ | ✅ |
| 우선 지원 | ❌ | ✅ | ✅ |
| 팀 멤버 | 1명 | 1명 | 10명 |

## API 엔드포인트별 권한

### superadmin 전용
```
POST   /api/auth/admin/users/:userId/role   # 역할 변경
DELETE /api/notifications/cleanup            # 알림 정리
```

### admin 이상
```
GET    /api/auth/admin/users                 # 사용자 목록
GET    /api/health/admin/stats               # 사이트 통계
PATCH  /api/resumes/:id/visibility           # 타인 이력서 비공개 전환
DELETE /api/resumes/:id                      # 타인 이력서 삭제
DELETE /api/resumes/:id/comments/:commentId  # 타인 댓글 삭제
```

### 인증 사용자 (user 이상)
```
POST   /api/resumes                          # 이력서 생성 (플랜 제한)
POST   /api/resumes/:id/transform            # AI 변환 (사용량 제한)
POST   /api/cover-letters                    # 자소서 저장
POST   /api/applications                     # 지원 추가
POST   /api/social/follow/:userId            # 팔로우
POST   /api/social/messages/:receiverId      # 쪽지 전송
```

### 공개 (로그인 불필요)
```
GET    /api/resumes/public                   # 공개 이력서 검색
GET    /api/resumes/@:username/:slug         # 프로필 이력서
GET    /api/resumes/:id/comments             # 댓글 목록
GET    /api/resumes/popular-skills           # 인기 기술
GET    /api/health                           # 헬스체크
GET    /api/auth/providers                   # 로그인 프로바이더
```

## 역할 변경 방법

### DB 직접 변경
```sql
UPDATE users SET role = 'superadmin' WHERE name = 'blue45f';
```

### API로 변경 (superadmin 로그인 필요)
```bash
POST /api/auth/admin/users/:userId/role
Body: { "role": "admin" }
```

### 관리자 페이지
`/admin` → 사용자 관리 → 역할 토글 버튼

## 코드 참조

```typescript
// server/common/roles.ts
import { isAdmin, isSuperAdmin } from '../common/roles';

// 권한 체크 예시
if (isAdmin(req.user?.role)) {
  // admin + superadmin 모두 통과
}

if (isSuperAdmin(req.user?.role)) {
  // superadmin만 통과
}
```
