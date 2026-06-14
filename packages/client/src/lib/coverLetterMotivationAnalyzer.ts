export type MotivationClarity = 'specific' | 'generic' | 'missing'

export interface MotivationSignal {
  type: 'company_specific' | 'role_specific' | 'generic' | 'problem_driven'
  phrase: string
}

export interface MotivationReport {
  clarity: MotivationClarity
  signals: MotivationSignal[]
  genericCount: number
  specificCount: number
  suggestion: string
  tip: string
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

const COMPANY_SPECIFIC_PATTERNS: RegExp[] = [
  /귀사(?:의|가)\s*(?:\S+?\s*){0,6}(?:서비스|제품|기술|미션|비전|문화|플랫폼|앱|프로젝트)/,
  /(?:을|를|이|가)\s*(?:사용|경험|이용|써\s*봤|활용)(?:하며|하면서|하고)/,
  /귀사\s*(?:가\s*[가-힣]+\s*에\s*(?:앞장|선도|집중)|에서\s*[가-힣]+\s*(?:문제|과제))/,
  /(?:출시하신|개발하신|만드신)\s*\S+/,
  /귀사의\s*\S+\s*(?:에\s*(?:감명|공감|인상)|을\s*보며)/,
]

const ROLE_SPECIFIC_PATTERNS: RegExp[] = [
  /이\s*(?:포지션|직무|직책|역할)(?:에서|에\s*필요한|을\s*통해)/,
  /(?:백엔드|프론트엔드|풀스택|데이터|인프라|iOS|Android|AI|ML|DevOps)\s*(?:개발자|엔지니어|분석가)\s*(?:로서|로\s*서)/,
  /(?:해당\s*)?(?:직무|포지션|역할)\s*(?:수행|달성|기여|집중)/,
  /\d+년(?:간)?\s*(?:쌓아\s*온)?\s*(?:\S+\s*){0,4}(?:경험|역량|능력|기술)(?:이|이\s*있어|을\s*통해)/,
  /(?:귀사|이\s*회사)\s*(?:에서|의)\s*(?:\S+\s*){0,3}(?:개발|운영|분석|기획|설계|구현)/,
]

const PROBLEM_DRIVEN_PATTERNS: RegExp[] = [
  /(?:현재|지금)\s*(?:귀사|해당\s*팀|이\s*분야)(?:가|에서)\s*(?:겪고\s*있는|직면한|해결해야\s*할)/,
  /(?:불편함|문제점|Pain\s*point|페인\s*포인트)\s*(?:을|를)\s*(?:해결|개선|해소)/,
  /(?:기술적|사업적|운영상)\s*(?:도전|과제|문제)(?:를|을)\s*(?:해결|개선)/,
]

const GENERIC_MOTIVATION_PATTERNS: Array<{ re: RegExp; phrase: string }> = [
  { re: /성장하고\s*싶어서/, phrase: '성장하고 싶어서' },
  { re: /좋은\s*회사/, phrase: '좋은 회사' },
  { re: /관심(?:이\s*있어|이\s*많아|을\s*갖고)/, phrase: '관심이 있어서' },
  { re: /훌륭한\s*팀/, phrase: '훌륭한 팀' },
  { re: /꿈꿔\s*왔(?:던|습니다)/, phrase: '꿈꿔왔습니다' },
  { re: /동경해\s*왔/, phrase: '동경해왔습니다' },
  { re: /평소에?\s*(?:관심|주목)/, phrase: '평소에 관심' },
  { re: /귀사에\s*(?:지원하게|지원을\s*하게)\s*되었/, phrase: '귀사에 지원하게 되었습니다' },
  { re: /(?:많은|풍부한)\s*성장(?:을|이|이\s*가능한)/, phrase: '많은 성장이 가능한' },
  { re: /안정적인\s*(?:직장|환경|회사)/, phrase: '안정적인 직장' },
]

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function analyzeCoverLetterMotivation(text: string): MotivationReport {
  const t = text ?? ''
  const signals: MotivationSignal[] = []

  for (const re of COMPANY_SPECIFIC_PATTERNS) {
    const m = t.match(re)
    if (m) {
      signals.push({ type: 'company_specific', phrase: m[0].slice(0, 40) })
    }
  }

  for (const re of ROLE_SPECIFIC_PATTERNS) {
    const m = t.match(re)
    if (m) {
      signals.push({ type: 'role_specific', phrase: m[0].slice(0, 40) })
    }
  }

  for (const re of PROBLEM_DRIVEN_PATTERNS) {
    const m = t.match(re)
    if (m) {
      signals.push({ type: 'problem_driven', phrase: m[0].slice(0, 40) })
    }
  }

  const genericHits: MotivationSignal[] = []
  for (const { re, phrase } of GENERIC_MOTIVATION_PATTERNS) {
    if (re.test(t)) {
      genericHits.push({ type: 'generic', phrase })
    }
  }

  const specificCount = signals.filter((s) => s.type !== 'generic').length
  const genericCount = genericHits.length
  const allSignals = [...signals, ...genericHits]

  let clarity: MotivationClarity
  if (specificCount >= 2) {
    clarity = 'specific'
  } else if (specificCount === 0 && genericCount === 0) {
    clarity = 'missing'
  } else {
    clarity = 'generic'
  }

  let suggestion: string
  let tip: string

  if (clarity === 'specific') {
    suggestion = '회사·직무에 특화된 지원 동기가 잘 드러납니다.'
    tip = '구체적인 서비스명이나 수치를 한 문장 더 추가하면 더욱 설득력이 높아집니다.'
  } else if (clarity === 'generic') {
    suggestion = '지원 동기가 다소 막연합니다. 귀사의 특정 서비스·기술·문화를 언급하세요.'
    tip = `"귀사의 [구체 제품/기술]을 직접 사용해 보며 [구체 감상]을 느꼈습니다" 형태로 작성해 보세요.`
  } else {
    suggestion =
      '지원 동기가 명확히 드러나지 않습니다. 왜 이 회사·이 직무인지 한 단락을 추가하세요.'
    tip =
      '"[회사 이름]이 [미션/서비스]를 통해 해결하려는 문제가 제가 경험한 [구체 경험]과 일치합니다" 형태로 시작해 보세요.'
  }

  return { clarity, signals: allSignals, genericCount, specificCount, suggestion, tip }
}
