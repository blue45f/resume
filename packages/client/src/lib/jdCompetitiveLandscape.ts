/**
 * 채용공고 경쟁 환경 분석 — koreanChecker 생태계의 JD 파생 분석기.
 *
 * 채용공고 텍스트만으로 "이 포지션의 경쟁 난이도·기술 진입장벽·암묵적 근무 난제"를
 * 휴리스틱으로 추론해, 지원 전 전략 수립을 돕는다. 기존 jdSeniorityAnalyzer(요구 레벨),
 * jdBiasDetector(차별 신호)와 달리 "메타적 경쟁 환경"을 진단한다.
 *
 * 순수 함수(no DOM/network) — vitest 로 검증.
 */

export type Intensity = 'low' | 'medium' | 'high' | 'unknown';

export interface ImplicitChallenge {
  challenge: string;
  evidence: string; // 공고에서 감지된 근거 표현
  implication: string; // 지원자에게의 함의
}

export interface JdCompetitiveLandscape {
  competitionIntensity: Intensity; // 지원 경쟁률(유추)
  technicalBarrier: Intensity; // 기술 진입장벽
  demandedExperience: string[]; // 요구 경력/역할 신호
  implicitChallenges: ImplicitChallenge[];
  fitmentSuggestion: string;
  summary: string;
}

// 암묵적 근무 난제: 공고의 흔한 표현 → 실제 근무 환경 함의
const CHALLENGE_RULES: Array<{
  re: RegExp;
  challenge: string;
  implication: string;
}> = [
  {
    re: /빠른|스피드|애자일|agile|린\b|lean|기민|신속/i,
    challenge: '빠른 의사결정·실행 속도 요구',
    implication: '짧은 피드백 루프에서 빠르게 결과를 내는 능력이 중요합니다.',
  },
  {
    re: /자율|주도적|주도성|오너십|ownership|능동적|스스로/i,
    challenge: '높은 자율성·오너십 기대',
    implication: '지시를 기다리기보다 스스로 문제를 정의하고 추진한 경험을 강조하세요.',
  },
  {
    re: /성장|스케일|scale|확장|급성장|하이퍼/i,
    challenge: '급격한 성장·스케일 대응',
    implication: '트래픽/조직 확장 상황에서의 대응 경험이 강점이 됩니다.',
  },
  {
    re: /멀티|다양한 업무|다재|여러 역할|올라운더|다방면/i,
    challenge: '넓은 업무 범위(멀티태스킹)',
    implication: '한 가지 전문성 외에 인접 영역까지 다룬 경험을 보여주세요.',
  },
  {
    re: /스타트업|초기 단계|초기 멤버|얼리|시드|시리즈\s?[ab]/i,
    challenge: '초기 스타트업의 불확실성·리소스 제약',
    implication: '제한된 리소스로 0→1을 만든 경험이 설득력 있습니다.',
  },
  {
    re: /KPI|목표 달성|성과 중심|target|정량 목표|실적/i,
    challenge: '높은 성과 압박',
    implication: '정량 목표를 달성한 사례(수치)를 준비하세요.',
  },
];

const MASS_HIRING_RE =
  /신입\s*환영|경력\s*무관|학력\s*무관|누구나|다수\s*(채용|모집)|\d+\s*명\s*(채용|모집)|상시\s*채용|수시\s*채용/;
const NICHE_RE =
  /시니어|리드|lead|책임|수석|principal|staff|아키텍트|5년\s*이상|7년\s*이상|10년\s*이상|전문가/i;

const YEARS_RE = /(\d+)\s*년\s*(이상|이내|차)?/g;
const ROLE_RE =
  /(리드|lead|팀장|매니저|manager|책임|수석|principal|staff|시니어|senior|아키텍트|architect)/i;

const TECH_TOKEN_RE = /\b[A-Z][A-Za-z0-9.+#]{1,}\b/g;

function maxYears(text: string): number {
  let max = 0;
  for (const m of text.matchAll(YEARS_RE)) {
    const n = parseInt(m[1], 10);
    if (!Number.isNaN(n) && n <= 40) max = Math.max(max, n);
  }
  return max;
}

/**
 * 채용공고 텍스트의 경쟁 환경을 분석한다.
 * @param text 채용공고/자격요건 텍스트
 */
export function analyzeJdCompetitiveLandscape(text: string): JdCompetitiveLandscape {
  const t = text ?? '';
  const trimmed = t.trim();

  if (trimmed.length < 40) {
    return {
      competitionIntensity: 'unknown',
      technicalBarrier: 'unknown',
      demandedExperience: [],
      implicitChallenges: [],
      fitmentSuggestion:
        '공고 내용이 짧아 경쟁 환경을 분석하기 어렵습니다. 더 많은 내용을 붙여넣어 주세요.',
      summary: '분석할 내용이 부족합니다.',
    };
  }

  const years = maxYears(t);
  const hasRole = ROLE_RE.test(t);
  const techTokens = new Set((t.match(TECH_TOKEN_RE) ?? []).map((s) => s.toLowerCase()));
  const techCount = techTokens.size;
  const isMassHiring = MASS_HIRING_RE.test(t);
  const isNiche = NICHE_RE.test(t);

  // 기술 진입장벽
  let technicalBarrier: Intensity;
  if (years >= 5 || (hasRole && years >= 3) || (isNiche && techCount >= 6)) {
    technicalBarrier = 'high';
  } else if (/신입|주니어|junior|경력\s*무관|0\s*~\s*2년|1\s*~\s*2년/i.test(t) || years <= 1) {
    technicalBarrier = 'low';
  } else {
    technicalBarrier = 'medium';
  }

  // 경쟁 강도: 대량 채용/문턱 낮음 → 높음, 니치/고경력 → 낮음
  let competitionIntensity: Intensity;
  if (isMassHiring || technicalBarrier === 'low') {
    competitionIntensity = 'high';
  } else if (isNiche || technicalBarrier === 'high') {
    competitionIntensity = 'low';
  } else {
    competitionIntensity = 'medium';
  }

  // 요구 경력/역할
  const demandedExperience: string[] = [];
  if (years > 0) demandedExperience.push(`경력 ${years}년 이상`);
  const roleMatch = t.match(ROLE_RE);
  if (roleMatch) demandedExperience.push(`${roleMatch[0]} 역할`);
  if (demandedExperience.length === 0 && /신입|주니어/i.test(t))
    demandedExperience.push('신입/주니어 환영');

  // 암묵적 난제 (중복 제거)
  const implicitChallenges: ImplicitChallenge[] = [];
  for (const rule of CHALLENGE_RULES) {
    const m = t.match(rule.re);
    if (m) {
      implicitChallenges.push({
        challenge: rule.challenge,
        evidence: m[0],
        implication: rule.implication,
      });
    }
  }

  // 적합성 제안
  let fitmentSuggestion: string;
  if (technicalBarrier === 'high' && competitionIntensity === 'low') {
    fitmentSuggestion =
      '진입장벽이 높지만 경쟁은 상대적으로 적습니다. 요구 경력/역할에 맞는 깊이 있는 사례 1~2개로 승부하세요.';
  } else if (competitionIntensity === 'high') {
    fitmentSuggestion =
      '경쟁이 치열할 수 있습니다. 차별화된 정량 성과와 직무 키워드 정합성으로 서류에서 먼저 눈에 띄어야 합니다.';
  } else {
    fitmentSuggestion =
      '진입장벽·경쟁이 중간 수준입니다. 핵심 역량과 공고 키워드를 정확히 매칭해 적합성을 분명히 드러내세요.';
  }

  const intensityKo: Record<Intensity, string> = {
    low: '낮음',
    medium: '보통',
    high: '높음',
    unknown: '불명',
  };
  const summary = `경쟁 ${intensityKo[competitionIntensity]} · 기술 장벽 ${intensityKo[technicalBarrier]}${
    implicitChallenges.length ? ` · 근무 난제 ${implicitChallenges.length}건` : ''
  }`;

  return {
    competitionIntensity,
    technicalBarrier,
    demandedExperience,
    implicitChallenges,
    fitmentSuggestion,
    summary,
  };
}

export const INTENSITY_LABELS: Record<Intensity, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  unknown: '불명',
};
