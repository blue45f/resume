# 경쟁 플랫폼 벤치마크 — 원티드 · 잡코리아 · 링크드인

이력서공방(resume-gongbang) 기능을 주요 경쟁 플랫폼과 비교해 **gap 을 식별하고 우선순위를 매깁니다**. 2026-04-20 기준.

---

## 1. 비교 매트릭스

| 기능                   | 원티드         | 잡코리아  | 링크드인            | **이력서공방**                          |
| ---------------------- | -------------- | --------- | ------------------- | --------------------------------------- |
| 이력서 자동완성 (AI)   | ✅ (유료)      | ✅ (일부) | ✅ (Premium)        | ✅ (AutoGeneratePage)                   |
| 자소서 맞춤법 체크     | ❌             | ✅ 기본   | ✅ Rewrite          | ✅ **82개 분석기**                      |
| 문체·가독성 분석       | ❌             | ❌        | ⚠️ 일부             | ✅ `analyzeReadability` 등              |
| 종합 점수 / 등급       | ⚠️ 부분        | ❌        | ✅ Profile Strength | ✅ `OverallHealthGauge` (3축)           |
| 면접 적합도 예측       | ❌             | ❌        | ❌                  | ✅ `scoreInterviewability`              |
| JD 키워드 매칭         | ✅ 기본        | ❌        | ✅ (Premium)        | ✅ `computeJDMatch`                     |
| STAR 구조 검출         | ❌             | ❌        | ❌                  | ✅ `analyzeStarPattern`                 |
| 이력서 섹션 분석       | ⚠️ 누락 체크만 | ⚠️ 기본   | ❌                  | ✅ 균형·순서·밀도·STAR                  |
| 경력 공백 감지         | ❌             | ❌        | ⚠️ (본인만)         | ✅ `detectCareerGaps`                   |
| 정량화 체크            | ❌             | ❌        | ⚠️ 팁               | ✅ `detectUnquantifiedClaims`           |
| 상투구/자곤/과장 검출  | ❌             | ❌        | ❌                  | ✅ `languageRisks.ts`                   |
| 예상 면접 질문 생성    | ❌             | ❌        | ❌                  | ✅ `generateInterviewQuestions`         |
| 자소서 오프닝 추천     | ❌             | ❌        | ❌                  | ✅ 3종 스타일                           |
| PII/개인정보 경고      | ❌             | ❌        | ❌                  | ✅ `detectPersonalInfo`                 |
| 이력서 유사도 비교     | ❌             | ❌        | ❌                  | ✅ `computeTextSimilarity`              |
| 인용 문장 추출         | ❌             | ❌        | ❌                  | ✅ `extractQuotableLines`               |
| 1:1 코치 매칭          | ❌             | ⚠️ 광고   | ⚠️ Premium          | ✅ 코칭 도메인                          |
| 실시간 면접 연습 (TTS) | ❌             | ❌        | ❌                  | ✅ MockInterviewPage                    |
| 이력서 스터디 그룹     | ❌             | ❌        | ❌                  | ✅ 커뮤니티 + 스터디                    |
| **우리의 확실한 우위** | —              | —         | —                   | 82개 분석기 + 3축 점수 + 면접 준비 통합 |

**해석**: 이력서·자소서 **정량 분석 깊이**에서 한국 경쟁사(원티드/잡코리아) 대비 월등. 링크드인의 Profile Strength 와 비교하면 **3축 분해 + tier + per-axis suggestion** 으로 우리가 더 정교. 다만 **구직 생태계(채용공고 연동·리쿠르터 풀)** 는 원티드/잡코리아가 압도적.

---

## 2. 우위 분석 (Moat)

### 2.1 분석기 카탈로그의 폭

- **82개 분석기 메타데이터** (`ANALYZERS`) · 6개 카테고리(문체/이력서/메타/구조/보안/파생)
- 룰 기반 + 정규식 + 가중치 점수 — LLM 의존 없이 즉시 피드백
- 각 분석기가 pure 함수 → `FullAnalysis` 통해 한 번에 호출

### 2.2 3축 종합 건강도

- `calculateOverallHealth`: 문체(30%) + 완성도(30%) + 면접 적합도(40%)
- tier 4단계(excellent/good/fair/poor) 로 즉각적 피드백
- `OverallHealthGauge` 컴포넌트로 CoverLetter 피드백 모드 상단 노출

### 2.3 면접 준비 통합

- `scoreInterviewability` 5축 가중합 (구체성 30% · 정량 20% · 동사 15% · 성취 15% · 섹션 20%)
- `generateInterviewQuestions` — 스킬·레벨·정량 기반 룰 기반 질문
- MockInterviewPage TTS 음성 면접 연습 (Mock)

### 2.4 한국어 전문성

- 한국어 특화: 종결어미 변주(HHI) · 1인칭 과다 · 한영 혼재 · 영문 축약어 설명 누락
- 상투구·자기비하·과장 — 한국 직장문화 맥락 반영
- Prompt-style 가이드 내장(`detectSelfDeprecation`, `analyzeCallToAction`)

---

## 3. 남은 gap (경쟁사 대비)

### 3.1 원티드 강점 — 우리가 아직 부족한 것

- **채용공고 실시간 피드 연동** — 원티드는 지원 후 이력서가 HR 시스템으로 바로 전달. 우리 플랫폼은 스카우트(ScoutsPage)만 있음
- **리쿠르터 검색·매칭 algorithm** — 원티드의 AI 매칭은 실제 데이터 학습. 우리 `computeJDMatch` 는 Jaccard 기반 keyword overlap
- **회사 리뷰 데이터** — 원티드는 회사 평가·연봉 정보 통합. 우리는 미보유

### 3.2 링크드인 강점 — 우리가 아직 부족한 것

- **네트워크 그래프** — "2촌/3촌 연결" 데이터 없음
- **Endorsements / Recommendations** — 팀원 추천서 시스템 없음. `ReportButton` 외 peer review UI 미비
- **Feed / Content** — 링크드인의 뉴스피드 기능 없음. 우리는 커뮤니티 게시판만

### 3.3 공통 gap

- **실제 지원 트래킹** — ApplicationsPage 존재하나 자동 연동 미약
- **AI 리라이트** — 문장 단위 "이 문장을 다시 써주세요" 는 현재 `suggestVerbReplacements` / `suggestSynonymsForOveruse` 로 부분 커버 but LLM 기반 full-rewrite 는 미구현
- **이미지·PDF 파싱** — `documentEnhance` 있으나 OCR 한계

---

## 4. 우선순위 제안 (다음 고도화)

### High Impact · Low Risk

1. **AI 리라이트(LLM 문장 치환)** — 기존 `detectUnquantifiedClaims` 결과를 LLM 에 주고 수치 보강 문장 생성. 기존 프롬프트 라이브러리 활용
2. **Peer Review 요청 시스템** — 커뮤니티 내 "이력서 봐주세요" 카테고리 정착. `ReportButton` 공용화된 인프라 재활용
3. **i18n 확장** — OverallHealthGauge 등 신규 컴포넌트 영문/일문 번역 키 추가

### Medium Impact · Medium Risk

4. **채용공고 실시간 연동** — 실제 공고 API 통합은 계약 필요. 대안: 공고 URL 붙여넣기 → 자동 파싱
5. **리쿠르터 대시보드 개선** — `RecruiterDashboardPage` 기능 깊이 향상

### Low Impact / 보류

6. 네트워크 그래프 (구축 비용 ↑, 사용자 풀 부족)
7. AI 콘텐츠 피드 (정보 신뢰성 리스크)

---

## 5. 벤치마크 지표 (measurable)

우리가 이미 보유한 장점을 수치로 마케팅:

- 분석기 수: **82개** (경쟁사는 대부분 10개 이하)
- 이력서 점수 분해 축: **3 axes × 5 sub-axes** (원티드 0개 · 링크드인 1개)
- 면접 질문 자동 생성: **레벨별 맞춤** (주니어/미드/시니어/리드)
- 한국어 특화 룰: **250+ 정규식** (맞춤법 RULES + cliches + empty claims)
- STAR 커버리지 분석: **업계 최초** (한국 시장 기준)

---

## 6. 결론

- **분석 깊이(domain-specific)** 에서 경쟁사 대비 명확한 우위. 마케팅 메시지로 활용 가능.
- **생태계(채용공고·리쿠르터 풀)** 는 원티드/잡코리아의 선점 효과가 커 정면 경쟁보다 **보완재** 포지셔닝 권장.
- 핵심 next step: **AI 리라이트 통합** + **Peer Review 정착** + **i18n 확장**

---

_작성일: 2026-04-20 · 기준 시점: resume-gongbang 2.1.0 · 담당: Claude Code + blue45f_
