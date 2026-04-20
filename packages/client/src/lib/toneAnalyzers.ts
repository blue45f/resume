/**
 * 문단·톤·인칭·언어 혼합 분석 모듈 — koreanChecker.ts 에서 분리.
 *
 * 공통 주제: 본문 전반의 "톤·스타일" 신호 측정.
 *
 * - analyzeParagraphs: 문단 수·평균 길이·과소/과대 문단 비율
 * - analyzeFirstPersonUsage: 1인칭 대명사(저는·제가·저를) per-100자 비율
 * - analyzeEnglishMix: 한글 vs 영문 토큰 비율
 * - analyzeSentiment: 긍정/부정 어휘 분포 → tone 추정
 */

export interface ParagraphStats {
  count: number;
  avgLength: number;
  shortParagraphs: number; // <50자
  longParagraphs: number; // >500자
  idealRatio: number; // 100~300자 범위 비율 (0~1)
  suggestion: string;
}

/**
 * 문단 구조 분석 — 문단 수 · 길이 분포 · 너무 길거나 짧은 문단 검출.
 * 이상적 자소서 문단: 100~300자. 50자 이하 "짧은 조각" 혹은 500자 이상 "벽 같은 덩어리" 경고.
 */
export function analyzeParagraphs(text: string): ParagraphStats {
  const t = (text ?? '').trim();
  if (!t) {
    return {
      count: 0,
      avgLength: 0,
      shortParagraphs: 0,
      longParagraphs: 0,
      idealRatio: 0,
      suggestion: '본문이 비어 있습니다.',
    };
  }
  const paragraphs = t
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const count = paragraphs.length;
  const lengths = paragraphs.map((p) => p.length);
  const avgLength = count > 0 ? Math.round(lengths.reduce((a, b) => a + b, 0) / count) : 0;
  const shortParagraphs = lengths.filter((l) => l < 50).length;
  const longParagraphs = lengths.filter((l) => l > 500).length;
  const idealCount = lengths.filter((l) => l >= 100 && l <= 300).length;
  const idealRatio = count > 0 ? Math.round((idealCount / count) * 100) / 100 : 0;
  let suggestion = '';
  if (count === 1 && lengths[0] > 300) {
    suggestion = `본문이 한 문단(${lengths[0]}자)로만 구성 — 빈 줄로 2~4 문단 분리 권장.`;
  } else if (longParagraphs > 0) {
    suggestion = `긴 문단(>500자) ${longParagraphs}개 — 독자가 부담스러워 합니다. 분리하세요.`;
  } else if (shortParagraphs > count / 2) {
    suggestion = `짧은 문단(<50자) 비율 높음 (${shortParagraphs}/${count}) — 문장을 엮어 흐름을 만드세요.`;
  } else if (idealRatio >= 0.6) {
    suggestion = `문단 구성이 안정적입니다 (이상 범위 ${Math.round(idealRatio * 100)}%).`;
  } else {
    suggestion = `이상 문단 길이(100~300자) 비율 ${Math.round(idealRatio * 100)}% — 문단을 균일화해 보세요.`;
  }
  return { count, avgLength, shortParagraphs, longParagraphs, idealRatio, suggestion };
}

export interface FirstPersonAnalysis {
  counts: Record<'저는' | '제가' | '저를' | '저의' | '제', number>;
  total: number;
  per100Chars: number;
  level: 'low' | 'medium' | 'high';
  suggestion: string;
}

/**
 * 1인칭 대명사 남용 분석 — "저는/제가/제/저를" 과잉 사용은 유아적 인상. 이력서/자소서에서
 * 1인칭을 생략해도 한국어는 자연스러움. per-100자 비율로 평가.
 */
export function analyzeFirstPersonUsage(text: string): FirstPersonAnalysis {
  const t = text ?? '';
  const counts: FirstPersonAnalysis['counts'] = {
    저는: (t.match(/(?<![가-힣])저는(?![가-힣])/g) ?? []).length,
    제가: (t.match(/(?<![가-힣])제가(?![가-힣])/g) ?? []).length,
    저를: (t.match(/(?<![가-힣])저를(?![가-힣])/g) ?? []).length,
    저의: (t.match(/(?<![가-힣])저의(?![가-힣])/g) ?? []).length,
    제: (t.match(/(?<![가-힣])제\s/g) ?? []).length,
  };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const chars = t.replace(/\s+/g, '').length || 1;
  const per100Chars = Math.round((total / chars) * 10000) / 100;
  let level: FirstPersonAnalysis['level'];
  if (per100Chars < 0.8) level = 'low';
  else if (per100Chars < 1.6) level = 'medium';
  else level = 'high';
  const suggestion =
    total === 0
      ? '1인칭 대명사가 거의 없습니다 — 자연스러운 상태.'
      : level === 'low'
        ? `1인칭 사용 ${total}회 (100자당 ${per100Chars}회) — 적정 수준.`
        : level === 'medium'
          ? `1인칭 사용 ${total}회 (100자당 ${per100Chars}회) — 일부는 주어 생략 가능한지 검토하세요.`
          : `1인칭 과다 (${total}회, 100자당 ${per100Chars}회) — 한국어는 주어를 생략해도 자연스럽습니다.`;
  return { counts, total, per100Chars, level, suggestion };
}

export interface EnglishMixAnalysis {
  koreanChars: number;
  englishChars: number;
  englishRatio: number; // 0~1
  level: 'low' | 'medium' | 'high';
  suggestion: string;
}

/**
 * 한국어 본문 내 영어 혼재 비율 — 불필요한 영어 삽입(카더라체/버즈워드) 과잉을 포착.
 * 한글 vs 영문 토큰 비율로 평가. 기술·전문 용어는 제외(detectSkillMentions 이 걸러줌).
 */
export function analyzeEnglishMix(text: string): EnglishMixAnalysis {
  const t = text ?? '';
  const koreanChars = (t.match(/[가-힣]/g) ?? []).length;
  const englishChars = (t.match(/[A-Za-z]/g) ?? []).length;
  const total = koreanChars + englishChars;
  const englishRatio = total === 0 ? 0 : Math.round((englishChars / total) * 1000) / 1000;
  let level: EnglishMixAnalysis['level'];
  if (englishRatio < 0.1) level = 'low';
  else if (englishRatio < 0.25) level = 'medium';
  else level = 'high';
  const suggestion =
    total === 0
      ? '분석할 본문이 없습니다.'
      : level === 'low'
        ? '한국어 중심 문체입니다.'
        : level === 'medium'
          ? `영문 비율 ${Math.round(englishRatio * 100)}% — 기술 용어 외 일반 어휘는 한국어로 표현할 수 있는지 검토.`
          : `영문 비율이 ${Math.round(englishRatio * 100)}% 로 높습니다. 한국어로 대체 가능한 표현을 우선 사용하세요.`;
  return { koreanChars, englishChars, englishRatio, level, suggestion };
}

const POSITIVE_WORDS = [
  '성장',
  '성공',
  '달성',
  '우수',
  '탁월',
  '도전',
  '열정',
  '성실',
  '책임',
  '기여',
  '협력',
  '극복',
  '개선',
  '혁신',
  '효율',
  '최적화',
  '성과',
  '경험',
  '배움',
  '자신감',
  '즐거움',
  '보람',
  '만족',
  '감사',
];

const NEGATIVE_WORDS = [
  '실패',
  '어려움',
  '힘들',
  '부족',
  '한계',
  '좌절',
  '후회',
  '아쉬움',
  '고민',
  '스트레스',
  '불안',
  '걱정',
  '고민',
  '갈등',
  '위기',
  '문제점',
  '약점',
  '단점',
  '실수',
];

export interface SentimentAnalysis {
  positiveCount: number;
  negativeCount: number;
  ratio: number; // positive / (pos + neg), 0~1
  tone: 'positive' | 'balanced' | 'negative' | 'none';
  suggestion: string;
}

/**
 * 감성 분석 — 본문의 긍정/부정 어휘 비율로 전반적 어조(tone) 추정. 이력서·자소서는
 * 일반적으로 긍정 우세가 자연스럽지만, 과잉 긍정은 경계 신호.
 */
export function analyzeSentiment(text: string): SentimentAnalysis {
  const t = text ?? '';
  let positiveCount = 0;
  let negativeCount = 0;
  for (const w of POSITIVE_WORDS) {
    positiveCount += (t.match(new RegExp(w, 'g')) ?? []).length;
  }
  for (const w of NEGATIVE_WORDS) {
    negativeCount += (t.match(new RegExp(w, 'g')) ?? []).length;
  }
  const total = positiveCount + negativeCount;
  const ratio = total === 0 ? 0.5 : Math.round((positiveCount / total) * 100) / 100;
  let tone: SentimentAnalysis['tone'];
  if (total === 0) tone = 'none';
  else if (ratio >= 0.75) tone = 'positive';
  else if (ratio >= 0.4) tone = 'balanced';
  else tone = 'negative';
  const suggestion =
    tone === 'none'
      ? '감성 어휘가 감지되지 않았습니다.'
      : tone === 'positive'
        ? ratio >= 0.95
          ? `과잉 긍정(${Math.round(ratio * 100)}%) — 도전·실패 경험도 녹여 내면 신뢰도 상승.`
          : `긍정 어조 (${Math.round(ratio * 100)}%) — 자연스러운 이력서 톤.`
        : tone === 'balanced'
          ? '긍정·부정 균형. 도전 극복 서사가 드러나면 효과적.'
          : `부정 어조 비율이 높습니다 (부정 ${Math.round((1 - ratio) * 100)}%) — 극복·배움 위주로 재구성.`;
  return { positiveCount, negativeCount, ratio, tone, suggestion };
}
