/**
 * JD 성장 기회 분석기 — 채용공고에서 학습 지원·멘토링·승진 경로·기술 발전 기회 등
 * 구직자의 커리어 성장에 영향을 주는 신호를 감지하고 종합 평가를 제공한다.
 */

export type GrowthSignalType =
  | 'learning_budget' // 학습/교육 예산
  | 'mentoring' // 멘토링/코칭 프로그램
  | 'conference' // 컨퍼런스/외부 행사 지원
  | 'promotion_path' // 승진 기준 명시
  | 'tech_challenges' // 기술적 도전 기회
  | 'global_exposure' // 글로벌 환경/영어 실무
  | 'ownership' // 소유권/자율성
  | 'cross_functional'; // 타 팀 협업 기회

export interface GrowthSignal {
  type: GrowthSignalType;
  excerpt: string;
}

export type GrowthRating = 'rich' | 'moderate' | 'sparse' | 'none';

export interface JdGrowthOpportunityReport {
  signals: GrowthSignal[];
  types: Set<GrowthSignalType>;
  score: number; // 0-100
  rating: GrowthRating;
  summary: string;
  missingAreas: string[];
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

interface GrowthPattern {
  re: RegExp;
  type: GrowthSignalType;
  weight: number;
}

const GROWTH_PATTERNS: GrowthPattern[] = [
  // Learning budget / education support
  {
    re: /교육\s*(?:지원|비용|예산|제도)|학습\s*(?:지원|예산|비용)/,
    type: 'learning_budget',
    weight: 20,
  },
  {
    re: /도서\s*(?:구매|구입|지원)|책\s*(?:지원|구매\s*지원)/,
    type: 'learning_budget',
    weight: 10,
  },
  {
    re: /온라인\s*(?:강의|코스|교육)\s*(?:지원|제공)|Udemy|Coursera|인프런\s*지원/,
    type: 'learning_budget',
    weight: 15,
  },
  {
    re: /자기\s*계발\s*(?:비용|지원|제도)|역량\s*개발\s*(?:지원|프로그램)/,
    type: 'learning_budget',
    weight: 15,
  },

  // Mentoring / coaching
  {
    re: /멘토링\s*(?:프로그램|제도|지원|문화)|1:1\s*(?:미팅|코칭|피드백)/,
    type: 'mentoring',
    weight: 20,
  },
  {
    re: /코칭\s*(?:문화|프로그램|제도)|사수\s*제도|온보딩\s*(?:프로그램|지원)/,
    type: 'mentoring',
    weight: 15,
  },
  { re: /시니어\s*(?:개발자|엔지니어)\s*(?:코칭|멘토|멘토링|지도)/, type: 'mentoring', weight: 20 },

  // Conference / external events
  {
    re: /컨퍼런스\s*(?:참가\s*지원|지원|비용\s*지원)|세미나\s*(?:지원|참여\s*지원)/,
    type: 'conference',
    weight: 20,
  },
  {
    re: /DEVIEW|if\s*Kakao|Pycon|AWS\s*re:Invent|Google\s*I\/O\s*지원/,
    type: 'conference',
    weight: 20,
  },
  {
    re: /외부\s*행사\s*(?:지원|참가)|해외\s*(?:컨퍼런스|행사)\s*(?:지원|파견)/,
    type: 'conference',
    weight: 25,
  },

  // Promotion path
  {
    re: /승진\s*(?:체계|기준|경로|기회|제도)|커리어\s*(?:패스|경로|개발\s*로드맵)/,
    type: 'promotion_path',
    weight: 20,
  },
  { re: /레벨\s*(?:업|체계|제도)|성장\s*(?:경로|로드맵|체계)/, type: 'promotion_path', weight: 15 },
  { re: /CTO\s*(?:트랙|직책)|테크\s*리드\s*(?:성장|기회)/, type: 'promotion_path', weight: 20 },

  // Technical challenges
  {
    re: /대규모\s*(?:트래픽|시스템|서비스|데이터)\s*(?:경험|기회|처리)/,
    type: 'tech_challenges',
    weight: 20,
  },
  {
    re: /최신\s*(?:기술|스택|아키텍처)\s*(?:도입|사용|경험)|첨단\s*기술/,
    type: 'tech_challenges',
    weight: 15,
  },
  {
    re: /기술\s*부채\s*(?:해소|개선|없음)|레거시\s*없이|그린필드/,
    type: 'tech_challenges',
    weight: 15,
  },
  { re: /오픈소스\s*(?:기여|참여|장려|활동\s*지원)/, type: 'tech_challenges', weight: 15 },

  // Global exposure
  {
    re: /글로벌\s*(?:서비스|환경|팀|사업)|해외\s*(?:서비스|시장|진출|사업)/,
    type: 'global_exposure',
    weight: 15,
  },
  {
    re: /영어\s*(?:실무|업무|사용|환경)|외국인\s*(?:팀원|동료)|다국어\s*서비스/,
    type: 'global_exposure',
    weight: 15,
  },

  // Ownership / autonomy
  { re: /자율\s*(?:근무|출퇴근|시간|환경|적인)|오너십|ownership/, type: 'ownership', weight: 20 },
  {
    re: /주도적\s*(?:개발|설계|의사결정|업무)|직접\s*(?:설계|기획|리드)/,
    type: 'ownership',
    weight: 15,
  },
  { re: /빠른\s*의사결정|수평적\s*(?:조직|문화|구조)|플랫\s*조직/, type: 'ownership', weight: 10 },

  // Cross-functional
  {
    re: /크로스\s*펑셔널|cross.functional|타\s*팀\s*(?:협업|협력|미팅)/,
    type: 'cross_functional',
    weight: 10,
  },
  {
    re: /PM\s*(?:과|와)\s*협업|디자이너\s*(?:과|와)\s*협업|기획자\s*(?:과|와)\s*협업/,
    type: 'cross_functional',
    weight: 10,
  },
];

// Labels for missing area tips
const TYPE_TIP: Record<GrowthSignalType, string> = {
  learning_budget: '학습/교육비 지원 제도',
  mentoring: '멘토링·코칭 프로그램',
  conference: '컨퍼런스·외부 행사 지원',
  promotion_path: '승진 기준·커리어 패스 명시',
  tech_challenges: '기술적 도전 과제',
  global_exposure: '글로벌 환경·영어 실무',
  ownership: '자율성·오너십',
  cross_functional: '타 직군 협업 기회',
};

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function analyzeJdGrowthOpportunity(text: string): JdGrowthOpportunityReport {
  const t = text ?? '';
  const signals: GrowthSignal[] = [];
  const types = new Set<GrowthSignalType>();
  let totalWeight = 0;

  for (const { re, type, weight } of GROWTH_PATTERNS) {
    const m = t.match(re);
    if (m) {
      signals.push({ type, excerpt: m[0].slice(0, 60) });
      if (!types.has(type)) {
        types.add(type);
        totalWeight += weight;
      }
    }
  }

  const score = Math.min(100, totalWeight);

  let rating: GrowthRating;
  if (score >= 60) rating = 'rich';
  else if (score >= 30) rating = 'moderate';
  else if (score >= 10) rating = 'sparse';
  else rating = 'none';

  let summary: string;
  if (rating === 'rich') {
    summary = '학습·멘토링·기술 도전 등 성장 기회를 다양하게 제공하는 환경으로 보입니다.';
  } else if (rating === 'moderate') {
    summary = '일부 성장 기회가 명시되어 있습니다. 면접에서 추가 제도를 구체적으로 확인하세요.';
  } else if (rating === 'sparse') {
    summary = '성장 지원 관련 내용이 거의 없습니다. 입사 전 반드시 성장 환경을 파악하세요.';
  } else {
    summary = '채용공고에서 성장 기회 관련 신호가 발견되지 않았습니다. 면접에서 직접 질문하세요.';
  }

  const allTypes: GrowthSignalType[] = [
    'learning_budget',
    'mentoring',
    'conference',
    'promotion_path',
    'tech_challenges',
    'ownership',
  ];
  const missingAreas = allTypes
    .filter((t) => !types.has(t))
    .slice(0, 3)
    .map((t) => TYPE_TIP[t]);

  return { signals, types, score, rating, summary, missingAreas };
}
