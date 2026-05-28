/**
 * 자기소개서 입사 후 포부(커리어 목표) 명확도 분석.
 *
 * - 구체적 성장 목표 vs 막연한 의지 표현 vs 포부 부재를 구분
 * - "입사 후 포부" 섹션의 질을 평가해 개선 제안 제공
 */

export type AspirationClarity = 'specific' | 'vague' | 'absent';

export interface AspirationSignal {
  type: 'growth_goal' | 'company_contribution' | 'skill_development' | 'vague_pledge';
  phrase: string;
}

export interface AspirationReport {
  clarity: AspirationClarity;
  signals: AspirationSignal[];
  hasTimeHorizon: boolean;
  hasSpecificSkill: boolean;
  vagueCount: number;
  suggestion: string;
  rewriteHint: string;
}

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

const GROWTH_GOAL_PATTERNS: RegExp[] = [
  /\d+년\s*(?:안에|내에|이내|후에?|뒤에?)\s*(?:\S+을?\s*){0,4}(?:되고\s*싶|달성|목표|도달|이루)/,
  /(?:시니어|리드|아키텍트|테크\s*리드|매니저|CTO)\s*(?:로\s*(?:성장|발전)|가\s*(?:되는\s*것이?\s*목표|목표))/,
  /(?:전문가|expert|스페셜리스트)\s*(?:로\s*성장|가\s*될|로\s*자리잡)/,
  /기술\s*(?:깊이|전문성)\s*(?:를?\s*쌓|강화|발전)/,
];

const COMPANY_CONTRIBUTION_PATTERNS: RegExp[] = [
  /귀사(?:의|에서?)\s*(?:\S+\s*){0,5}(?:기여|공헌|성장|임팩트)/,
  /(?:서비스|제품|플랫폼)\s*(?:의\s*)?(?:성장|발전|개선)\s*(?:에?\s*기여|을\s*이끌)/,
  /(?:팀|조직|회사)\s*(?:와?\s*함께|의\s*목표)\s*(?:달성|실현|성취)/,
  /(?:핵심\s*인재|구성원|팀원)\s*(?:으로서|으로)\s*(?:성장|기여|역할)/,
];

const SKILL_DEVELOPMENT_PATTERNS: RegExp[] = [
  /(?:습득|학습|공부|연구|익히)\s*(?:하고자|하여|하면서|해\s*나가)/,
  /(?:기술|역량|스킬|능력)\s*(?:을\s*키우|향상|강화)\s*(?:하고\s*싶|할\s*것|하겠)/,
  /(?:컨퍼런스|세미나|학습|스터디)\s*(?:참여|참석|활동)\s*(?:통해|하여|하면서)/,
];

const VAGUE_PLEDGE_PATTERNS: Array<{ re: RegExp; phrase: string }> = [
  { re: /열심히\s*하겠/, phrase: '열심히 하겠습니다' },
  { re: /최선을\s*다하겠/, phrase: '최선을 다하겠습니다' },
  { re: /노력하겠/, phrase: '노력하겠습니다' },
  { re: /성장하겠/, phrase: '성장하겠습니다' },
  { re: /기여하겠/, phrase: '기여하겠습니다' },
  { re: /열정(?:적으로|을 다해)?\s*(?:임하|하겠)/, phrase: '열정을 다해 임하겠습니다' },
  { re: /배움을\s*멈추지\s*않겠/, phrase: '배움을 멈추지 않겠습니다' },
  { re: /꿈(?:을\s*이루|꾸고\s*있)/, phrase: '꿈을 이루겠습니다' },
];

const TIME_HORIZON_RE =
  /\d+년\s*(?:안에|내에|이내|후에?|뒤에?)|단기(?:적으로)?|중장기|5년\s*후|3년\s*후|향후/;

const SPECIFIC_TECH_PATTERNS: RegExp[] = [
  /(?:Kubernetes|k8s|Docker|MSA|마이크로서비스|머신러닝|ML|딥러닝|클라우드\s*네이티브|분산\s*시스템|시스템\s*설계)/i,
  /(?:React|Vue|Angular|Next\.js|NestJS|Spring|Django|FastAPI|Go\s*언어|Rust|Kotlin)/i,
  /(?:AWS|GCP|Azure|CI\/CD|DevOps|SRE|데이터\s*엔지니어링|데이터\s*파이프라인)/i,
];

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function analyzeCoverLetterAspiration(text: string): AspirationReport {
  const t = text ?? '';
  const signals: AspirationSignal[] = [];

  for (const re of GROWTH_GOAL_PATTERNS) {
    const m = t.match(re);
    if (m) signals.push({ type: 'growth_goal', phrase: m[0].slice(0, 50) });
  }
  for (const re of COMPANY_CONTRIBUTION_PATTERNS) {
    const m = t.match(re);
    if (m) signals.push({ type: 'company_contribution', phrase: m[0].slice(0, 50) });
  }
  for (const re of SKILL_DEVELOPMENT_PATTERNS) {
    const m = t.match(re);
    if (m) signals.push({ type: 'skill_development', phrase: m[0].slice(0, 50) });
  }

  const vagueHits: AspirationSignal[] = [];
  for (const { re, phrase } of VAGUE_PLEDGE_PATTERNS) {
    if (re.test(t)) vagueHits.push({ type: 'vague_pledge', phrase });
  }

  const specificCount = signals.filter((s) => s.type !== 'vague_pledge').length;
  const vagueCount = vagueHits.length;
  const allSignals = [...signals, ...vagueHits];

  const hasTimeHorizon = TIME_HORIZON_RE.test(t);
  const hasSpecificSkill = SPECIFIC_TECH_PATTERNS.some((re) => re.test(t));

  let clarity: AspirationClarity;
  if (specificCount >= 2 || (specificCount >= 1 && (hasTimeHorizon || hasSpecificSkill))) {
    clarity = 'specific';
  } else if (specificCount === 0 && vagueCount === 0) {
    clarity = 'absent';
  } else {
    clarity = 'vague';
  }

  let suggestion: string;
  let rewriteHint: string;

  if (clarity === 'specific') {
    suggestion = '입사 후 포부가 구체적으로 제시되어 있습니다.';
    rewriteHint =
      '수치 목표(예: 3년 내 팀 리드 역할, 특정 기술 스택 습득)를 추가하면 더욱 강해집니다.';
  } else if (clarity === 'vague') {
    suggestion = '포부가 막연합니다. 구체적인 커리어 목표와 기여 방향을 명시하세요.';
    rewriteHint =
      '"X년 안에 Y 역량을 쌓아 Z 분야에 기여하고 싶습니다" 또는 "[기술 스택]을 심화 학습하여 [구체 성과] 달성에 기여하겠습니다" 형태로 작성해 보세요.';
  } else {
    suggestion = '입사 후 포부가 빠져 있습니다. 자기소개서의 마지막 단락에 포부 섹션을 추가하세요.';
    rewriteHint =
      '"입사 후 포부" 단락에: 단기(1-2년) 기여 목표 1가지 + 중장기(3-5년) 성장 방향 1가지를 제시하세요.';
  }

  return {
    clarity,
    signals: allSignals,
    hasTimeHorizon,
    hasSpecificSkill,
    vagueCount,
    suggestion,
    rewriteHint,
  };
}
