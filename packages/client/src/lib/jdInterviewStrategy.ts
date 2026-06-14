/**
 * JD 기반 면접 전략 추천 — 시니어리티·회사 유형·기술 스택 신호로
 * 예상 면접 형식·준비 우선순위·타임라인을 생성한다.
 */

export type InterviewFormat =
  | 'coding-challenge' // 온라인 코딩 테스트
  | 'live-coding' // 실시간 코딩 인터뷰
  | 'system-design' // 시스템 설계
  | 'behavioral' // 행동 면접 (STAR)
  | 'culture-fit' // 컬쳐핏 인터뷰
  | 'technical-deep' // 기술 심층 (아키텍처·디버깅)
  | 'portfolio-review' // 포트폴리오·프로젝트 리뷰
  | 'case-study' // 케이스 스터디 (PM/데이터)
  | 'take-home' // 과제 제출형

export interface PrepArea {
  area: string // Korean area name
  priority: 'high' | 'medium' | 'low'
  reason: string // Korean reasoning
  resources: string[] // Korean resource suggestions
}

export interface InterviewStrategyReport {
  /** Most likely interview formats in priority order. */
  formats: InterviewFormat[]
  /** Korean labels for formats. */
  formatLabels: InterviewFormat[]
  /** Recommended prep areas ordered by priority. */
  prepAreas: PrepArea[]
  /** Estimated prep timeline in weeks. */
  prepWeeks: number
  /** Korean summary of the strategy. */
  summary: string
  /** Korean one-liner label. */
  label: string
}

// ---------------------------------------------------------------------------
// Signal detection helpers (reuse patterns from jdSalaryBenchmark)
// ---------------------------------------------------------------------------

const SENIORITY_SIGNALS = {
  junior: /(?:신입|0\s*~?\s*[23]년|주니어|인턴|entry\s*level|junior)/i,
  senior: /(?:[567]\s*~?\s*\d+년|[5-9]년\s*이상|시니어|senior|sr\.)/i,
  lead: /(?:팀장|리드|principal|staff|lead\s*(?:engineer|developer))/i,
}

const COMPANY_SIGNALS = {
  bigtech: /(?:네이버|kakao|카카오|라인|당근|토스|쿠팡|coupang|배달의민족|우아한형제)/i,
  chaebol: /(?:삼성|현대|SK\s*(?:하이닉스|텔레콤)|LG\s*(?:전자|CNS)|롯데|한화|KT)/i,
  startup: /(?:스타트업|startup|series\s*[a-d]|시리즈\s*[a-d]|시드)/i,
}

const DOMAIN_SIGNALS = {
  backend: /(?:백엔드|server-side|API\s*개발|마이크로서비스|MSA|spring|django|nestjs)/i,
  frontend: /(?:프론트엔드|react|vue|angular|UI\s*개발|웹\s*클라이언트)/i,
  data: /(?:데이터\s*엔지니어|ML|머신러닝|데이터\s*사이언스|분석|pipeline|ETL)/i,
  mobile: /(?:iOS|안드로이드|android|flutter|react\s*native|모바일\s*앱)/i,
  devops: /(?:devops|SRE|인프라|kubernetes|k8s|cloud\s*infrastructure)/i,
  pm: /(?:프로덕트\s*매니저|PM|기획자|product\s*manager)/i,
}

// ---------------------------------------------------------------------------
// Format label map
// ---------------------------------------------------------------------------

const FORMAT_LABELS: Record<InterviewFormat, string> = {
  'coding-challenge': '온라인 코딩 테스트',
  'live-coding': '라이브 코딩',
  'system-design': '시스템 설계',
  behavioral: '행동 면접(STAR)',
  'culture-fit': '컬쳐핏 인터뷰',
  'technical-deep': '기술 심층 면접',
  'portfolio-review': '포트폴리오 리뷰',
  'case-study': '케이스 스터디',
  'take-home': '사전 과제',
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function buildInterviewStrategyReport(jdText: string): InterviewStrategyReport {
  const safe = (jdText ?? '').trim()

  // Detect signals
  const isJunior = SENIORITY_SIGNALS.junior.test(safe)
  const isSenior = SENIORITY_SIGNALS.senior.test(safe)
  const isLead = SENIORITY_SIGNALS.lead.test(safe)
  const isBigtech = COMPANY_SIGNALS.bigtech.test(safe)
  const isChaebol = COMPANY_SIGNALS.chaebol.test(safe)
  const isStartup = COMPANY_SIGNALS.startup.test(safe)
  const isBackend = DOMAIN_SIGNALS.backend.test(safe)
  const isFrontend = DOMAIN_SIGNALS.frontend.test(safe)
  const isData = DOMAIN_SIGNALS.data.test(safe)
  const isMobile = DOMAIN_SIGNALS.mobile.test(safe)
  const isDevops = DOMAIN_SIGNALS.devops.test(safe)
  const isPm = DOMAIN_SIGNALS.pm.test(safe)

  const formats: InterviewFormat[] = []
  const prepAreas: PrepArea[] = []
  let prepWeeks: number

  // ── Determine interview formats ──────────────────────────────────────────

  if (isBackend || isFrontend || isMobile || isDevops) {
    formats.push('coding-challenge')
  }

  if (isBigtech || isSenior || isLead) {
    formats.push('live-coding')
  }

  if ((isSenior || isLead) && (isBackend || isDevops)) {
    formats.push('system-design')
  }

  if (isBigtech || isChaebol || isSenior || isLead) {
    formats.push('behavioral')
  }

  if (isStartup) {
    formats.push('culture-fit')
  }

  if ((isSenior || isLead) && !isJunior) {
    formats.push('technical-deep')
  }

  if (isFrontend || isMobile || isData) {
    formats.push('portfolio-review')
  }

  if (isData || isPm) {
    formats.push('case-study')
  }

  if (isStartup && isJunior) {
    formats.push('take-home')
  }

  if (formats.length === 0) {
    formats.push('behavioral', 'culture-fit')
  }

  // ── Build prep areas ──────────────────────────────────────────────────────

  if (isBackend || isFrontend || isMobile) {
    prepAreas.push({
      area: '알고리즘·자료구조',
      priority: isJunior ? 'high' : isSenior ? 'medium' : 'high',
      reason: isJunior
        ? '신입·주니어 전형에서 코딩 테스트가 1차 필터로 사용됩니다.'
        : '시니어도 기본기 검증을 위해 코딩 테스트를 요구하는 경우가 많습니다.',
      resources: [
        'LeetCode Medium 30문제 집중',
        'Programmers 레벨 2~3 풀이',
        'BFS/DFS, DP, 투 포인터 패턴 암기',
      ],
    })
  }

  if ((isSenior || isLead) && (isBackend || isDevops)) {
    prepAreas.push({
      area: '시스템 설계',
      priority: 'high',
      reason: '시니어·리드 직군에서 분산 시스템·확장성 설계를 직접 물어보는 경우가 많습니다.',
      resources: [
        '"System Design Interview" 1·2권 핵심 챕터',
        'URL 단축기·피드 시스템·채팅 설계 연습',
        'CAP 이론·eventual consistency·sharding 개념 정리',
      ],
    })
  }

  if (isBigtech || isChaebol || isSenior || isLead) {
    prepAreas.push({
      area: 'STAR 행동 사례',
      priority: 'high',
      reason:
        '기업 규모가 클수록 과거 행동 기반 질문(리더십, 갈등 해결, 실패 경험)을 중점적으로 봅니다.',
      resources: [
        '경력 프로젝트 3~5개의 STAR 스크립트 작성',
        '"가장 어려웠던 기술 결정"·"팀 갈등 해결 사례" 준비',
        '결과를 수치화 (성능 X배 개선, MAU Y% 증가 등)',
      ],
    })
  }

  if (isData) {
    prepAreas.push({
      area: 'SQL·통계·ML 기초',
      priority: 'high',
      reason: '데이터 직군은 SQL 쿼리 최적화와 기본 통계/ML 개념을 반드시 묻습니다.',
      resources: [
        'Window Function, CTE, 최적화 쿼리 연습',
        'A/B 테스트 설계, 가설 검정 기초',
        '최근 프로젝트 데이터 파이프라인 구조 설명 준비',
      ],
    })
  }

  if (isStartup) {
    prepAreas.push({
      area: '회사·서비스 이해도',
      priority: 'high',
      reason: '스타트업은 왜 이 회사인지, 실제 서비스 사용 경험을 매우 중요하게 봅니다.',
      resources: [
        '최근 3개월 프로덕트 변화 파악 (릴리즈 노트, 블로그 포스트)',
        '서비스 실제 사용 후 개선점 2~3개 준비',
        '창업자·팀 LinkedIn 리서치',
      ],
    })
  }

  if (isFrontend || isMobile) {
    prepAreas.push({
      area: '포트폴리오 데모',
      priority: 'medium',
      reason: '프론트엔드·모바일은 실제 구현물을 보여주며 설명하는 포트폴리오 리뷰가 진행됩니다.',
      resources: [
        '프로젝트별 "어떤 문제를 해결했나" 요약 준비',
        '기술 선택 이유·트레이드오프 설명 연습',
        '코드 품질·테스트 커버리지 점검',
      ],
    })
  }

  // Default area if nothing was added
  if (prepAreas.length === 0) {
    prepAreas.push({
      area: '자기소개 및 직무 이해',
      priority: 'high',
      reason: '모든 면접에서 가장 먼저 나오는 질문은 자기소개와 지원 동기입니다.',
      resources: [
        '1분·3분 자기소개 스크립트 준비',
        'JD 내 키워드와 경험 연결 연습',
        '지원 동기·커리어 방향성 정리',
      ],
    })
  }

  // ── Prep timeline ─────────────────────────────────────────────────────────

  if (isLead || (isSenior && isBigtech)) {
    prepWeeks = 6
  } else if (isSenior || isBigtech) {
    prepWeeks = 4
  } else if (isJunior) {
    prepWeeks = 3
  } else {
    prepWeeks = 4
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  const seniorityLabel = isLead
    ? '리드/Principal'
    : isSenior
      ? '시니어'
      : isJunior
        ? '주니어/신입'
        : '미드레벨'

  const companyLabel = isBigtech
    ? '빅테크'
    : isChaebol
      ? '대기업'
      : isStartup
        ? '스타트업'
        : '일반 기업'

  const topFormat = FORMAT_LABELS[formats[0] as InterviewFormat] ?? '행동 면접'

  const summary = `${companyLabel} ${seniorityLabel} 포지션은 주로 "${topFormat}"부터 시작합니다. ${prepWeeks}주 집중 준비를 권장하며 우선순위는 ${prepAreas[0]?.area ?? '기본기'}입니다.`

  return {
    formats: formats.slice(0, 5) as InterviewFormat[],
    formatLabels: formats.slice(0, 5) as InterviewFormat[],
    prepAreas: prepAreas.slice(0, 4),
    prepWeeks,
    summary,
    label: `${seniorityLabel} · ${companyLabel} · ${prepWeeks}주 플랜`,
  }
}

export const FORMAT_LABEL_MAP = FORMAT_LABELS
