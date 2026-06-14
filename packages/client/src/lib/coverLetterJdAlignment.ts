/**
 * 자기소개서-JD 정렬 분석 — JD 의 핵심 기술·역할·수준을 자소서가 실제로 다루는지 확인.
 * 일반적인 자소서 vs JD 맞춤 자소서를 구분하는 가벼운 체크.
 */

export type AlignmentTone = 'good' | 'neutral' | 'warning'

export interface AlignmentCheck {
  label: string
  addressed: boolean
  detail: string
  tip: string
}

export interface CoverLetterJdAlignmentReport {
  checks: AlignmentCheck[]
  addressedCount: number
  totalChecks: number
  alignmentScore: number // 0-100
  tone: AlignmentTone
  label: string
  summary: string
  /** Key JD terms missing from the cover letter. */
  missingKeywords: string[]
}

// ---------------------------------------------------------------------------
// Term extraction from JD
// ---------------------------------------------------------------------------

const TECH_NOUN_RE =
  /(?:Java(?:Script)?|TypeScript|Python|Go(?:lang)?|Rust|C#|C\+\+|Scala|Kotlin|Swift|React|Vue|Angular|Node\.?js?|Spring(?:\s*Boot)?|Django|Nest(?:JS)?|Kubernetes|k8s|Docker|AWS|GCP|Azure|MySQL|PostgreSQL?|MongoDB|Redis|GraphQL|REST|gRPC|Kafka|Elasticsearch)/g

const SENIORITY_RE = /(?:시니어|주니어|리드|신입|팀장|senior|junior|lead|staff|principal)/i
const COMPANY_NAME_RE =
  /(?:네이버|카카오|LINE|당근|토스|쿠팡|배달의민족|삼성|현대|SK|LG|롯데|한화|KT|스타트업|startup)/i

function extractJdTechKeywords(jdText: string): string[] {
  const found: string[] = []
  const re = new RegExp(TECH_NOUN_RE.source, 'g')
  let m: RegExpExecArray | null
  while ((m = re.exec(jdText)) !== null) {
    if (!found.includes(m[0])) found.push(m[0])
  }
  return found.slice(0, 10)
}

function extractCoreDomain(jdText: string): string[] {
  const domains: string[] = []
  if (/백엔드|backend|server/i.test(jdText)) domains.push('백엔드')
  if (/프론트엔드|frontend|UI\s*개발/i.test(jdText)) domains.push('프론트엔드')
  if (/데이터\s*엔지니어|ML|머신러닝|데이터\s*사이언스/i.test(jdText)) domains.push('데이터')
  if (/모바일|iOS|안드로이드|flutter/i.test(jdText)) domains.push('모바일')
  if (/DevOps|SRE|인프라/i.test(jdText)) domains.push('인프라/DevOps')
  return domains
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function buildCoverLetterJdAlignmentReport(
  coverLetterText: string,
  jdText: string
): CoverLetterJdAlignmentReport {
  const cl = (coverLetterText ?? '').trim()
  const jd = (jdText ?? '').trim()

  const empty: CoverLetterJdAlignmentReport = {
    checks: [],
    addressedCount: 0,
    totalChecks: 0,
    alignmentScore: 0,
    tone: 'warning',
    label: '분석 불가',
    summary: '자기소개서와 채용공고 내용을 모두 입력하면 정렬도를 분석합니다.',
    missingKeywords: [],
  }

  if (cl.length < 40 || jd.length < 20) return empty

  const clLower = cl.toLowerCase()
  const jdTechKeywords = extractJdTechKeywords(jd)
  const jdDomains = extractCoreDomain(jd)
  const hasSeniority = SENIORITY_RE.test(jd)
  const hasCompanyName = COMPANY_NAME_RE.test(jd)
  const checks: AlignmentCheck[] = []

  // Check 1: Core tech keywords from JD mentioned in cover letter
  if (jdTechKeywords.length > 0) {
    const covered = jdTechKeywords.filter((k) => clLower.includes(k.toLowerCase()))
    const ratio = covered.length / jdTechKeywords.length
    const addressed = ratio >= 0.3
    checks.push({
      label: '기술 스택 언급',
      addressed,
      detail: addressed
        ? `JD 기술 키워드 ${covered.length}/${jdTechKeywords.length}개 언급됨.`
        : `JD 핵심 기술(${jdTechKeywords.slice(0, 3).join(', ')}) 중 ${covered.length}/${jdTechKeywords.length}개만 언급.`,
      tip: addressed
        ? 'JD 핵심 기술이 자소서에 잘 드러납니다.'
        : `자소서에 "${jdTechKeywords.slice(0, 2).join(', ')}" 등을 구체 경험과 함께 언급하세요.`,
    })
  }

  // Check 2: Domain match
  if (jdDomains.length > 0) {
    const domainKeywordMap: Record<string, string[]> = {
      백엔드: ['백엔드', '서버', 'API', '데이터베이스'],
      프론트엔드: ['프론트엔드', 'UI', '웹', '사용자'],
      데이터: ['데이터', '분석', '모델', 'ML', '파이프라인'],
      모바일: ['모바일', '앱', 'iOS', '안드로이드'],
      'DevOps/인프라': ['인프라', '배포', '클라우드', 'CI/CD'],
    }
    const covered = jdDomains.filter((d) => {
      const terms = domainKeywordMap[d] ?? [d]
      return terms.some((t) => clLower.includes(t.toLowerCase()))
    })
    const addressed = covered.length > 0
    checks.push({
      label: '직무 도메인 연결',
      addressed,
      detail: addressed
        ? `"${covered.join(', ')}" 도메인 관련 내용이 언급됩니다.`
        : `JD 의 "${jdDomains.join(', ')}" 직무와 자소서 내용이 연결되지 않습니다.`,
      tip: addressed
        ? '직무 도메인이 명확히 드러납니다.'
        : `자소서에 ${jdDomains[0]} 직무 경험을 구체적으로 서술하세요.`,
    })
  }

  // Check 3: Seniority acknowledgement
  if (hasSeniority) {
    const seniorityTerms = [
      '시니어',
      '주니어',
      '신입',
      '경력',
      '년차',
      '리드',
      '팀장',
      'senior',
      'junior',
      'lead',
    ]
    const addressed = seniorityTerms.some((t) => clLower.includes(t.toLowerCase()))
    checks.push({
      label: '경력 수준 표현',
      addressed,
      detail: addressed
        ? '자소서에 경력 수준이 명시되어 있습니다.'
        : 'JD 에 명시된 경력 수준(시니어/주니어 등)이 자소서에 드러나지 않습니다.',
      tip: addressed
        ? '경력 레벨이 자소서에 잘 표현되어 있습니다.'
        : '자소서에서 현재 경력 연차나 수준을 자연스럽게 드러내세요.',
    })
  }

  // Check 4: Company/industry reference
  if (hasCompanyName) {
    const companyTerms = ['귀사', '회사', '서비스', '제품', '팀', '비전', '미션']
    const addressed = companyTerms.some((t) => cl.includes(t))
    checks.push({
      label: '회사·서비스 맞춤화',
      addressed,
      detail: addressed
        ? '자소서가 이 회사/서비스에 맞게 작성되어 있습니다.'
        : '특정 회사/서비스에 대한 언급이 부족합니다.',
      tip: addressed
        ? '회사 맞춤화가 잘 되어 있습니다.'
        : '이 회사의 서비스/비전/제품을 구체적으로 언급해 개인화를 높이세요.',
    })
  }

  if (checks.length === 0) {
    return {
      ...empty,
      summary: 'JD 에서 기술 스택이나 회사 정보를 감지하지 못했습니다.',
    }
  }

  const addressedCount = checks.filter((c) => c.addressed).length
  const totalChecks = checks.length
  const alignmentScore = Math.round((addressedCount / totalChecks) * 100)

  const tone: AlignmentTone =
    alignmentScore >= 70 ? 'good' : alignmentScore >= 40 ? 'neutral' : 'warning'

  // Missing keywords for quick reference
  const missingKeywords = jdTechKeywords
    .filter((k) => !clLower.includes(k.toLowerCase()))
    .slice(0, 5)

  const summary =
    alignmentScore >= 70
      ? `JD 핵심 요소 ${addressedCount}/${totalChecks}개 반영 — 잘 맞춤화된 자소서입니다.`
      : alignmentScore >= 40
        ? `JD 핵심 요소 ${addressedCount}/${totalChecks}개 반영 — 일부 JD 요소를 더 구체적으로 언급하세요.`
        : `JD 와의 연결이 약합니다 (${addressedCount}/${totalChecks}) — 기술·직무·회사를 더 구체적으로 연결하세요.`

  return {
    checks,
    addressedCount,
    totalChecks,
    alignmentScore,
    tone,
    label: `JD 정렬 ${alignmentScore}점`,
    summary,
    missingKeywords,
  }
}
