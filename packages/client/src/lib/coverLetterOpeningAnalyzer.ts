/**
 * 자기소개서 첫 문장 강도 분석 모듈.
 *
 * 제공:
 * - analyzeCoverLetterOpening: 자기소개서 첫 문단(첫 100자 이내) 강도 평가
 *
 * 관련 타입: OpeningStrength, OpeningReport.
 */

export type OpeningStrength = 'strong' | 'moderate' | 'weak';

export interface OpeningReport {
  firstSentence: string;
  strength: OpeningStrength;
  hasMetric: boolean;
  hasSpecificRole: boolean;
  hasGenericGreeting: boolean;
  genericPhrases: string[];
  suggestion: string;
}

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

const GENERIC_OPENINGS: Array<{ re: RegExp; label: string }> = [
  { re: /^안녕하세요/, label: '"안녕하세요" 시작 (인사로 시작 — 임팩트 없음)' },
  { re: /귀\s*사에\s*(?:지원|입사)/, label: '"귀사에 지원" (클리셰 시작)' },
  { re: /저는\s*(?:항상|언제나|늘)\s*(?:꿈|목표|노력|열정)/, label: '추상적 꿈·열정 시작' },
  { re: /어릴\s*(?:때|적)\s*(?:부터|서부터)/, label: '"어릴 때부터" 회고 시작' },
  { re: /성실하고\s*(?:열정|책임|꼼꼼)/, label: '성실·열정·책임감 나열 시작' },
  { re: /(?:열정|열심|최선)\s*을\s*다해/, label: '"열정을 다해" 시작' },
  { re: /(?:저는|본인은)\s*(?:차별화|남다른|특별한)/, label: '"남다른/차별화" 자아 표현' },
  { re: /부족하지만/, label: '"부족하지만" 자기 비하 시작' },
  { re: /(?:꿈을\s*이루기|목표를\s*향해)/, label: '꿈·목표 향한다는 추상 표현' },
];

const ROLE_RE =
  /(?:개발자|엔지니어|디자이너|기획자|마케터|데이터\s*분석|PM|PO|백엔드|프론트엔드|풀스택|iOS|Android|AI|ML|DevOps)/i;

const METRIC_RE = /\d+\s*(?:%|명|억|만원|천만|건|개월|년|개)/;

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

/**
 * 자기소개서 첫 문단에서 첫 문장을 추출하고 강도를 평가.
 */
export function analyzeCoverLetterOpening(text: string): OpeningReport {
  const t = (text ?? '').trim();
  const firstSentence = (t.match(/^[^.!?。\n]{5,120}[.!?。]?/) ?? [''])[0].trim();

  const genericPhrases = GENERIC_OPENINGS.filter(({ re }) => re.test(firstSentence)).map(
    ({ label }) => label,
  );

  const hasGenericGreeting = /^안녕하세요/.test(firstSentence);
  const hasMetric = METRIC_RE.test(firstSentence);
  const hasSpecificRole = ROLE_RE.test(firstSentence);

  let strength: OpeningStrength;
  if (genericPhrases.length === 0 && (hasMetric || hasSpecificRole)) {
    strength = 'strong';
  } else if (genericPhrases.length <= 1 && !hasGenericGreeting) {
    strength = 'moderate';
  } else {
    strength = 'weak';
  }

  let suggestion: string;
  if (strength === 'strong') {
    suggestion = '첫 문장이 구체적이고 인상적입니다.';
  } else if (strength === 'moderate') {
    suggestion = hasSpecificRole
      ? '첫 문장에 구체적인 수치(성과, 기간, 규모)를 추가하면 더 강한 첫인상을 줄 수 있습니다.'
      : '직무명·기술·구체적 성과를 첫 문장에 배치하면 채용 담당자 주목도가 높아집니다.';
  } else {
    suggestion =
      '첫 문장이 너무 일반적입니다. "3년간 React로 MAU 10만 서비스를 개발한 프론트엔드 개발자입니다"와 같이 직무·기간·성과를 담은 문장으로 시작하세요.';
  }

  return {
    firstSentence: firstSentence.slice(0, 100),
    strength,
    hasMetric,
    hasSpecificRole,
    hasGenericGreeting,
    genericPhrases,
    suggestion,
  };
}
