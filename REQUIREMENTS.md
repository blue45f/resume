# 이력서 플랫폼 고도화 요구사항

## 최종 기술 스택 (확정)

| 영역 | 기술 | 비고 |
|------|------|------|
| DB | SQLite + **Prisma ORM** | 정규화된 스키마, 마이그레이션, PostgreSQL 전환 용이 |
| 서버 | **NestJS** + SWC | 모듈/DI, SSE, Swagger, DTO 검증 |
| LLM | **Anthropic Claude API** | 한국어 우수, Streaming, Structured Output |
| 클라이언트 | React 19 + Vite 8 + Tailwind 4 | **PC/모바일 반응형** UI/UX |
| 검증 | class-validator + class-transformer | DTO 기반 입력 검증 |

---

## 요구사항 1: DB 고도화

### 선정: SQLite + Prisma ORM

- **Prisma 선정 이유**: NestJS와 최고의 통합, 스키마 퍼스트 설계, 자동 마이그레이션, 타입 안전한 Client 생성
- JSON 컬럼 → 정규화된 테이블 분리 (1:N, M:N 관계 모델링)
- `prisma migrate`로 스키마 변경 이력 관리
- SQLite로 로컬 개발, Prisma의 provider만 변경하면 PostgreSQL 전환 가능

### 정규화된 스키마 설계

```
resumes ──1:1── personal_info
        ──1:N── experiences
        ──1:N── educations
        ──1:N── skills
        ──1:N── projects
        ──M:N── tags (via tags_on_resumes)
        ──1:N── resume_versions
        ──1:N── share_links
        ──1:N── llm_transformations

templates (독립 테이블 - LLM 프롬프트 템플릿)
```

---

## 요구사항 2: 서버 프레임워크 → NestJS

### 모듈 구조

```
server/
  main.ts
  app.module.ts
  prisma/          → PrismaModule (DB 연결)
  resumes/         → ResumesModule (이력서 CRUD)
  llm/             → LlmModule (LLM 양식 변환 - 핵심)
  templates/       → TemplatesModule (테마/양식 관리)
  versions/        → VersionsModule (버전 관리)
  tags/            → TagsModule (태그 시스템)
  share/           → ShareModule (공유 링크)
```

---

## 요구사항 3: LLM 기반 이력서 양식 변환 (핵심 서비스)

> **본 서비스의 핵심 차별점.** 이력서 데이터를 한 번 입력하면 LLM이 원하는 양식으로 변환한다.

### 핵심 기능

- **양식 변환**: 일반 이력서, 경력기술서, 자기소개서, LinkedIn, 영문 이력서 등
- **JD 맞춤 최적화**: Job Description 입력 시 경험/스킬 강조점 자동 조정, ATS 키워드
- **다국어 변환**: 한국어 ↔ 영어, 각 언어권 관례에 맞는 구조 조정
- **실시간 스트리밍**: SSE 기반 변환 결과 실시간 미리보기
- **변환 이력**: 원본 ↔ 변환본 매핑, 토큰 사용량 추적

---

## 요구사항 4: 이력서 테마/형식 선택

- 여러 가지 시각적 테마 제공 (모던, 클래식, 미니멀, 크리에이티브 등)
- 테마 미리보기 후 선택
- LLM 변환 결과에도 테마 적용 가능
- 사용자 커스텀 테마 저장

---

## 요구사항 5: 반응형 UI/UX

- PC/모바일 모두 자연스러운 레이아웃
- 모바일: 터치 친화적, 탭 네비게이션, 풀스크린 편집
- PC: 사이드바 미리보기, 넓은 편집 영역
- Tailwind responsive utilities 활용 (`sm:`, `md:`, `lg:`)

---

## 요구사항 6: 부가 기능

- **PDF 내보내기**: 테마별 A4 레이아웃, 브라우저 인쇄 연동
- **버전 관리**: 수정 시 자동 스냅샷, 버전 복원
- **태그/분류**: `#프론트엔드`, `#네이버` 등 태그 기반 필터링
- **공유 링크**: 고유 URL, 만료 시간, 비밀번호 보호
- **대시보드**: 이력서 목록, LLM 사용량, 지원 현황 트래커

---

## 우선순위

| 순위 | 항목 |
|------|------|
| P0 | DB 고도화 (Prisma + 정규화) |
| P0 | NestJS 서버 구축 |
| P0 | LLM 양식 변환 (핵심) |
| P0 | 반응형 UI/UX |
| P1 | 이력서 테마/형식 선택 |
| P1 | PDF 내보내기 |
| P2 | 버전 관리, 태그/분류 |
| P3 | 공유 링크, 대시보드 |
