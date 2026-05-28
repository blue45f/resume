/**
 * 자기소개서 구조 품질 분석 — 단락 수·길이·오프닝 품질·개인화 신호·클로징 CTA 5축 평가.
 */

export type StructureTone = 'good' | 'neutral' | 'warning';

export interface StructureCheck {
  /** Korean check label. */
  label: string;
  /** Pass/warn/fail. */
  status: 'pass' | 'warn' | 'fail';
  /** Korean short message. */
  message: string;
  /** 0-20 score contribution per axis. */
  score: number;
}

export interface CoverLetterStructureReport {
  /** Total word count (Korean: morpheme tokens, English: whitespace words). */
  wordCount: number;
  /** Paragraph count (split on double newline). */
  paragraphCount: number;
  /** Five structural axes. */
  checks: StructureCheck[];
  /** 0-100 overall structure score. */
  score: number;
  tone: StructureTone;
  /** Korean short label. */
  label: string;
  /** Korean one-sentence summary. */
  summary: string;
}

// ---------------------------------------------------------------------------
// Heuristic patterns
// ---------------------------------------------------------------------------

// Weak generic openers (first sentence of first paragraph)
const WEAK_OPENER_RE =
  /^(?:안녕하세요|저는\s+\S+\s*(?:입니다|이며)|지원자\s+\S+\s*입니다|귀사에\s*지원|입사하고\s*싶|이력서와\s*함께|자기소개|아래와\s*같이|다음과\s*같이)/;

// Strong opening signals: "why this company/role" + first-person intent
const STRONG_OPENER_RE =
  /(?:유일한|독보적|핵심|선도|이유는|왜냐하면|관심을\s*갖게|계기가|기여|임팩트|문제를\s*해결|변화를)/;

// Closing CTA patterns
const CLOSING_CTA_RE =
  /(?:함께\s*성장|기여하겠|기여할\s*수\s*있|열심히\s*하겠|최선을\s*다하|면접\s*기회|감사합니다|뵐\s*수\s*있기|성장하겠|배움|노력하겠)/;

// Passive closing patterns to penalize
const PASSIVE_CLOSE_RE = /(?:기회를?\s*주신다면|뽑아\s*주신다면|채용해\s*주(?:신다면|시면))/;

// Personalization signals: company/product/service name mentions
const PERSONALIZATION_RE =
  /(?:귀사|회사|팀|프로덕트|서비스|플랫폼|제품|비전|미션|가치관|고객|사용자|사용자\s*경험)/g;

// ---------------------------------------------------------------------------

function countWords(text: string): number {
  return (text.match(/[가-힣A-Za-z0-9]+/g) ?? []).length;
}

function countParagraphs(text: string): number {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0).length;
}

function getFirstParagraph(text: string): string {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paras[0] ?? '';
}

function getLastParagraph(text: string): string {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paras[paras.length - 1] ?? '';
}

function countPersonalizationSignals(text: string): number {
  const re = new RegExp(PERSONALIZATION_RE.source, 'g');
  return (text.match(re) ?? []).length;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function buildCoverLetterStructureReport(text: string): CoverLetterStructureReport {
  const safe = (text ?? '').trim();

  if (!safe) {
    return {
      wordCount: 0,
      paragraphCount: 0,
      checks: [],
      score: 0,
      tone: 'warning',
      label: '구조 분석 없음',
      summary: '분석할 자기소개서 본문이 없습니다.',
    };
  }

  const wordCount = countWords(safe);
  const paragraphCount = countParagraphs(safe);
  const firstPara = getFirstParagraph(safe);
  const lastPara = getLastParagraph(safe);
  const personCount = countPersonalizationSignals(safe);

  const checks: StructureCheck[] = [];

  // ── Axis 1: Word count (optimal 200–500 Korean words) ──
  {
    let status: StructureCheck['status'];
    let message: string;
    let score: number;
    if (wordCount < 80) {
      status = 'fail';
      message = `${wordCount}단어 — 너무 짧습니다. 200단어 이상으로 늘려 보세요.`;
      score = 0;
    } else if (wordCount < 150) {
      status = 'warn';
      message = `${wordCount}단어 — 조금 짧습니다. 200~500단어가 적정입니다.`;
      score = 10;
    } else if (wordCount <= 550) {
      status = 'pass';
      message = `${wordCount}단어 — 적정 길이입니다.`;
      score = 20;
    } else {
      status = 'warn';
      message = `${wordCount}단어 — 다소 깁니다. 핵심만 담아 500단어 내로 줄여 보세요.`;
      score = 10;
    }
    checks.push({ label: '분량', status, message, score });
  }

  // ── Axis 2: Paragraph count (optimal 3–5) ──
  {
    let status: StructureCheck['status'];
    let message: string;
    let score: number;
    if (paragraphCount < 2) {
      status = 'fail';
      message = `${paragraphCount}단락 — 단락을 나눠 가독성을 높이세요. 최소 3단락이 권장됩니다.`;
      score = 0;
    } else if (paragraphCount === 2) {
      status = 'warn';
      message = `${paragraphCount}단락 — 3~5단락으로 나누면 더 읽기 좋습니다.`;
      score = 12;
    } else if (paragraphCount <= 5) {
      status = 'pass';
      message = `${paragraphCount}단락 — 구조가 잘 잡혀 있습니다.`;
      score = 20;
    } else {
      status = 'warn';
      message = `${paragraphCount}단락 — 단락이 많습니다. 주제를 통합해 5단락 이내로 줄여 보세요.`;
      score = 12;
    }
    checks.push({ label: '단락 구성', status, message, score });
  }

  // ── Axis 3: Opening quality ──
  {
    const firstSentence = firstPara.split(/[.!?。]/)[0] ?? '';
    const isWeak = WEAK_OPENER_RE.test(firstSentence.trim());
    const isStrong = STRONG_OPENER_RE.test(firstPara);
    let status: StructureCheck['status'];
    let message: string;
    let score: number;
    if (isStrong && !isWeak) {
      status = 'pass';
      message = '첫 단락이 구체적인 동기나 관점으로 시작합니다.';
      score = 20;
    } else if (isWeak) {
      status = 'warn';
      message =
        '"안녕하세요" 또는 자기소개로 시작하면 첫 인상이 약해집니다. 구체적 동기로 바꿔 보세요.';
      score = 6;
    } else {
      status = 'warn';
      message = '첫 단락이 "이 회사·직무를 지원하는 이유"로 시작하면 더 인상적입니다.';
      score = 12;
    }
    checks.push({ label: '오프닝 품질', status, message, score });
  }

  // ── Axis 4: Personalization ──
  {
    let status: StructureCheck['status'];
    let message: string;
    let score: number;
    if (personCount >= 5) {
      status = 'pass';
      message = `회사·서비스 관련 언급이 ${personCount}회로 개인화가 잘 되어 있습니다.`;
      score = 20;
    } else if (personCount >= 2) {
      status = 'warn';
      message = `회사·서비스 관련 언급이 ${personCount}회입니다. 더 구체적인 제품명·팀 이름을 추가하면 좋습니다.`;
      score = 12;
    } else {
      status = 'fail';
      message =
        '회사 또는 서비스에 대한 언급이 거의 없습니다. 이 회사를 지원하는 이유를 구체적으로 적어 보세요.';
      score = 0;
    }
    checks.push({ label: '개인화', status, message, score });
  }

  // ── Axis 5: Closing CTA ──
  {
    const hasPassive = PASSIVE_CLOSE_RE.test(lastPara);
    const hasCta = CLOSING_CTA_RE.test(lastPara);
    let status: StructureCheck['status'];
    let message: string;
    let score: number;
    if (hasPassive) {
      status = 'warn';
      message = '"기회를 주신다면" 류 마무리는 수동적입니다. 입사 후 기여 약속으로 바꿔 보세요.';
      score = 6;
    } else if (hasCta) {
      status = 'pass';
      message = '마지막 단락에 구체적인 기여 의지 또는 면접 요청이 담겨 있습니다.';
      score = 20;
    } else {
      status = 'warn';
      message =
        '마지막 단락은 "입사 후 첫 30일 기여 계획" 또는 "면접 기회를 요청"으로 마무리하면 좋습니다.';
      score = 10;
    }
    checks.push({ label: '클로징 CTA', status, message, score });
  }

  const totalScore = checks.reduce((sum, c) => sum + c.score, 0);
  const failCount = checks.filter((c) => c.status === 'fail').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;

  let tone: StructureTone;
  if (totalScore >= 80) tone = 'good';
  else if (totalScore >= 55) tone = 'neutral';
  else tone = 'warning';

  let summary: string;
  if (failCount === 0 && warnCount <= 1) {
    summary = `자기소개서 구조가 탄탄합니다. 내용의 정량 사례 비율을 높이면 더욱 완성도가 올라갑니다.`;
  } else if (failCount >= 2) {
    summary = `구조적으로 ${failCount}개 항목이 취약합니다. 분량·단락·개인화를 먼저 개선하세요.`;
  } else {
    const topWarn = checks.find((c) => c.status === 'fail' || c.status === 'warn');
    summary = `"${topWarn?.label ?? '구조'}" 부분을 개선하면 전체 완성도가 크게 올라갑니다.`;
  }

  return {
    wordCount,
    paragraphCount,
    checks,
    score: totalScore,
    tone,
    label: `구조 ${totalScore}점`,
    summary,
  };
}
