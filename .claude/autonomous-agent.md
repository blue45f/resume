# Resume Platform 자율 고도화 에이전트 지침

## 프로젝트 정보
- 스택: NestJS (백엔드) + Prisma (ORM) + React + TypeScript (프론트엔드)
- DB: PostgreSQL (Neon)
- 비교 벤치마크: Resume.io, Zety, Canva Resume, LiveCareer, Jobscan, Kickresume, LinkedIn

---

## 매 실행 절차

### STEP 1: 현황 파악
```bash
git log --oneline -30
```
최근 구현된 기능과 미구현 항목 파악

---

### STEP 2: 전체 기능 검증 (반드시 수행, 에러 발견 시 즉시 수정)

```bash
# TypeScript 타입 체크
cd frontend && npx tsc --noEmit 2>&1 | head -30
cd ../backend && npx tsc --noEmit 2>&1 | head -30

# 빌드 검증
cd backend && npm run build 2>&1 | tail -15
cd ../frontend && npm run build 2>&1 | tail -15

# 테스트 실행
cd backend && npm test -- --passWithNoTests 2>&1 | tail -30
cd ../frontend && npm test -- --watchAll=false --passWithNoTests 2>&1 | tail -30

# Prisma 스키마 검증
cd backend && npx prisma validate
```

발견된 모든 타입 에러, 빌드 에러, 테스트 실패를 수정한 후 다음 단계 진행.

---

### STEP 3: 기능 고도화 (우선순위 순으로 미구현 항목 1~2개 선택)

#### [P1] 배너 시스템 *(미구현 시 최우선)*
- **프론트**: 메인 페이지 슬라이드 배너 (자동재생, 네비게이션 dots, 터치 스와이프)
- **어드민**: 배너 목록/생성/수정/삭제, 드래그로 순서 변경, 활성화 토글, 노출 기간 설정
- **Prisma 모델**:
  ```prisma
  model Banner {
    id        String    @id @default(uuid())
    title     String
    subtitle  String    @default("")
    imageUrl  String    @default("") @map("image_url")
    linkUrl   String    @default("") @map("link_url")
    isActive  Boolean   @default(true) @map("is_active")
    order     Int       @default(0)
    startAt   DateTime? @map("start_at")
    endAt     DateTime? @map("end_at")
    createdAt DateTime  @default(now()) @map("created_at")
    updatedAt DateTime  @updatedAt @map("updated_at")
    @@map("banners")
  }
  ```
- **API**: `GET /banners`, `GET /banners/active`, `POST /banners` (admin), `PATCH /banners/:id` (admin), `DELETE /banners/:id` (admin)

#### [P2] 공지사항 시스템 *(미구현 시)*
- **프론트**: 공지사항 목록 (페이지네이션, 유형 필터), 상세 페이지, 메인 팝업 (쿠키로 오늘 하루 안보기)
- **어드민**: 공지 CRUD, 유형/팝업/고정 설정
- **Prisma 모델**:
  ```prisma
  model Notice {
    id        String    @id @default(uuid())
    title     String
    content   String
    type      String    @default("GENERAL") // GENERAL, MAINTENANCE, EVENT
    isPopup   Boolean   @default(false) @map("is_popup")
    isPinned  Boolean   @default(false) @map("is_pinned")
    startAt   DateTime? @map("start_at")
    endAt     DateTime? @map("end_at")
    createdAt DateTime  @default(now()) @map("created_at")
    updatedAt DateTime  @updatedAt @map("updated_at")
    @@map("notices")
  }
  ```
- **API**: `GET /notices`, `GET /notices/popup`, `GET /notices/:id`, `POST /notices` (admin), `PATCH /notices/:id` (admin), `DELETE /notices/:id` (admin)

#### [P3] 어드민 대시보드 고도화
- 통계 위젯: 총 유저수, 오늘 가입, 총 이력서수, 오늘 생성, 일간 활성 유저, 유료 플랜 수
- 유저 관리: 목록(검색/필터), 역할 변경(user/admin), 플랜 변경, 계정 정지/복구
- 이력서 관리: 공개 이력서 목록, 추천 이력서 설정, 신고된 이력서 처리
- 시스템 설정: 사이트명, 기능 ON/OFF 토글, 점검 모드
- 어드민 사이드바: 대시보드/유저/이력서/배너/공지/채용공고/설정 메뉴

#### [P4] 기업 회원/리크루터 기능
- 기업 프로필 페이지 (회사명, 로고, 소개, 업종, 규모)
- 채용공고 CRUD (포지션/급여/위치/요건/혜택/마감일)
- 리크루터 이력서 검색 (스킬/경력/위치/학력 필터링)
- 지원자 관리 보드 (칸반 스타일: 서류검토/면접/최종/합격/불합격)
- 스카우트 메시지 시스템 (읽음 확인, 답장)
- 기업 인증 배지
- 리크루터 플랜 및 이용권
- 리크루터 대시보드 (공고별 지원자 수, 조회수, 스카우트 발송 수)

#### [P5] UI/UX 고도화
- 이력서 작성 진행률 바 (섹션별 채움 정도 계산, 상단 고정)
- 자동저장 인디케이터 ("마지막 저장: 방금 전")
- 스켈레톤 로딩 (모든 목록/카드 컴포넌트)
- Empty State 컴포넌트 (CTA 버튼 포함, 일러스트)
- 모바일 반응형 전수 점검 (375px, 768px, 1024px)
- 인라인 폼 유효성 검사 에러 메시지
- 토스트 알림 시스템 통일
- 다크모드 지원 (CSS 변수 기반)
- 디자인 토큰 정의 (colors, spacing, typography CSS 변수)

#### [P6] ATS 점수 / 이력서 분석
- 이력서 완성도 점수 (0~100): 각 섹션 채움 정도 가중 합산
- ATS 호환성 체크리스트 (간단한 포맷, 표 미사용, 표준 섹션명)
- 누락 섹션 경고 및 추가 권유
- 직무기술서 붙여넣기 → 키워드 매칭 분석
- 개선 제안 리스트

#### [P7] 템플릿 시스템 고도화
- 시각적으로 구분되는 템플릿 3종 추가:
  - **Minimal**: 깔끔한 1단 레이아웃, 모노톤
  - **Modern**: 사이드바 2단, 컬러 포인트
  - **Executive**: 고급스러운 헤더, 타임라인 스타일
- 실시간 템플릿 전환 (저장 없이 미리보기)
- 컬러 테마 5종 선택
- 폰트 3종 선택 (기본/세리프/모던)

#### [P8] 추가 기능
- 이력서 복사/복제 기능
- 버전 히스토리 UI (타임라인, 미리보기, 복원)
- 공개 프로필 페이지 개선 (SEO 메타태그, 공유 OG 이미지)
- PDF 내보내기 품질 개선 (폰트 임베딩, 페이지 분할)
- 직종별 키워드 추천 (프론트엔드/백엔드/디자이너/마케터 등)
- 자기소개서 템플릿 3종 (공식체/창의적/간결체)

---

### STEP 4: 테스트 작성 및 검증

새로운 기능 구현 후:
```bash
# 새 서비스/컨트롤러 단위 테스트 작성 (Jest)
# 새 API 엔드포인트 통합 테스트 작성
cd backend && npm test -- --passWithNoTests 2>&1 | tail -30
```

기존 테스트 모두 통과 확인. 실패 시 수정.

---

### STEP 5: 커밋 및 푸시

```bash
git add -A
git commit -m "feat: [구현한 기능 요약] — 빌드+테스트 검증 완료"
git push origin main
```

버그 수정만 있었다면:
```bash
git commit -m "fix: [수정 내용] — 타입/빌드 오류 수정"
```

---

## 코드 품질 기준

- TypeScript strict 모드, 타입 에러 0개 목표
- 모든 API 엔드포인트 에러 핸들링 포함
- 한국어 UI 텍스트 (모든 버튼, 레이블, 메시지)
- 컴포넌트 재사용성 고려
- 빌드 성공 필수 (실패 시 원인 파악 후 수정)
- 모바일 반응형 (최소 375px 지원)
- 접근성 기본 준수 (aria-label, alt 텍스트)
