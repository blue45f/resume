import type { Resume } from '@/types/resume';

export interface ReadabilityMetrics {
  /** 전체 단어(또는 어절) 수 */
  wordCount: number;
  /** 문장 수 */
  sentenceCount: number;
  /** 평균 문장 길이 (어절) */
  avgSentenceLength: number;
  /** 가장 긴 문장 */
  longestSentence: string;
  /** 수동태·약한 표현 개수 */
  passiveCount: number;
  /** 액션 동사 사용 개수 */
  actionVerbCount: number;
  /** 정량 성과(숫자+%·원·명 등) 포함 문장 수 */
  quantifiedCount: number;
  /** 0-100 점수 */
  score: number;
  /** 등급 S/A/B/C/D */
  grade: string;
  /** 개선 제안 */
  suggestions: Suggestion[];
}

export interface Suggestion {
  severity: 'info' | 'warning' | 'error';
  section: string;
  message: string;
  example?: string;
}

/** 한국 이력서에서 자주 쓰는 액션 동사 (강한 표현) */
const ACTION_VERBS = [
  '개발',
  '구축',
  '설계',
  '리딩',
  '주도',
  '도입',
  '기획',
  '운영',
  '최적화',
  '개선',
  '구현',
  '배포',
  '자동화',
  '분석',
  '증명',
  '달성',
  '수주',
  '발견',
  '출시',
  '전환',
  '유치',
  '감소',
  '증가',
  '해결',
  '통합',
  '리팩토링',
  '마이그레이션',
];

/** 수동·약한 표현 (피해야 할 패턴) */
const WEAK_PATTERNS = [
  /담당했[었]?습?니다?/,
  /했[었]?던 경험/,
  /수행했?습?니다?/,
  /참여했?습?니다?/,
  /되어?졌[었]?습?니다?/,
  /받았[었]?습?니다?/,
  /노력했/,
  /열심히/,
  /최선을 다/,
];

/** 정량적 수치 패턴 — 숫자 + 단위 또는 % */
const QUANTIFIED_PATTERN =
  /\d+[\s,]*(%|명|건|회|배|원|시간|일|주|개월|년|MAU|DAU|RPS|QPS|ms|KB|MB|GB|TB)/;

export function analyzeReadability(resume: Resume): ReadabilityMetrics {
  const rawText = collectText(resume);
  const text = stripHtml(rawText);

  // 한국어 문장 분리 — . ! ? 와 줄바꿈
  const sentences = text
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);

  // 어절 단위 단어 카운트
  const words = text.split(/\s+/).filter(Boolean);

  let passiveCount = 0;
  let actionVerbCount = 0;
  let quantifiedCount = 0;
  let longestSentence = '';
  let longestLen = 0;

  for (const sent of sentences) {
    const wordsInSent = sent.split(/\s+/).length;
    if (wordsInSent > longestLen) {
      longestLen = wordsInSent;
      longestSentence = sent;
    }

    if (WEAK_PATTERNS.some((p) => p.test(sent))) passiveCount++;
    if (ACTION_VERBS.some((v) => sent.includes(v))) actionVerbCount++;
    if (QUANTIFIED_PATTERN.test(sent)) quantifiedCount++;
  }

  const avgSentenceLength =
    sentences.length > 0 ? Math.round((words.length / sentences.length) * 10) / 10 : 0;

  // 점수 계산 — 4가지 요소 가중합
  // 1. 평균 문장 길이 (12-20 어절이 이상적): 25점
  // 2. 액션 동사 비율 (>40% of sentences): 25점
  // 3. 정량 성과 비율 (>30%): 25점
  // 4. 수동태 억제 (<15%): 25점
  const lenScore =
    avgSentenceLength === 0
      ? 0
      : avgSentenceLength < 8
        ? 10
        : avgSentenceLength <= 20
          ? 25
          : avgSentenceLength <= 30
            ? 18
            : 8;

  const actionRatio = sentences.length > 0 ? actionVerbCount / sentences.length : 0;
  const actionScore = Math.min(25, Math.round(actionRatio * 60));

  const quantifiedRatio = sentences.length > 0 ? quantifiedCount / sentences.length : 0;
  const quantifiedScore = Math.min(25, Math.round(quantifiedRatio * 80));

  const passiveRatio = sentences.length > 0 ? passiveCount / sentences.length : 0;
  const passiveScore = passiveRatio === 0 ? 25 : Math.max(0, 25 - Math.round(passiveRatio * 100));

  const score = lenScore + actionScore + quantifiedScore + passiveScore;
  const grade = score >= 85 ? 'S' : score >= 70 ? 'A' : score >= 55 ? 'B' : score >= 40 ? 'C' : 'D';

  // ── 제안 생성 ─────────────────────────────────────────────
  const suggestions: Suggestion[] = [];

  if (avgSentenceLength > 25) {
    suggestions.push({
      severity: 'warning',
      section: '문장 길이',
      message: `평균 ${avgSentenceLength} 어절로 긴 편. 15-20 어절로 분리하면 가독성 상승.`,
      example: '"…했고 …했고 …했습니다" → 마침표로 끊기',
    });
  }

  if (actionRatio < 0.3 && sentences.length > 3) {
    suggestions.push({
      severity: 'warning',
      section: '액션 동사',
      message: `액션 동사가 ${Math.round(actionRatio * 100)}% 문장에만 쓰임 (30%+ 권장).`,
      example: '"담당했습니다" → "주도해 XX 를 개선했습니다"',
    });
  }

  if (quantifiedRatio < 0.2 && sentences.length > 3) {
    suggestions.push({
      severity: 'warning',
      section: '정량화',
      message: `숫자가 있는 문장 ${Math.round(quantifiedRatio * 100)}% — 성과를 숫자로 증명하세요.`,
      example: '"성능을 개선" → "응답시간 150ms→40ms, 73% 단축"',
    });
  }

  if (passiveRatio > 0.2) {
    suggestions.push({
      severity: 'error',
      section: '수동·약한 표현',
      message: `"담당했습니다/수행했습니다" 류가 ${Math.round(passiveRatio * 100)}%. 주도성을 드러내세요.`,
      example: '"참여했습니다" → "리딩했습니다" / "제안했습니다"',
    });
  }

  if (longestLen > 35) {
    suggestions.push({
      severity: 'info',
      section: '가장 긴 문장',
      message: `${longestLen} 어절짜리 문장이 있음. 두세 문장으로 쪼개세요.`,
    });
  }

  if (suggestions.length === 0 && sentences.length > 0) {
    suggestions.push({
      severity: 'info',
      section: '전반',
      message: '훌륭한 가독성입니다. 더 다양한 액션 동사로 강조 가능.',
    });
  }

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgSentenceLength,
    longestSentence,
    passiveCount,
    actionVerbCount,
    quantifiedCount,
    score,
    grade,
    suggestions,
  };
}

/** 이력서 전체에서 분석 대상 텍스트 수집 */
function collectText(resume: Resume): string {
  const parts: string[] = [];
  if (resume.personalInfo.summary) parts.push(resume.personalInfo.summary);
  for (const e of resume.experiences) {
    if (e.description) parts.push(e.description);
    if (e.achievements) parts.push(e.achievements);
  }
  for (const p of resume.projects) {
    if (p.description) parts.push(p.description);
  }
  return parts.join('\n');
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
