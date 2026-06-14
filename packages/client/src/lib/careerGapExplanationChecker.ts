/**
 * 경력 공백 설명 여부 점검 — 이력서 텍스트에서 공백 기간이 감지되었을 때
 * 해당 공백에 대한 설명(군복무/육아/유학/자격증/창업 등)이 기재되어 있는지 확인한다.
 */

export type GapExplanationType =
  | 'military' // 군복무
  | 'study' // 어학연수/유학/자격증
  | 'personal' // 육아/건강/개인 사정
  | 'side_project' // 사이드 프로젝트/오픈소스
  | 'startup' // 창업 준비
  | 'job_search' // 구직 활동
  | 'explained_other' // 기타 설명

export interface GapExplanationReport {
  hasUnexplainedGap: boolean
  explanationTypes: GapExplanationType[]
  unexplainedCount: number
  totalGapSignals: number
  suggestion: string
  tips: string[]
}

// ---------------------------------------------------------------------------
// Explanation patterns
// ---------------------------------------------------------------------------

const EXPLANATION_PATTERNS: Array<{ re: RegExp; type: GapExplanationType }> = [
  // Military service
  { re: /군\s*(?:입대|복무|제대|전역|만기전역)/, type: 'military' },
  { re: /사회\s*복무\s*(?:요원|대체|완료)/, type: 'military' },
  { re: /현역\s*(?:복무|전역|군인)/, type: 'military' },
  { re: /대체\s*복무/, type: 'military' },

  // Study / self-development
  { re: /어학\s*연수/, type: 'study' },
  { re: /(?:해외|국외)\s*(?:유학|어학)/, type: 'study' },
  { re: /자격증\s*(?:준비|공부|취득|학습)/, type: 'study' },
  { re: /(?:부트캠프|bootcamp|코딩\s*스쿨|교육\s*과정)\s*(?:수료|이수|완료)/, type: 'study' },
  { re: /대학원\s*(?:준비|진학|진학\s*준비)/, type: 'study' },
  { re: /(?:국비|취업\s*준비)\s*(?:교육|훈련|과정)/, type: 'study' },

  // Personal (family/health)
  { re: /육아\s*(?:휴직|참여|전념)/, type: 'personal' },
  { re: /(?:가족|부모|가정)\s*(?:돌봄|간병|건강)/, type: 'personal' },
  { re: /건강\s*(?:문제|회복|이유)/, type: 'personal' },
  { re: /개인\s*(?:사정|사유|건강)/, type: 'personal' },

  // Side projects / open source
  { re: /(?:사이드\s*프로젝트|side\s*project)\s*(?:진행|개발|운영)/, type: 'side_project' },
  { re: /(?:오픈소스|open\s*source)\s*(?:기여|개발|활동)/, type: 'side_project' },
  { re: /개인\s*프로젝트\s*(?:개발|진행|운영)/, type: 'side_project' },
  { re: /프리랜서\s*(?:활동|개발|작업)/, type: 'side_project' },

  // Startup / entrepreneurship
  { re: /(?:창업|스타트업\s*창업)\s*(?:준비|도전|경험|시도)/, type: 'startup' },
  { re: /법인\s*(?:설립|운영|대표)/, type: 'startup' },

  // Active job search
  { re: /구직\s*(?:활동|중|기간)/, type: 'job_search' },
  { re: /이직\s*준비/, type: 'job_search' },

  // Generic explanation (better than nothing)
  { re: /공백\s*기간\s*(?:동안|에)/, type: 'explained_other' },
  { re: /(?:자기\s*계발|역량\s*강화)\s*(?:집중|전념)/, type: 'explained_other' },
]

// Check if there's at least one "gap period" mention in the text at all
const GAP_PERIOD_MARKERS: RegExp[] = [
  /공백\s*(?:기간|이유|사유)/,
  /공백\s*기간\s*\d+/,
  /경력\s*(?:단절|공백)/,
  /\d{4}[.\-년]\s*\d{1,2}[.\-월]?\s*[~\-~]\s*\d{4}[.\-년]/,
]

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function checkCareerGapExplanations(text: string): GapExplanationReport {
  const t = text ?? ''
  const foundTypes = new Set<GapExplanationType>()

  for (const { re, type } of EXPLANATION_PATTERNS) {
    if (re.test(t)) foundTypes.add(type)
  }

  const explanationTypes = Array.from(foundTypes)
  const totalGapSignals = explanationTypes.length

  // Check if there's a date gap pattern at all (suggests gap might exist)
  const hasDatePattern = GAP_PERIOD_MARKERS.some((re) => re.test(t))

  // Heuristic for unexplained gap count:
  // If text has date patterns suggesting career history but no explanation types,
  // infer potential unexplained gaps.
  const hasUnexplainedGap = hasDatePattern && totalGapSignals === 0
  const unexplainedCount = hasUnexplainedGap ? 1 : 0

  let suggestion: string
  const tips: string[] = []

  if (totalGapSignals === 0 && !hasDatePattern) {
    suggestion = '이력서에서 공백 기간 패턴을 감지하지 못했습니다.'
  } else if (totalGapSignals === 0) {
    suggestion = '공백 기간에 대한 설명이 없습니다. 이력서 또는 면접 답변으로 준비가 필요합니다.'
    tips.push('군복무, 어학연수, 육아휴직 등 정당한 이유는 이력서에 명시하세요.')
    tips.push(
      '공백 기간을 자기계발(자격증, 오픈소스, 사이드 프로젝트)로 활용했다면 반드시 기재하세요.'
    )
    tips.push(
      '이력서에 쓰지 않더라도 면접에서 "공백 기간에 무엇을 했나요?"에 대한 답변을 미리 준비하세요.'
    )
  } else if (foundTypes.has('military')) {
    suggestion = '군복무가 명시되어 있습니다. 공백 이유가 자연스럽게 설명됩니다.'
    tips.push('군복무 기간 중 습득한 기술(리더십, 유지보수 경험 등)을 간략히 추가하면 더 좋습니다.')
  } else if (foundTypes.has('study')) {
    suggestion = '학습/연수 기간이 명시되어 있습니다. 공백 활용이 잘 드러납니다.'
    tips.push('어학 연수 결과(OPIc, TOEIC 점수 상승)나 취득한 자격증을 함께 명시하세요.')
  } else {
    suggestion = `${totalGapSignals}개의 공백 설명이 감지됩니다. 잘 정리되어 있습니다.`
  }

  return {
    hasUnexplainedGap,
    explanationTypes,
    unexplainedCount,
    totalGapSignals,
    suggestion,
    tips,
  }
}
