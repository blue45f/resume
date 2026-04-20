# `packages/client/src/lib/` — Korean Resume Analysis Modules

클라이언트 전용 한국어 이력서·자소서 분석 라이브러리. 원래 `koreanChecker.ts` 단일 6289줄 파일이었으나, 2026-04-20 도메인 응집 단위로 **25개 서브 모듈**로 분할했습니다.

> 모든 public API 는 `koreanChecker.ts` 에서 re-export 됩니다 — 호출부 import 경로 변경 불필요: `import { ... } from '@/lib/koreanChecker'` 그대로 유지.

---

## 모듈 맵

### 🔤 문체 (Style)

| 모듈                      | 주요 export                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `informalLanguage.ts`     | `detectInformalLanguage` — 이모지/초성체/은어/구어체 감지                                                       |
| `languageRisks.ts`        | `detectCliches`, `detectJargon`, `detectExaggeration` — 상투구·자곤·과장                                        |
| `wordSuggestions.ts`      | `suggestVerbReplacements`, `suggestSynonyms`, `suggestSynonymsForOveruse` — 단어 리라이트 힌트                  |
| `readabilityAnalyzers.ts` | `analyzeReadability`, `analyzeLength`, `countSentencesByEnding` — 가독성·길이·종결어미                          |
| `sentenceStructure.ts`    | `analyzeSentenceEndings`, `analyzeSentenceStarts`, `analyzePassiveVoice` — 문장 단위 리듬·변주·능동성           |
| `toneAnalyzers.ts`        | `analyzeParagraphs`, `analyzeFirstPersonUsage`, `analyzeEnglishMix`, `analyzeSentiment` — 본문 톤·스타일        |
| `repetitionAnalyzers.ts`  | `analyzeLexicalDiversity`, `analyzeRedundancy`, `detectRepeatedPhrases`, `detectDuplicateSentences` — 반복·중복 |

### 📄 이력서 신호 (Resume Signals)

| 모듈                    | 주요 export                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `achievementSignals.ts` | `analyzeQuantification`, `analyzeActionVerbs`, `countAchievements` — 정량/액션동사/수상                                                          |
| `jdKeywords.ts`         | `extractKeywords`, `computeJDMatch`, `detectSkillMentions` — 키워드·JD·기술 스킬                                                                 |
| `softSkills.ts`         | `detectSoftSkills`, `detectAbbreviations` — 소프트 스킬·축약어                                                                                   |
| `experience.ts`         | `estimateExperienceYears`, `validateDateRanges` — 경력 기간 추정                                                                                 |
| `starPattern.ts`        | `analyzeStarPattern` — LinkedIn/원티드식 STAR 불릿 구조                                                                                          |
| `qualitySignals.ts`     | `detectUnquantifiedClaims`, `detectEmptyClaims`, `analyzeVerbTense`, `detectAllCapsOveruse` — 개별 문장 품질 결함                                |
| `resumeScoring.ts`      | `detectMissingResumeSections`, `scoreResumeCompleteness`, `scoreSpecificity`, `estimateJobLevel`, `analyzeActivityChronology` — 이력서 구조·레벨 |

### 🧩 섹션 / 목록 구조 (Section / Bullet Structure)

| 모듈                  | 주요 export                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sectionAnalyzers.ts` | `splitByExperienceSection`, `analyzeSectionBalance`, `analyzeSectionOrder`, `analyzeSectionDensity`, `computeSectionHealth` — 섹션 분할·균형·순서·밀도·종합 |
| `bulletStructure.ts`  | `analyzeParallelism`, `analyzeBulletMarkerConsistency`, `analyzePunctuationBalance` — 목록·불릿·문장부호                                                    |
| `textFormat.ts`       | `analyzeBracketBalance`, `detectWhitespaceAnomalies` — 괄호·공백 위생                                                                                       |

### 🔢 포맷 (Format)

| 모듈               | 주요 export                                                              |
| ------------------ | ------------------------------------------------------------------------ |
| `dateAnalyzers.ts` | `analyzeDateConsistency` — 2023.01 / 2023-01-05 / 2023년 1월 혼재        |
| `numericFormat.ts` | `analyzeNumericFormat` — 1,000 / 1000 / 1천 혼재                         |
| `techCasing.ts`    | `detectInconsistentCasing` — JavaScript/javascript 같은 기술 용어 케이스 |

### 🔒 보안 / PII

| 모듈     | 주요 export                                                                     |
| -------- | ------------------------------------------------------------------------------- |
| `pii.ts` | `detectContactInfo`, `detectPersonalInfo` — 이메일/전화·주민번호/카드/주소/우편 |

### 📝 커버레터·생성기

| 모듈                    | 주요 export                                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `coverLetterHelpers.ts` | `recommendCoverLetterOpeners`, `detectSelfDeprecation`, `analyzeCallToAction` — 오프닝·자기비하·CTA                                            |
| `interviewQuestions.ts` | `generateInterviewQuestions` — 예상 면접 질문 생성                                                                                             |
| `resumeGenerators.ts`   | `generateResumeTldr`, `generateStarBulletTemplate`, `extractQuotableLines`, `computeTextSimilarity` — TLDR·STAR 템플릿·Quotable·Jaccard 유사도 |

### 📊 파생 점수·메타

| 모듈               | 주요 export                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `derivedScores.ts` | `scoreInterviewability`, `detectCareerGaps` — 면접 적합도·경력 공백                                                   |
| `metaUtils.ts`     | `estimateReadingTime`, `extractLinks`, `generateHashtags`, `countCharsByCategory` — 읽기 시간·링크·해시태그·문자 분포 |

### 🧠 허브 (koreanChecker.ts)

- **Core spell checker**: `checkText`, `checkKorean`, `autoFixText`, `autoFixResume`, `fixIssueInText`
- **Issue utilities**: `sortKoreanIssues`, `groupIssuesBySection`, `issuesBySeverity`, `hasKoreanErrors`, `dedupIssues`, `getTopWrongPatterns`, `compareKoreanResults`, `exportIssuesAsMarkdown`, `exportIssuesAsCsv`
- **Rule metadata**: `getRuleMetadata`, `validateRules`, `runSelfCheck`
- **Quality report 집계**: `generateQualityReport`, `exportQualityReportMarkdown`, `exportQualityReportJson`, `prioritizeImprovements`, `compareReports`, `applySafeAutoFix`, `explainWrongWord`, `gradeFromScore`, `getDimensionScores`
- **Full analysis 집계**: `analyzeEverything`, `summarizeAnalysis`, `calculateOverallHealth`, `quickScore`, `computeImprovementTips`
- **ANALYZERS 카탈로그** (82개 분석기 메타데이터), `getAnalyzersByCategory`, `findAnalyzerByName`

---

## 의존성 규칙

1. **단방향 그래프**: 서브 모듈 간 import 는 A→B→C 만 허용 (A↔B 순환 금지).
2. **koreanChecker 의존 금지**: 서브 모듈은 `koreanChecker.ts` 를 import 하지 않는다. 필요 시 자체 정의 또는 다른 서브 모듈에서 import.
3. **Cross-module 의존성 예시**:
   - `resumeScoring` → `pii`, `experience`, `achievementSignals`, `jdKeywords`
   - `derivedScores` → `resumeScoring`, `achievementSignals`, `experience`
   - `interviewQuestions` → `jdKeywords`, `resumeScoring`, `achievementSignals`
   - `coverLetterHelpers` → `jdKeywords`, `resumeScoring`
   - `resumeGenerators` → `jdKeywords`, `resumeScoring`, `softSkills`
   - `metaUtils` → `jdKeywords`
4. **허브만 aggregator**: `koreanChecker.ts` 는 25개 서브 모듈의 re-export 허브 + core 체커 역할.

## 확장 원칙

- 단일 파일 500줄 초과하면 도메인 단위 분리 검토
- 새 분석기는 기존 서브 모듈 중 응집도 높은 곳에 추가하거나 새 서브 모듈 생성
- 메타데이터는 반드시 `koreanChecker.ts` 의 `ANALYZERS` 카탈로그에 등록
- public API 는 항상 `koreanChecker.ts` 에서 re-export (호출부 경로 유지)
- 테스트: 각 서브 모듈은 pure 함수 중심 → unit test 는 `packages/server/**/*.spec.ts` 와 별개로 향후 `packages/client/**/*.spec.ts` 증설 대상

## 검증

- 타입체크: `pnpm exec tsc -b --noEmit` → 0 errors
- 테스트: `pnpm test` → 76 suites · 1228 tests green
- 빌드: `pnpm build:client` 정상
- 배포: Cloud Run resume-api / Vercel resume-gongbang 정상

## 히스토리

- **2026-04-19 이전**: `koreanChecker.ts` 단일 파일 6289줄
- **2026-04-20**: 25개 서브 모듈로 분할, `koreanChecker.ts` 는 2882줄로 축소 (54% 감량)

상세 결정 사항은 `MIGRATION.md §7` 참고.
