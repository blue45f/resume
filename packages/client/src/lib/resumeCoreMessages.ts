/**
 * 이력서 핵심 메시지 추출 — koreanChecker 생태계의 파생 분석기.
 *
 * `extractQuotableLines`(임팩트 문장 Top-N)에서 한 걸음 더 나아가,
 * 이력서 전체에서 "가장 강력한 핵심 메시지"를 뽑아 (1) 강도 점수화,
 * (2) 카테고리 분류(성취/전문성/성장/리더십/임팩트), (3) 상위 배치 추천을 한다.
 *
 * 배경: 한국 채용담당자는 처음 30초에 이력서의 강점을 판단하고, 자기소개·경력
 * 첫 문단에 "가장 임팩트 있는 3가지"를 먼저 배치하는 관례가 있다. 이 분석기는
 * 여러 경력/프로젝트 중 어느 메시지를 앞세울지 객관적 순위로 제안한다.
 *
 * 순수 함수(no DOM/network) — vitest 로 검증.
 */

export type CoreMessageCategory =
  | 'achievement' // 수상·선정·합격 등 객관적 성취
  | 'leadership' // 주도·총괄·팀 리딩
  | 'impact' // 절감·단축·매출 등 비즈니스 임팩트
  | 'growth' // 성장·향상·확장
  | 'expertise' // 설계·구현·구축 등 전문 역량 (기본값)

export interface CoreMessage {
  message: string
  strength: number // 0~100
  category: CoreMessageCategory
  signals: {
    quantified: boolean // 수치/정량 표현 포함
    strongVerb: boolean // 강한 액션 동사 포함
    proper: boolean // 회사/기술 등 고유명사 포함
    achievement: boolean // 객관적 성취 키워드 포함
  }
}

export interface CoreMessagesAnalysis {
  messages: CoreMessage[] // 강도 내림차순 전체 후보
  top: CoreMessage[] // 상위 배치 추천 (최대 topN)
  averageStrength: number // top 메시지 평균 강도
  level: 'none' | 'low' | 'medium' | 'high'
  suggestion: string
}

const STRONG_VERBS = [
  '주도',
  '설계',
  '구현',
  '개발',
  '달성',
  '개선',
  '최적화',
  '구축',
  '런칭',
  '출시',
  '제안',
  '기획',
  '발굴',
  '창출',
  '확장',
  '배포',
  '도입',
  '정립',
  '혁신',
  '단축',
  '절감',
]

const ACHIEVEMENT_KEYWORDS = [
  '수상',
  '1등',
  '1위',
  '금상',
  '대상',
  '입상',
  '장학금',
  '우수상',
  '최우수',
  '선정',
  '인증',
  '자격증',
  '합격',
  '당선',
  '우승',
]

const LEADERSHIP_KEYWORDS = [
  '주도',
  '리딩',
  '리드',
  '이끌',
  '총괄',
  '팀장',
  '멘토',
  '관리',
  'PM',
  'PL',
  '책임',
]

const IMPACT_KEYWORDS = [
  '절감',
  '단축',
  '매출',
  '비용',
  '전환',
  '효율',
  '수익',
  'ROI',
  '생산성',
  '이탈',
  '리텐션',
]

const GROWTH_KEYWORDS = ['성장', '향상', '증가', '확장', '개선', '상승', '도달']

// 수치/정량 표현 (extractQuotableLines 와 동일 계열 패턴)
const NUMERIC_RE =
  /\d+(?:[.,]\d+)?\s*(?:%|배|년|개월|주|일|시간|원|만원|억|건|명|회|차|번|등|위|점|개|배포|만)|상위\s*\d+|TOP\s*\d+/i

const PROPER_RE =
  /\b[A-Z][A-Za-z0-9.+#]{1,}\b|(네이버|카카오|삼성|LG|SK|현대|쿠팡|토스|배민|당근|라인|NHN|KT|우아한형제들|컬리|야놀자|직방|뱅크샐러드)/

function classify(s: string): CoreMessageCategory {
  if (ACHIEVEMENT_KEYWORDS.some((k) => s.includes(k))) return 'achievement'
  if (LEADERSHIP_KEYWORDS.some((k) => s.includes(k))) return 'leadership'
  if (IMPACT_KEYWORDS.some((k) => s.includes(k))) return 'impact'
  if (GROWTH_KEYWORDS.some((k) => s.includes(k))) return 'growth'
  return 'expertise'
}

/**
 * 텍스트를 문장/구 단위로 분해 — 종결부호 + 줄바꿈 + bullet 기호 기준.
 */
function splitMessages(text: string): string[] {
  return (text ?? '')
    .split(/[.!?。\n\r•·▪◦‣•]|(?:\s-\s)/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length >= 12 && s.length <= 200)
}

function scoreMessage(s: string): { strength: number; signals: CoreMessage['signals'] } {
  const quantified = NUMERIC_RE.test(s)
  const strongVerb = STRONG_VERBS.some((v) => s.includes(v))
  const proper = PROPER_RE.test(s)
  const achievement = ACHIEVEMENT_KEYWORDS.some((k) => s.includes(k))

  let score = 0
  if (quantified) score += 35
  if (strongVerb) score += 25
  if (achievement) score += 20
  if (proper) score += 12
  // 길이 스윗스팟: 너무 짧지도 길지도 않은 메시지가 읽기 좋다
  if (s.length >= 25 && s.length <= 120) score += 8
  return {
    strength: Math.min(100, score),
    signals: { quantified, strongVerb, proper, achievement },
  }
}

/**
 * 이력서 텍스트에서 핵심 메시지를 추출·점수화·분류하고 상위 배치 후보를 추천한다.
 *
 * @param text 이력서 전체 텍스트(buildResumePlainText 결과 등)
 * @param topN 추천 상위 메시지 개수 (기본 5)
 */
export function extractResumeCoreMessages(text: string, topN = 5): CoreMessagesAnalysis {
  const candidates = splitMessages(text)
  const scored: CoreMessage[] = []
  const seen = new Set<string>()

  for (const s of candidates) {
    // 중복(동일 문장) 제거
    const key = s.toLowerCase().replace(/\s+/g, '')
    if (seen.has(key)) continue
    const { strength, signals } = scoreMessage(s)
    if (strength === 0) continue // 신호가 전혀 없는 평이한 문장은 제외
    seen.add(key)
    scored.push({ message: s, strength, category: classify(s), signals })
  }

  scored.sort((a, b) => b.strength - a.strength || b.message.length - a.message.length)
  const top = scored.slice(0, topN)
  const averageStrength = top.length
    ? Math.round(top.reduce((sum, m) => sum + m.strength, 0) / top.length)
    : 0

  // 강도 상한: 수치+강한동사+길이 ≈ 68 이 "강한 메시지"의 현실적 수준이므로
  // high 임계값을 62 로 둔다(고유명사·성취까지 더하면 80~100).
  let level: CoreMessagesAnalysis['level']
  if (top.length === 0) level = 'none'
  else if (averageStrength >= 62) level = 'high'
  else if (averageStrength >= 42) level = 'medium'
  else level = 'low'

  let suggestion: string
  if (level === 'none') {
    suggestion =
      '강조할 핵심 메시지가 감지되지 않았습니다. 수치·강한 동사(주도·구현·달성)·성과 키워드를 넣어 성과 중심으로 다시 써 보세요.'
  } else {
    const strongest = top[0]
    const lead =
      strongest.message.length > 40 ? strongest.message.slice(0, 40) + '…' : strongest.message
    if (level === 'high') {
      suggestion = `핵심 메시지가 강력합니다. 가장 강한 "${lead}"를 자기소개·경력 첫 줄에 배치해 30초 안에 강점이 드러나게 하세요.`
    } else if (level === 'medium') {
      suggestion = `핵심 메시지가 적정 수준입니다. "${lead}"를 앞세우고, 약한 메시지에는 수치를 더해 강도를 높이세요.`
    } else {
      suggestion = `핵심 메시지의 강도가 낮습니다. "${lead}" 같은 문장에 구체 수치와 강한 동사를 더해 임팩트를 키우세요.`
    }
  }

  return { messages: scored, top, averageStrength, level, suggestion }
}

export const CORE_MESSAGE_CATEGORY_LABELS: Record<CoreMessageCategory, string> = {
  achievement: '성취',
  leadership: '리더십',
  impact: '임팩트',
  growth: '성장',
  expertise: '전문성',
}
