# entities Layer

비즈니스 엔티티 레이어. 도메인 핵심 개념을 표현합니다.

## 무엇이 여기 속하는가

엔티티 단위 폴더로 구성. 각 엔티티는 다음을 포함할 수 있습니다:

- `model/`: 타입 정의, 상태 관리 (store, hooks)
- `api/`: 해당 엔티티를 조회/수정하는 API 클라이언트
- `ui/`: 엔티티를 단순 렌더링하는 **"dumb" 컴포넌트** (예: `ResumeCard`, `UserAvatar`)
- `lib/`: 엔티티 전용 헬퍼

## 이 프로젝트의 예상 엔티티

- `resume/`: 이력서 타입, 상태, 카드 UI
- `user/`: 사용자 프로필, 인증 상태
- `job/`: 채용 공고
- `post/`: 커뮤니티 글
- `company/`: 기업 정보

## Import 규칙

- `entities`는 `shared`만 import 가능
- 같은 레이어 간 cross-import 금지 (예: `resume`가 `user`를 import 하지 말 것)
  - 필요 시 `features` 레이어에서 조합
- 상위 레이어(`features`, `pages`, `app`)에서 자유롭게 import

## 마이그레이션 계획

- `src/types/resume.ts` 등 → `src/entities/resume/model/types.ts`
- `src/components/ResumeCard.tsx` → `src/entities/resume/ui/ResumeCard.tsx`
- `src/lib/api.ts`의 엔티티별 메서드 → `src/entities/*/api/*.ts`로 분해

현재는 기존 경로를 유지하고, 신규 엔티티 코드부터 이 구조를 적용합니다.
