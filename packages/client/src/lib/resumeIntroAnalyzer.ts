/**
 * 이력서 자기소개/요약 문단 품질 분석 모듈.
 *
 * 제공:
 * - extractResumeIntro: 첫 섹션 헤더 이전 도입부 추출 (최대 300자)
 * - analyzeResumeIntro: 경력 명시 여부 / 클리셰 여부 / 수치 포함 여부 → 강도 평가
 *
 * 관련 타입: IntroStrengthReport.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Markers that signal a new section heading in Korean resumes. */
const SECTION_HEADER_RE =
  /^(?:경력\s*사항|경\s*력|학\s*력|학력\s*사항|기술\s*스택|보유\s*기술|자격\s*증|수\s*상|프로젝트|활\s*동|병\s*역|어\s*학)/m

/**
 * Extract the intro paragraph — text that appears before the first section
 * header, trimmed to 300 chars max.
 */
export function extractResumeIntro(text: string): string {
  const t = (text ?? '').trim()
  const match = SECTION_HEADER_RE.exec(t)
  const raw = match ? t.slice(0, match.index).trim() : t.slice(0, 300).trim()
  return raw.slice(0, 300)
}

// ---------------------------------------------------------------------------
// Cliché patterns — generic Korean resume bio phrases
// ---------------------------------------------------------------------------

const CLICHE_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /성실하고?\s*(?:책임감\s*있는?|열심히)?/, label: '성실하고' },
  { pattern: /열정(?:적인|을\s*가진|이\s*넘치는?)/, label: '열정적인' },
  { pattern: /책임감\s*(?:있는?|강한?|이\s*강한?)/, label: '책임감 있는' },
  { pattern: /최선을\s*다하/, label: '최선을 다하' },
  { pattern: /끊임없이?\s*(?:노력|성장|도전)/, label: '끊임없이 노력/성장' },
  { pattern: /항상\s*(?:배우|성장|노력)/, label: '항상 배우/성장' },
  { pattern: /함께\s*성장/, label: '함께 성장' },
  { pattern: /긍정적인?\s*사고/, label: '긍정적인 사고' },
  { pattern: /능동적이고?\s*(?:적극적인?)?/, label: '능동적이고 적극적인' },
  { pattern: /조직에?\s*기여/, label: '조직에 기여' },
  { pattern: /입사하고\s*싶/, label: '입사하고 싶' },
  { pattern: /귀사에\s*(?:지원|기여)/, label: '귀사에 지원/기여' },
]

// ---------------------------------------------------------------------------
// Career claim patterns — specific job role + years signal
// ---------------------------------------------------------------------------

const CAREER_CLAIM_RE =
  /(?:\d+\s*(?:년|년\s*이상|년차)\s*(?:경력|이상)?\s*(?:의\s*)?(?:[가-힣A-Za-z]+\s*){0,3}(?:개발자|엔지니어|디자이너|기획자|분석가|마케터|데이터|PM|PO|HW|BE|FE|FS|iOS|Android|DevOps|ML|AI|QA|UX|UI)|(?:프론트엔드|백엔드|풀스택|iOS|안드로이드|클라우드|데이터|AI|ML|DevOps|임베디드|게임|보안)\s*(?:개발자|엔지니어))/i

// Metric patterns (percent, money, count) — 년차/년이상은 경력 표현이므로 제외
// 한국 숫자 단위(만·억·천) + 명·원·건·개·% 등을 폭넓게 인식
const METRIC_RE =
  /\d+\s*(?:만\s*)?(?:%|명|억\s*원?|천만\s*원?|만원|개월|건|개|배|다운로드|사용자|고객|년(?!차|이상|경력|째))/

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export interface IntroStrengthReport {
  /** Extracted intro text (up to 300 chars). */
  intro: string
  /** True if intro mentions specific role + years. */
  hasCareerClaim: boolean
  /** List of generic cliché phrases found. */
  clicheHits: string[]
  /** True if intro contains at least one metric/number. */
  hasMetric: boolean
  /** Overall intro quality. */
  strength: 'strong' | 'moderate' | 'weak'
  /** Korean improvement hint. */
  suggestion: string
}

/**
 * 이력서 도입부 강도 평가.
 *
 * - strong: 경력 명시 + 수치 포함 + 클리셰 없음
 * - moderate: 경력 명시 OR 클리셰가 1개 이하
 * - weak: 경력 미명시 AND 클리셰 다수
 */
export function analyzeResumeIntro(text: string): IntroStrengthReport {
  const intro = extractResumeIntro(text)

  if (!intro || intro.length < 15) {
    return {
      intro,
      hasCareerClaim: false,
      clicheHits: [],
      hasMetric: false,
      strength: 'weak',
      suggestion: '도입부가 없거나 너무 짧습니다. 2-3 문장으로 핵심 경력 요약을 작성하세요.',
    }
  }

  const hasCareerClaim = CAREER_CLAIM_RE.test(intro)
  const clicheHits = CLICHE_PATTERNS.filter(({ pattern }) => pattern.test(intro)).map(
    (c) => c.label
  )
  const hasMetric = METRIC_RE.test(intro)

  let strength: IntroStrengthReport['strength']
  if (hasCareerClaim && hasMetric && clicheHits.length === 0) {
    strength = 'strong'
  } else if (hasCareerClaim || clicheHits.length <= 1) {
    strength = 'moderate'
  } else {
    strength = 'weak'
  }

  let suggestion: string
  if (strength === 'strong') {
    suggestion = '도입부가 구체적이고 설득력 있습니다.'
  } else if (!hasCareerClaim && clicheHits.length >= 2) {
    suggestion =
      '클리셰 표현을 줄이고, "N년 경력의 백엔드 개발자"처럼 구체적 직무+연차로 시작하세요.'
  } else if (!hasCareerClaim) {
    suggestion = '"5년 경력의 프론트엔드 개발자"처럼 직무와 연차를 명시하면 강도가 높아집니다.'
  } else if (!hasMetric) {
    suggestion =
      '수치(예: "서비스 사용자 100만 명", "응답속도 40% 개선")를 포함하면 더 설득력이 생깁니다.'
  } else {
    suggestion = '클리셰 표현을 줄이면 도입부가 더 강해집니다.'
  }

  return { intro, hasCareerClaim, clicheHits, hasMetric, strength, suggestion }
}
