/**
 * 자기소개서 콘텐츠 블록 커버리지 체커 — 표준 자소서가 갖춰야 할 4가지 핵심 beat
 * (지원동기·직무역량·구체적 경험·입사 후 포부)가 모두 다뤄졌는지 점검한다.
 *
 * 구조 "품질"(coverLetterStructure)이나 개별 블록 "품질"(motivation/aspiration)과 달리,
 * "필요한 내용 블록이 빠짐없이 있는가"라는 커버리지에 집중한다.
 */

export type CoverLetterBlock = 'motivation' | 'competency' | 'experience' | 'aspiration'

export type CoverageGrade = 'complete' | 'good' | 'partial' | 'sparse'

export interface CoverLetterCoverageReport {
  grade: CoverageGrade
  presentBlocks: CoverLetterBlock[]
  missingBlocks: CoverLetterBlock[]
  presentCount: number
  summary: string
  suggestions: string[]
}

// ---------------------------------------------------------------------------
// Block detection
// ---------------------------------------------------------------------------

const ALL_BLOCKS: CoverLetterBlock[] = ['motivation', 'competency', 'experience', 'aspiration']

const BLOCK_PATTERNS: Record<CoverLetterBlock, RegExp> = {
  motivation:
    /(?:지원\s*동기|지원하게\s*된|지원\s*(?:한\s*)?이유|매력을?\s*느|관심을\s*갖게|이\s*직무에\s*지원|함께\s*하고\s*싶|입사를\s*희망)/,
  competency:
    /(?:역량|강점|전문성|적합(?:하다고|한\s*인재)|기여할\s*수\s*있|잘\s*할\s*수\s*있|능력을\s*갖|차별화된|경쟁력)/,
  experience: /(?:경험|프로젝트|사례|당시|진행했|개발했|구축했|담당했|수행했|참여했|이끌었|해결했)/,
  aspiration:
    /(?:입사\s*후|포부|목표|이루고\s*싶|성장하여|성장하고\s*싶|기여하고\s*싶|앞으로|비전을|되고\s*싶)/,
}

const BLOCK_LABEL: Record<CoverLetterBlock, string> = {
  motivation: '지원 동기',
  competency: '직무 역량',
  experience: '구체적 경험',
  aspiration: '입사 후 포부',
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function checkCoverLetterCoverage(text: string): CoverLetterCoverageReport {
  const t = (text ?? '').trim()

  const presentBlocks: CoverLetterBlock[] = []
  for (const block of ALL_BLOCKS) {
    if (BLOCK_PATTERNS[block].test(t)) {
      presentBlocks.push(block)
    }
  }
  const missingBlocks = ALL_BLOCKS.filter((b) => !presentBlocks.includes(b))
  const presentCount = presentBlocks.length

  let grade: CoverageGrade
  if (presentCount === 4) {
    grade = 'complete'
  } else if (presentCount === 3) {
    grade = 'good'
  } else if (presentCount === 2) {
    grade = 'partial'
  } else {
    grade = 'sparse'
  }

  // Summary
  const GRADE_LABEL: Record<CoverageGrade, string> = {
    complete: '지원동기·역량·경험·포부를 모두 다룬 균형 잡힌 자기소개서입니다.',
    good: '핵심 내용은 갖췄으나 일부 블록이 빠졌습니다.',
    partial: '주요 내용 블록이 부족합니다. 빠진 부분을 보강하세요.',
    sparse: '자기소개서의 핵심 구성이 거의 드러나지 않습니다.',
  }
  const summary = GRADE_LABEL[grade]

  // Suggestions for missing blocks
  const BLOCK_TIP: Record<CoverLetterBlock, string> = {
    motivation: '"왜 이 회사·이 직무인가"를 다루는 지원 동기 단락을 추가하세요.',
    competency: '직무에 맞는 본인의 강점·역량을 한 단락으로 정리하세요.',
    experience: '주장을 뒷받침할 구체적 경험·프로젝트 사례를 추가하세요.',
    aspiration: '입사 후 이루고 싶은 목표·기여 방향(포부)을 마지막에 덧붙이세요.',
  }
  const suggestions: string[] = []
  for (const block of missingBlocks) {
    suggestions.push(BLOCK_TIP[block])
  }
  if (grade === 'complete') {
    suggestions.push('구성이 완성되었습니다. 각 블록의 구체성과 연결성을 다듬으세요.')
  }

  return {
    grade,
    presentBlocks,
    missingBlocks,
    presentCount,
    summary,
    suggestions,
  }
}

export { BLOCK_LABEL as COVER_LETTER_BLOCK_LABEL }
