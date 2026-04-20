/**
 * 성취 신호 분석 모듈 — 정량지표·액션동사·수상 키워드. koreanChecker.ts 에서 분리.
 *
 * 공통 주제: "이력서가 실제로 성과를 증명하는가" 신호 측정.
 *
 * - analyzeQuantification: %/기간/금액/순위 등 정량 표현 밀도
 * - analyzeActionVerbs: 강한 동사(주도·구현) vs 약한 동사(담당·참여) 비율
 * - countAchievements: 수상·자격증·선정 등 객관적 성취 키워드 카운트
 */

export interface QuantificationAnalysis {
  total: number;
  percents: number; // N%
  numerics: number; // 일반 숫자 (10, 100, 1,000)
  periods: number; // N년/N개월/N주
  currencies: number; // 원/달러/만원/억
  rankings: number; // 1위, 상위 N%
  level: 'none' | 'low' | 'medium' | 'high';
  suggestion: string;
}

/**
 * 수치/정량 지표 분석 — 좋은 이력서는 숫자로 성과를 증명한다.
 * 퍼센트(%)·횟수·기간·금액·순위 등 수량 표현을 세어 정량화 레벨을 평가.
 */
export function analyzeQuantification(text: string): QuantificationAnalysis {
  const t = text ?? '';
  const percents = (t.match(/\d+(?:\.\d+)?\s*%/g) ?? []).length;
  const periods = (t.match(/\d+\s*(년|개월|달|주|일간|시간)/g) ?? []).length;
  const currencies = (t.match(/\d[\d,]*\s*(원|만원|억원|억|천만|달러|\$)/g) ?? []).length;
  const rankings = (t.match(/(상위|TOP|톱|Top)\s*\d+|\d+위|1등/g) ?? []).length;
  const allNumbers = (t.match(/\d+/g) ?? []).length;
  const numerics = Math.max(0, allNumbers - percents - periods - currencies - rankings);
  const total = percents + numerics + periods + currencies + rankings;
  let level: QuantificationAnalysis['level'];
  if (total === 0) level = 'none';
  else if (total < 2) level = 'low';
  else if (total < 5) level = 'medium';
  else level = 'high';
  const suggestion =
    level === 'none'
      ? '수치 지표가 전혀 없습니다. "향상", "개선" 대신 "20% 향상", "3개월 단축" 같은 구체 수치로 표현하세요.'
      : level === 'low'
        ? '수치 지표가 부족합니다. 퍼센트·기간·횟수·금액 등으로 성과를 정량화하세요.'
        : level === 'medium'
          ? '수치 지표가 적정 수준입니다. 핵심 성과에 숫자를 더 넣어 차별화해 보세요.'
          : '정량적 성과 표현이 풍부합니다.';
  return { total, percents, numerics, periods, currencies, rankings, level, suggestion };
}

export interface ActionVerbAnalysis {
  strong: number;
  weak: number;
  ratio: number; // strong / (strong + weak)
  level: 'low' | 'medium' | 'high';
  suggestion: string;
  topStrong: string[];
  topWeak: string[];
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
  '리딩',
  '제안',
  '기획',
  '발굴',
  '창출',
  '성장',
  '확장',
  '배포',
  '분석',
  '도입',
  '정립',
  '혁신',
  '단축',
  '절감',
  '증가',
];

const WEAK_VERBS = [
  '담당',
  '참여',
  '수행',
  '도움',
  '함께',
  '협업했',
  '했습니다',
  '되었',
  '맡았',
  '배웠',
  '겪었',
];

/**
 * 액션 동사 분석 — 이력서는 강한 동사(주도·구현·달성)로 시작하는 bullet이 효과적.
 * 한국어 이력서 맥락에서 '강한' 동사와 '약한' 동사 비율을 계산.
 */
export function analyzeActionVerbs(text: string): ActionVerbAnalysis {
  const t = text ?? '';
  const countStrong: Record<string, number> = {};
  const countWeak: Record<string, number> = {};
  for (const v of STRONG_VERBS) {
    const matches = t.match(new RegExp(v, 'g'));
    if (matches) countStrong[v] = matches.length;
  }
  for (const v of WEAK_VERBS) {
    const matches = t.match(new RegExp(v, 'g'));
    if (matches) countWeak[v] = matches.length;
  }
  const strong = Object.values(countStrong).reduce((a, b) => a + b, 0);
  const weak = Object.values(countWeak).reduce((a, b) => a + b, 0);
  const total = strong + weak;
  const ratio = total === 0 ? 0 : Math.round((strong / total) * 100) / 100;
  let level: ActionVerbAnalysis['level'];
  if (total < 3) level = 'medium';
  else if (ratio >= 0.7) level = 'high';
  else if (ratio >= 0.4) level = 'medium';
  else level = 'low';
  const suggestion =
    total < 3
      ? '동사 표현이 적어 분석이 제한적입니다. 경력 bullet 을 추가하세요.'
      : level === 'high'
        ? '강한 액션 동사 비율이 우수합니다.'
        : level === 'medium'
          ? '약한 동사("담당", "수행") 를 강한 동사("주도", "구현") 로 바꿔 보세요.'
          : '약한 동사가 너무 많습니다. 성과 중심으로 다시 써 주세요.';
  const topStrong = Object.entries(countStrong)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([v]) => v);
  const topWeak = Object.entries(countWeak)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([v]) => v);
  return { strong, weak, ratio, level, suggestion, topStrong, topWeak };
}

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
  '개최',
];

export interface AchievementCount {
  total: number;
  byKeyword: Array<{ keyword: string; count: number }>;
  density: number; // 100자당 수
  level: 'low' | 'medium' | 'high';
  suggestion: string;
}

/**
 * 수상·성취 카운트 — "수상/1등/1위/금상/대상/입상/장학금/우수상/최우수/선정/인증/자격증"
 * 등 객관적 성취 흔적의 빈도 집계. 이력서 "실적 밀도" 지표.
 */
export function countAchievements(text: string): AchievementCount {
  const t = text ?? '';
  const byKeyword: Array<{ keyword: string; count: number }> = [];
  let total = 0;
  for (const k of ACHIEVEMENT_KEYWORDS) {
    const re = new RegExp(k, 'g');
    const matches = t.match(re);
    if (matches) {
      byKeyword.push({ keyword: k, count: matches.length });
      total += matches.length;
    }
  }
  byKeyword.sort((a, b) => b.count - a.count);
  const chars = t.length || 1;
  const density = Math.round((total / chars) * 10000) / 100; // per 100 chars
  let level: AchievementCount['level'];
  if (total === 0) level = 'low';
  else if (density >= 0.8) level = 'high';
  else if (density >= 0.3) level = 'medium';
  else level = 'low';
  const suggestion =
    total === 0
      ? '객관적 성취 키워드가 감지되지 않았습니다 — 수상·자격증·선정 이력을 추가하세요.'
      : level === 'high'
        ? `성취 표현이 풍부합니다 (${total}건).`
        : level === 'medium'
          ? `성취 ${total}건 — 조금 더 구체 이력(대회·자격증)을 추가하면 임팩트 상승.`
          : `성취 키워드가 적습니다 (${total}건). 수상·인증·선정 경험 추가 검토.`;
  return { total, byKeyword: byKeyword.slice(0, 10), density, level, suggestion };
}
