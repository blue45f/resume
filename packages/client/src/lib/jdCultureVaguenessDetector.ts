/**
 * JD 문화·가치 모호성 감지기 — 채용공고에서 구체적 근거 없이
 * 사용되는 추상적 문화 표현(열정, 패밀리, 자유로운 분위기 등)을 감지하고
 * 실질적인 문화 증거와 대비한다.
 */

export type VagueCultureType =
  | 'family_metaphor' // "패밀리", "가족 같은"
  | 'passion_demand' // "열정 있는", "주도적인 분"
  | 'vague_culture' // "자유로운 분위기", "좋은 문화"
  | 'ambiguous_growth' // "함께 성장", "발전 기회"
  | 'buzzword_diversity' // "다양성", "포용성" 단독 사용
  | 'empty_values' // "정직", "신뢰", "혁신" 단독 나열

export type ConcreteCultureType =
  | 'process_evidence' // 코드 리뷰, 스프린트, 회고 등 실제 프로세스
  | 'measurable_benefit' // 구체적 수치가 있는 복지/제도
  | 'transparency_action' // 공개 OKR, 전직원 미팅, 의사결정 참여
  | 'employee_voice' // 직원 피드백 제도, 설문, 1on1
  | 'diversity_action' // 다양성 프로그램 구체적 설명

export interface VagueCultureSignal {
  type: VagueCultureType
  excerpt: string
}

export interface ConcreteCultureSignal {
  type: ConcreteCultureType
  excerpt: string
}

export type CultureClarity = 'concrete' | 'mixed' | 'vague' | 'none'

export interface JdCultureVaguenessReport {
  vagueSignals: VagueCultureSignal[]
  concreteSignals: ConcreteCultureSignal[]
  vagueCount: number
  concreteCount: number
  clarity: CultureClarity
  riskLevel: 'high' | 'medium' | 'low' | 'none'
  summary: string
  interviewQuestions: string[]
}

// ---------------------------------------------------------------------------
// Vague culture patterns
// ---------------------------------------------------------------------------

interface VaguePattern {
  re: RegExp
  type: VagueCultureType
}

const VAGUE_PATTERNS: VaguePattern[] = [
  // Family metaphor
  {
    re: /(?:패밀리|패밀리\s*같은|가족\s*같은|가족\s*같이).{0,6}(?:분위기|문화|팀|환경)/,
    type: 'family_metaphor',
  },
  { re: /(?:한\s*가족|한\s*팀처럼|함께\s*하는\s*가족)/, type: 'family_metaphor' },

  // Passion demand
  { re: /(?:열정\s*있는|열정적인)\s*(?:분|인재|개발자|엔지니어)/, type: 'passion_demand' },
  {
    re: /(?:주도적인|도전적인|적극적인)\s*(?:분|인재)\s*(?:환영|모집|구합니다)/,
    type: 'passion_demand',
  },
  { re: /(?:밤낮\s*없이|언제든지)\s*(?:일할|달릴|뛸)\s*수\s*있는/, type: 'passion_demand' },
  { re: /회사와\s*함께\s*(?:성장하고\s*싶은|크고\s*싶은)\s*분/, type: 'passion_demand' },

  // Vague culture
  {
    re: /(?:자유로운|수평적인|좋은|긍정적인)\s*(?:조직\s*문화|기업\s*문화|분위기)[을를]\s*(?:갖추고|유지|추구|보유)/,
    type: 'vague_culture',
  },
  { re: /(?:소통이\s*잘\s*되는|협업이\s*잘\s*되는)\s*(?:팀|환경|문화)/, type: 'vague_culture' },
  { re: /(?:즐겁게|행복하게)\s*(?:일할\s*수\s*있는|근무하는)\s*환경/, type: 'vague_culture' },

  // Ambiguous growth
  {
    re: /(?:함께\s*성장|같이\s*성장|더불어\s*성장)(?:\s*(?:할\s*수\s*있는|하는|하며|합니다|해요))?/,
    type: 'ambiguous_growth',
  },
  {
    re: /(?:무한한|다양한|폭넓은)\s*(?:성장\s*기회|발전\s*가능성|배움의\s*기회)/,
    type: 'ambiguous_growth',
  },

  // Buzzword diversity
  {
    re: /(?:다양성|포용성|DEI|Diversity)\s*(?:을\s*중요시|을\s*추구|을\s*존중)(?!\s*(?:교육|프로그램|채용\s*목표|대표성))/,
    type: 'buzzword_diversity',
  },

  // Empty values
  {
    re: /(?:핵심\s*가치|코어\s*밸류)\s*[:：]\s*(?:[가-힣A-Za-z]+[,·]\s*){2,}(?:[가-힣A-Za-z]+)(?!\s*(?:란|은|이란|입니다))/,
    type: 'empty_values',
  },
]

// ---------------------------------------------------------------------------
// Concrete culture evidence patterns
// ---------------------------------------------------------------------------

interface ConcretePattern {
  re: RegExp
  type: ConcreteCultureType
}

const CONCRETE_PATTERNS: ConcretePattern[] = [
  // Process evidence
  { re: /(?:코드\s*리뷰\s*문화|PR\s*리뷰\s*필수|코드\s*리뷰\s*필수)/, type: 'process_evidence' },
  {
    re: /(?:스프린트\s*[0-9]+주|애자일\s*개발|스크럼\s*미팅|데일리\s*스탠드업)/,
    type: 'process_evidence',
  },
  {
    re: /(?:회고\s*(?:문화|미팅|진행)|레트로스펙티브|Retrospective)/,
    type: 'process_evidence',
  },
  { re: /(?:페어\s*프로그래밍|몹\s*프로그래밍|TDD\s*문화)/, type: 'process_evidence' },

  // Measurable benefit
  { re: /(?:연봉\s*협상|스톡옵션|RSU)\s*(?:제공|부여|지급|포함)/, type: 'measurable_benefit' },
  {
    re: /(?:[0-9]+만\s*원|[0-9]+억\s*원)\s*(?:복지\s*포인트|복지비|교육비|도서비)/,
    type: 'measurable_benefit',
  },
  {
    re: /(?:연\s*[0-9]+일|기본\s*연차\s*[0-9]+일|연차\s*[0-9]+일\s*이상)/,
    type: 'measurable_benefit',
  },

  // Transparency action
  {
    re: /(?:전사\s*OKR\s*공유|전직원\s*OKR\s*공개|OKR\s*전체\s*공유)/,
    type: 'transparency_action',
  },
  {
    re: /(?:전직원\s*(?:미팅|타운홀|All.hands)|CEO\s*(?:직접|Q&A|소통))/,
    type: 'transparency_action',
  },
  {
    re: /(?:의사결정\s*(?:과정\s*공유|투명하게|모두\s*참여))/,
    type: 'transparency_action',
  },

  // Employee voice
  { re: /(?:1:1\s*미팅|1on1\s*정기|개인\s*면담\s*정기)/, type: 'employee_voice' },
  {
    re: /(?:직원\s*만족도\s*조사|eNPS|직원\s*설문\s*(?:반기|분기|매년))/,
    type: 'employee_voice',
  },
  {
    re: /(?:자유롭게\s*의견\s*제시|누구든\s*의견\s*제안|아이디어\s*제안\s*시스템)/,
    type: 'employee_voice',
  },

  // Diversity action
  {
    re: /(?:여성\s*개발자\s*비율|여성\s*리더십\s*[0-9]+%|다양성\s*채용\s*목표)/,
    type: 'diversity_action',
  },
  {
    re: /(?:장애인\s*고용|다문화\s*구성원|외국인\s*팀원\s*[0-9]+%)/,
    type: 'diversity_action',
  },
]

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function detectJdCultureVagueness(text: string): JdCultureVaguenessReport {
  const t = text ?? ''
  const vagueSignals: VagueCultureSignal[] = []
  const concreteSignals: ConcreteCultureSignal[] = []

  for (const { re, type } of VAGUE_PATTERNS) {
    const m = t.match(re)
    if (m) vagueSignals.push({ type, excerpt: m[0].slice(0, 60) })
  }

  for (const { re, type } of CONCRETE_PATTERNS) {
    const m = t.match(re)
    if (m) concreteSignals.push({ type, excerpt: m[0].slice(0, 60) })
  }

  const vagueCount = vagueSignals.length
  const concreteCount = concreteSignals.length

  let clarity: CultureClarity
  if (concreteCount >= 3 && vagueCount <= 1) clarity = 'concrete'
  else if (concreteCount >= 1 && vagueCount <= 3) clarity = 'mixed'
  else if (vagueCount >= 2) clarity = 'vague'
  else clarity = 'none'

  let riskLevel: JdCultureVaguenessReport['riskLevel']
  if (vagueCount >= 4 && concreteCount === 0) riskLevel = 'high'
  else if (vagueCount >= 2 && concreteCount <= 1) riskLevel = 'medium'
  else if (vagueCount >= 1) riskLevel = 'low'
  else riskLevel = 'none'

  let summary: string
  if (clarity === 'concrete') {
    summary = '구체적인 문화 증거가 풍부합니다. 실제 프로세스·제도가 명시되어 있습니다.'
  } else if (clarity === 'mixed') {
    summary =
      '일부 구체적 내용이 있으나 추상적 표현도 섞여 있습니다. 면접에서 실제 근거를 확인하세요.'
  } else if (clarity === 'vague') {
    summary =
      '추상적인 문화 표현이 많습니다. 실제 프로세스·제도가 거의 언급되지 않아 입사 전 확인이 필요합니다.'
  } else {
    summary = '문화 관련 내용이 거의 없습니다.'
  }

  const interviewQuestions: string[] = []
  if (vagueCount >= 1) {
    interviewQuestions.push('코드 리뷰나 회고 등 실제 개발 프로세스가 어떻게 운영되나요?')
    interviewQuestions.push('팀 문화를 구체적으로 보여주는 최근 사례가 있나요?')
  }
  if (concreteCount === 0) {
    interviewQuestions.push('직원 만족도나 퇴사율이 어떻게 되나요?')
  }

  return {
    vagueSignals,
    concreteSignals,
    vagueCount,
    concreteCount,
    clarity,
    riskLevel,
    summary,
    interviewQuestions,
  }
}
