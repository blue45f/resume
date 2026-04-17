# features Layer

사용자 인터랙션(유저 시나리오) 레이어. "사용자가 무엇을 할 수 있는가"를 기술합니다.

## 무엇이 여기 속하는가

feature 단위 폴더로 구성. 각 feature는 단일 사용자 시나리오를 구현합니다:

- `model/`: feature 상태/훅 (예: `useLoginForm`)
- `api/`: feature가 호출하는 API (엔티티 API를 조합해도 됨)
- `ui/`: feature 전용 UI (예: `LoginForm`, `ResumeEditor`)
- `lib/`: feature 전용 헬퍼

## 이 프로젝트의 예상 feature

- `auth/`: 로그인, 회원가입, 로그아웃
- `resume-crud/`: 이력서 작성/수정/삭제
- `resume-export/`: PDF 내보내기
- `community-write/`: 커뮤니티 글쓰기
- `bookmark/`: 북마크 토글
- `follow/`: 팔로우/언팔로우
- `recent-views/`: 최근 본 이력서 추적 (이미 이동 완료)
- `ai-feedback/`: AI 피드백 요청

## Import 규칙

- `features`는 `entities`, `shared` import 가능
- 같은 레이어 간 cross-import 원칙 금지
- `pages`, `app`에서만 `features` import

## 마이그레이션 계획

`src/hooks/` 및 `src/components/`의 요소 중 **단일 시나리오**에 해당하는 것을
해당 feature 폴더로 이동:

- `useDraft.ts` → `features/resume-crud/model/useDraft.ts`
- `BookmarkButton.tsx` → `features/bookmark/ui/BookmarkButton.tsx`
- `FollowButton.tsx` → `features/follow/ui/FollowButton.tsx`

기존 파일은 유지하고 신규 feature부터 이 구조를 따릅니다.
