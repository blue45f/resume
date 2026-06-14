/**
 * 이력서 개인정보 과다 기재 체커 — 채용절차법상 수집이 제한되거나
 * 현대 이력서에서 불필요한 민감 정보를 감지해 삭제를 권고한다.
 *
 * 참고: 채용절차의 공정화에 관한 법률은 용모·키·체중, 출신지역, 혼인여부,
 * 재산, 직계존비속의 학력·직업·재산 수집을 제한한다.
 */

export type DisclosureCategory =
  | 'resident_id' // 주민등록번호
  | 'family_info' // 가족관계/직계존비속
  | 'financial' // 재산/보유자산
  | 'marital' // 결혼/혼인 여부
  | 'physical' // 키/몸무게/혈액형
  | 'origin' // 본적/출신지역
  | 'religion' // 종교
  | 'photo' // 증명사진 기재

export type DisclosureSeverity = 'high' | 'medium' | 'low'

export interface DisclosureFinding {
  category: DisclosureCategory
  severity: DisclosureSeverity
  excerpt: string
}

export type DisclosureGrade = 'clean' | 'caution' | 'risky'

export interface ResumeDisclosureReport {
  grade: DisclosureGrade
  findings: DisclosureFinding[]
  summary: string
  recommendations: string[]
}

// ---------------------------------------------------------------------------
// Patterns (value/context-anchored to minimize false positives)
// ---------------------------------------------------------------------------

const PATTERNS: Array<{ category: DisclosureCategory; severity: DisclosureSeverity; re: RegExp }> =
  [
    // High severity
    {
      category: 'resident_id',
      severity: 'high',
      re: /(?:주민\s*(?:등록)?\s*번호|\b\d{6}\s*[-–]\s*[1-4]\d{6}\b)/,
    },
    {
      category: 'family_info',
      severity: 'high',
      re: /(?:가족\s*(?:관계|사항)|직계\s*존비속|부친?\s*[:：]|모친?\s*[:：])/,
    },
    {
      category: 'financial',
      severity: 'high',
      re: /(?:보유\s*재산|재산\s*[:：]\s*\d|보유\s*자산\s*[:：]?\s*\d|월\s*소득\s*[:：]?\s*\d)/,
    },
    // Medium severity
    {
      category: 'marital',
      severity: 'medium',
      re: /(?:결혼\s*여부|혼인\s*여부|\b기혼\b|\b미혼\b)/,
    },
    {
      category: 'physical',
      severity: 'medium',
      re: /(?:(?:키|신장)\s*[:：]?\s*1[4-9][0-9]\s*(?:cm|센티)?|(?:몸무게|체중)\s*[:：]?\s*\d{2,3}\s*(?:kg|킬로)?|혈액형\s*[:：]?\s*(?:AB|[ABO])\s*형?)/,
    },
    {
      category: 'origin',
      severity: 'medium',
      re: /(?:본적\s*[:：]?|출신\s*지역\s*[:：]?|원적\s*[:：]?)/,
    },
    {
      category: 'religion',
      severity: 'medium',
      re: /종교\s*[:：]?\s*(?:무교|무종교|기독교|개신교|천주교|불교|이슬람|원불교|유교)/,
    },
    // Low severity
    {
      category: 'photo',
      severity: 'low',
      re: /(?:증명\s*사진|반명함\s*사진|사진\s*첨부\s*[:：])/,
    },
  ]

const CATEGORY_LABEL: Record<DisclosureCategory, string> = {
  resident_id: '주민등록번호',
  family_info: '가족관계',
  financial: '재산/소득',
  marital: '결혼 여부',
  physical: '신체 정보(키/체중/혈액형)',
  origin: '본적/출신지역',
  religion: '종교',
  photo: '증명사진',
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function checkResumePersonalInfoDisclosure(text: string): ResumeDisclosureReport {
  const t = (text ?? '').trim()
  const lines = t.split('\n')

  const findings: DisclosureFinding[] = []
  const seen = new Set<DisclosureCategory>()

  for (const line of lines) {
    const l = line.trim()
    if (!l) continue
    for (const { category, severity, re } of PATTERNS) {
      if (!seen.has(category) && re.test(l)) {
        findings.push({ category, severity, excerpt: l.slice(0, 50) })
        seen.add(category)
      }
    }
  }

  const hasHigh = findings.some((f) => f.severity === 'high')

  let grade: DisclosureGrade
  if (findings.length === 0) {
    grade = 'clean'
  } else if (hasHigh) {
    grade = 'risky'
  } else {
    grade = 'caution'
  }

  // Summary
  let summary: string
  if (grade === 'clean') {
    summary = '불필요한 개인정보가 감지되지 않았습니다.'
  } else if (grade === 'risky') {
    summary = `삭제 권장 민감 정보가 ${findings.length}건 감지되었습니다 (고위험 포함).`
  } else {
    summary = `현대 이력서에서 생략하는 항목이 ${findings.length}건 감지되었습니다.`
  }

  // Recommendations
  const recommendations: string[] = []
  for (const f of findings.slice(0, 5)) {
    if (f.category === 'resident_id') {
      recommendations.push('주민등록번호는 절대 기재하지 마세요. 입사 확정 후 별도 제출합니다.')
    } else if (f.category === 'family_info') {
      recommendations.push('가족관계는 채용절차법상 수집 제한 항목입니다. 삭제하세요.')
    } else if (f.category === 'financial') {
      recommendations.push('재산·소득 정보는 채용에 불필요하며 수집 제한 대상입니다. 삭제하세요.')
    } else {
      recommendations.push(
        `${CATEGORY_LABEL[f.category]}은(는) 직무와 무관하므로 삭제를 권장합니다.`
      )
    }
  }
  if (grade !== 'clean') {
    recommendations.push('이력서에는 직무 관련 역량·경험만 남기는 것이 안전하고 효과적입니다.')
  }

  return {
    grade,
    findings: findings.slice(0, 8),
    summary,
    recommendations,
  }
}
