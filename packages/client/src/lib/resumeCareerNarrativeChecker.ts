/**
 * 이력서 커리어 내러티브 일관성 검사기 — 직군/도메인/기술 스택의 변화가
 * 논리적 성장 스토리로 연결되는지, 아니면 단절·산만하게 보이는지 감지한다.
 */

export type NarrativeIssueType =
  | 'frequent_job_switch' // 짧은 재직 기간 반복 (평균 < 1년)
  | 'domain_scatter' // 서로 다른 도메인을 무관하게 넘나듦
  | 'role_regression' // 시니어→주니어 역할 하강 패턴
  | 'tech_scatter' // 기술 스택이 무분별하게 분산
  | 'no_progression' // 동일 레벨 반복 (성장 없음)
  | 'strong_narrative' // 일관된 성장 스토리

export interface NarrativeIssue {
  type: NarrativeIssueType
  evidence: string
}

export type NarrativeCohesion = 'coherent' | 'adequate' | 'fragmented'

export interface CareerNarrativeReport {
  issues: NarrativeIssue[]
  cohesion: NarrativeCohesion
  positives: string[]
  suggestion: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Detect short-tenure mentions (재직 기간 < 1년 패턴)
const SHORT_TENURE_RE =
  /(?:(?:20[0-9]{2})년\s*(?:0?[1-9]|1[0-2])월[^가-힣]*(?:20[0-9]{2})년\s*(?:0?[1-9]|1[0-2])월)|(?:[1-9][0-9]*개월\s*(?:재직|근무|경력))/g

// Detect senior-role keywords
const SENIOR_ROLE_RE =
  /(?:팀장|파트장|리드|Lead|Senior|시니어|아키텍트|CTO|VP)\s*(?:엔지니어|개발자|연구원|직책)?/gi
const JUNIOR_ROLE_RE = /(?:인턴|신입|주니어|Junior|사원|Staff)\s*(?:엔지니어|개발자|연구원)?/gi

// Domain keywords
const DOMAIN_KEYWORDS: Record<string, RegExp> = {
  frontend:
    /(?:React|Vue|Angular|프론트엔드|UI\/UX|HTML|CSS|JavaScript|TypeScript)\s*(?:개발|엔지니어|팀)?/gi,
  backend: /(?:백엔드|서버|API|Node\.js|Spring|Django|FastAPI|NestJS)\s*(?:개발|엔지니어|팀)?/gi,
  data: /(?:데이터|ML|머신러닝|AI|분석|Analytics|Python|Pandas|모델)\s*(?:엔지니어|사이언티스트|팀)?/gi,
  infra:
    /(?:인프라|DevOps|SRE|클라우드|AWS|GCP|Azure|쿠버네티스|Kubernetes|CI\/CD)\s*(?:엔지니어|팀)?/gi,
  mobile: /(?:iOS|Android|모바일|Swift|Kotlin|Flutter|React\s*Native)\s*(?:개발|엔지니어|팀)?/gi,
  security: /(?:보안|Security|침해|취약점|SIEM|CISO)\s*(?:엔지니어|팀|분석)?/gi,
  embedded: /(?:임베디드|펌웨어|RTOS|MCU|Embedded|IoT)\s*(?:개발|엔지니어|팀)?/gi,
}

// Progression keywords (indicates growth)
const PROGRESSION_MARKERS_RE =
  /(?:승진|성장|전환|이직|확장|팀\s*빌딩|팀\s*리드|아키텍처\s*설계|기술\s*리드)\s/

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function checkCareerNarrative(text: string): CareerNarrativeReport {
  const t = text ?? ''
  const issues: NarrativeIssue[] = []
  const positives: string[] = []

  // 1. Detect domains used
  const detectedDomains: string[] = []
  for (const [domain, re] of Object.entries(DOMAIN_KEYWORDS)) {
    const fresh = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')
    if (fresh.test(t)) detectedDomains.push(domain)
  }

  // 2. Domain scatter (4+ distinct domains without progression narrative)
  const hasProgressionNarrative = PROGRESSION_MARKERS_RE.test(t)
  if (detectedDomains.length >= 4 && !hasProgressionNarrative) {
    issues.push({
      type: 'domain_scatter',
      evidence: `감지된 도메인: ${detectedDomains.join(', ')}`,
    })
  } else if (detectedDomains.length >= 2 && detectedDomains.length <= 3) {
    positives.push(`${detectedDomains.join(' + ')} 다중 도메인 경험 보유`)
  }

  // 3. Short tenure detection
  const shortTenureMatches = t.match(SHORT_TENURE_RE) ?? []
  if (shortTenureMatches.length >= 3) {
    issues.push({
      type: 'frequent_job_switch',
      evidence: `짧은 재직 기간 패턴 ${shortTenureMatches.length}건`,
    })
  }

  // 4. Role regression: senior title followed by junior title later
  const seniorMatches = [...t.matchAll(SENIOR_ROLE_RE)]
  const juniorMatches = [...t.matchAll(JUNIOR_ROLE_RE)]
  if (seniorMatches.length > 0 && juniorMatches.length > 0) {
    const lastSeniorIdx = seniorMatches[seniorMatches.length - 1].index ?? 0
    const lastJuniorIdx = juniorMatches[juniorMatches.length - 1].index ?? 0
    if (lastJuniorIdx > lastSeniorIdx) {
      issues.push({
        type: 'role_regression',
        evidence: '시니어 직책 이후에 주니어/인턴 직책이 등장',
      })
    }
  }

  // 5. Progression positives
  if (seniorMatches.length > 0) {
    positives.push('시니어/리드 경험 보유')
  }
  if (hasProgressionNarrative) {
    positives.push('성장 스토리 키워드 감지')
  }
  if (detectedDomains.length === 1) {
    positives.push(`${detectedDomains[0]} 도메인 전문성 집중`)
  }

  // 6. Grade cohesion
  let cohesion: NarrativeCohesion
  if (issues.length === 0) {
    cohesion = 'coherent'
  } else if (issues.length === 1) {
    cohesion = 'adequate'
  } else {
    cohesion = 'fragmented'
  }

  // 7. Suggestion
  let suggestion: string
  if (cohesion === 'coherent') {
    suggestion = '커리어 흐름이 논리적으로 연결되어 있습니다.'
  } else if (cohesion === 'adequate') {
    const issue = issues[0]
    if (issue.type === 'frequent_job_switch') {
      suggestion =
        '짧은 재직 기간이 반복됩니다. 각 이직 이유와 성장 포인트를 자기소개서에서 설명하세요.'
    } else if (issue.type === 'domain_scatter') {
      suggestion =
        '다양한 도메인 경험이 "T자형 역량" 또는 "풀스택 성장"으로 연결될 수 있도록 공통 스레드를 명시하세요.'
    } else {
      suggestion = '커리어 일관성을 보완할 수 있는 연결 고리를 자기소개서에서 설명하세요.'
    }
  } else {
    suggestion =
      '커리어 흐름이 산만하게 보일 수 있습니다. 자기소개서에서 이직·전환의 논리적 이유와 성장 방향을 명확히 설명하세요.'
  }

  return { issues, cohesion, positives, suggestion }
}
