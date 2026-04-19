/**
 * STAR(Situation·Task·Action·Result) 불릿 구조 분석 모듈 — koreanChecker.ts 에서 분리.
 *
 * LinkedIn·원티드·HBR 이력서 가이드 표준: 각 불릿은 상황·과제·행동·결과를 담는 것이
 * 면접관의 이해·평가를 돕는다. 이 모듈은 한국어 큐 패턴으로 4요소를 검출해 score(0-4),
 * coverage(%), tier 를 산출한다.
 */

export interface StarBulletResult {
  bullet: string;
  hasSituation: boolean;
  hasTask: boolean;
  hasAction: boolean;
  hasResult: boolean;
  score: number;
}

export interface StarPatternReport {
  total: number;
  analyzed: number;
  coverage: number;
  fullStarCount: number;
  avgScore: number;
  results: StarBulletResult[];
  tier: 'excellent' | 'good' | 'fair' | 'poor';
}

const STAR_BULLET_LINE_RE = /^\s*[-•·▶►◆◇□■★☆*]\s+/;
const STAR_SITUATION_CUES =
  /(당시|기존|상황|환경|문제|이슈|배경|어려움|복잡|비효율|레거시|장애|리스크)/;
const STAR_TASK_CUES = /(담당|맡아|역할|책임|목표|과제|미션|필요|요구|원했|계획|목적)/;
const STAR_ACTION_CUES =
  /(개발|구축|설계|구현|도입|개선|최적화|리팩터|리팩토|자동화|통합|마이그|리드|주도|제안|적용|활용|분석)/;
const STAR_RESULT_CUES =
  /(\d+\s*(?:%|배|시간|분|초|건|명|개|회|원|만|억|천)|달성|절감|향상|증가|감소|단축|확보|성공|성과|효과|개선율|수주|수상)/;

/**
 * STAR(Situation·Task·Action·Result) 불릿 구조 분석 — LinkedIn·원티드 이력서 가이드 표준.
 * 불릿 각 줄을 4가지 시그널 큐(한국어 패턴)로 검사해 score(0-4)·coverage(%) 산출.
 * coverage = 4개 모두 충족한 불릿 비율. tier: ≥75 excellent, ≥50 good, ≥25 fair, else poor.
 */
export function analyzeStarPattern(text: string): StarPatternReport {
  const t = text ?? '';
  if (!t.trim()) {
    return {
      total: 0,
      analyzed: 0,
      coverage: 0,
      fullStarCount: 0,
      avgScore: 0,
      results: [],
      tier: 'poor',
    };
  }
  const lines = t.split(/\r?\n/);
  const bullets = lines.filter((l) => STAR_BULLET_LINE_RE.test(l));
  const analyzed = bullets.filter((b) => b.length >= 20);
  const results: StarBulletResult[] = analyzed.map((raw) => {
    const bullet = raw.replace(STAR_BULLET_LINE_RE, '').trim();
    const hasSituation = STAR_SITUATION_CUES.test(bullet);
    const hasTask = STAR_TASK_CUES.test(bullet);
    const hasAction = STAR_ACTION_CUES.test(bullet);
    const hasResult = STAR_RESULT_CUES.test(bullet);
    const score =
      (hasSituation ? 1 : 0) + (hasTask ? 1 : 0) + (hasAction ? 1 : 0) + (hasResult ? 1 : 0);
    return { bullet, hasSituation, hasTask, hasAction, hasResult, score };
  });
  const fullStarCount = results.filter((r) => r.score === 4).length;
  const coverage = analyzed.length === 0 ? 0 : Math.round((fullStarCount / analyzed.length) * 100);
  const avgScore =
    analyzed.length === 0
      ? 0
      : +(results.reduce((acc, r) => acc + r.score, 0) / analyzed.length).toFixed(2);
  const tier: StarPatternReport['tier'] =
    coverage >= 75 ? 'excellent' : coverage >= 50 ? 'good' : coverage >= 25 ? 'fair' : 'poor';
  return {
    total: bullets.length,
    analyzed: analyzed.length,
    coverage,
    fullStarCount,
    avgScore,
    results,
    tier,
  };
}
