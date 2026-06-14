/**
 * JD 공고 완성도 체커 — 채용공고가 필수/권장 섹션을 갖추고 있는지 구조적으로
 * 점검한다. 내용 품질이 아니라 "필요한 정보가 빠짐없이 있는가"에 집중한다.
 */

export type JdSection =
  | 'responsibilities' // 담당업무 (필수)
  | 'qualifications' // 자격요건 (필수)
  | 'conditions' // 근무조건 (필수)
  | 'preferred' // 우대사항 (권장)
  | 'benefits' // 복리후생 (권장)
  | 'process' // 전형절차 (권장)

export type CompletenessGrade = 'complete' | 'good' | 'partial' | 'sparse'

export interface JdPostingCompletenessReport {
  grade: CompletenessGrade
  presentSections: JdSection[]
  missingSections: JdSection[]
  essentialPresent: number // 0–3
  recommendedPresent: number // 0–3
  summary: string
  tips: string[]
}

// ---------------------------------------------------------------------------
// Section detection
// ---------------------------------------------------------------------------

const ESSENTIAL_SECTIONS: JdSection[] = ['responsibilities', 'qualifications', 'conditions']
const RECOMMENDED_SECTIONS: JdSection[] = ['preferred', 'benefits', 'process']

const SECTION_PATTERNS: Record<JdSection, RegExp> = {
  responsibilities:
    /(?:담당\s*업무|주요\s*업무|수행\s*업무|업무\s*내용|하는\s*일|이런\s*일을|responsibilities|what\s*you.?ll\s*do)/i,
  qualifications:
    /(?:자격\s*요건|지원\s*자격|필수\s*(?:조건|자격|요건|역량)|이런\s*분을\s*찾|requirements|qualifications)/i,
  conditions:
    /(?:근무\s*(?:조건|지|시간|형태|환경)|고용\s*형태|급여\s*조건|연봉|채용\s*형태|정규직|계약직)/i,
  preferred: /(?:우대\s*(?:사항|조건|역량)|있으면\s*좋[은음]|preferred|nice\s*to\s*have|plus)/i,
  benefits: /(?:복리\s*후생|복지\s*(?:제도|혜택)?|혜택|지원\s*제도|benefits|perks)/i,
  process:
    /(?:전형\s*(?:절차|방법|과정)|채용\s*(?:절차|과정)|지원\s*방법|제출\s*서류|hiring\s*process|how\s*to\s*apply)/i,
}

const SECTION_LABEL: Record<JdSection, string> = {
  responsibilities: '담당업무',
  qualifications: '자격요건',
  conditions: '근무조건',
  preferred: '우대사항',
  benefits: '복리후생',
  process: '전형절차',
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function checkJdPostingCompleteness(text: string): JdPostingCompletenessReport {
  const t = (text ?? '').trim()

  const presentSections: JdSection[] = []
  const allSections: JdSection[] = [...ESSENTIAL_SECTIONS, ...RECOMMENDED_SECTIONS]

  for (const section of allSections) {
    if (SECTION_PATTERNS[section].test(t)) {
      presentSections.push(section)
    }
  }

  const missingSections = allSections.filter((s) => !presentSections.includes(s))
  const essentialPresent = ESSENTIAL_SECTIONS.filter((s) => presentSections.includes(s)).length
  const recommendedPresent = RECOMMENDED_SECTIONS.filter((s) => presentSections.includes(s)).length

  let grade: CompletenessGrade
  if (essentialPresent === 3 && recommendedPresent >= 2) {
    grade = 'complete'
  } else if (essentialPresent >= 2) {
    grade = 'good'
  } else if (essentialPresent >= 1) {
    grade = 'partial'
  } else {
    grade = 'sparse'
  }

  // Summary
  const GRADE_LABEL: Record<CompletenessGrade, string> = {
    complete: '필수·권장 섹션을 고루 갖춘 충실한 공고입니다.',
    good: '핵심 정보는 있으나 일부 섹션이 누락되었습니다.',
    partial: '필수 정보가 부족합니다. 추가 확인이 필요합니다.',
    sparse: '공고 정보가 매우 부족합니다. 신중히 접근하세요.',
  }
  const summary = GRADE_LABEL[grade]

  // Tips
  const tips: string[] = []
  const missingEssential = ESSENTIAL_SECTIONS.filter((s) => !presentSections.includes(s))
  if (missingEssential.length > 0) {
    const labels = missingEssential.map((s) => SECTION_LABEL[s]).join(', ')
    tips.push(`필수 정보 누락: ${labels} — 지원 전 채용 담당자에게 문의하세요.`)
  }
  if (!presentSections.includes('conditions')) {
    tips.push('근무지·고용형태·급여 등 근무조건이 없으면 입사 후 조건 불일치 위험이 있습니다.')
  }
  if (!presentSections.includes('process')) {
    tips.push('전형 절차가 없으면 준비 범위를 가늠하기 어렵습니다. 절차를 문의하세요.')
  }
  if (grade === 'sparse') {
    tips.push('정보가 부실한 공고는 채용 의지·조직 체계가 약할 수 있으니 주의하세요.')
  }
  if (grade === 'complete') {
    tips.push('정보가 충실합니다. 각 섹션의 구체성까지 함께 확인하세요.')
  }

  return {
    grade,
    presentSections,
    missingSections,
    essentialPresent,
    recommendedPresent,
    summary,
    tips,
  }
}
