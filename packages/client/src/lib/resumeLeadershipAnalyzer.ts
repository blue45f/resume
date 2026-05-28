export type LeadershipStrength = 'strong' | 'moderate' | 'weak' | 'none';

export type LeadershipSignalType =
  | 'people_management'
  | 'project_ownership'
  | 'mentoring'
  | 'process_ownership'
  | 'cross_functional'
  | 'budget_resource';

export interface LeadershipSignal {
  type: LeadershipSignalType;
  phrase: string;
  weight: number;
}

export interface LeadershipReport {
  strength: LeadershipStrength;
  signals: LeadershipSignal[];
  totalWeight: number;
  peopleManagement: boolean;
  suggestions: string[];
}

// ---------------------------------------------------------------------------
// Signal patterns  (each has a weight: high=3, med=2, low=1)
// ---------------------------------------------------------------------------

interface LeadershipPattern {
  re: RegExp;
  type: LeadershipSignalType;
  weight: number;
}

const LEADERSHIP_PATTERNS: LeadershipPattern[] = [
  // People management — direct reports
  { re: /\d+\s*명\s*(?:관리|리드|담당|팀원|멤버)/, type: 'people_management', weight: 3 },
  { re: /팀원\s*\d+\s*명/, type: 'people_management', weight: 3 },
  { re: /(?:팀장|파트장|챕터장|길드장|유닛장|실장|부장)/, type: 'people_management', weight: 3 },
  { re: /직속\s*보고/, type: 'people_management', weight: 2 },
  { re: /채용\s*(?:진행|인터뷰|담당)/, type: 'people_management', weight: 2 },

  // Project ownership — leading initiatives
  {
    re: /(?:프로젝트|서비스|제품|시스템)\s*(?:리드|오너|오너십|총괄|책임자|담당)/,
    type: 'project_ownership',
    weight: 3,
  },
  { re: /Tech\s*Lead|테크\s*리드/, type: 'project_ownership', weight: 3 },
  { re: /(?:로드맵|마일스톤)\s*(?:수립|설계|정의|관리)/, type: 'project_ownership', weight: 2 },
  { re: /의사\s*결정/, type: 'project_ownership', weight: 2 },
  { re: /이니셔티브\s*주도/, type: 'project_ownership', weight: 2 },

  // Mentoring / coaching
  { re: /(?:주니어|신입|인턴)\s*(?:멘토링|코칭|교육|육성|온보딩)/, type: 'mentoring', weight: 2 },
  { re: /코드\s*리뷰\s*(?:주도|문화|가이드|리더십)/, type: 'mentoring', weight: 2 },
  { re: /사내\s*교육\s*(?:진행|개발|기획)/, type: 'mentoring', weight: 2 },
  { re: /기술\s*공유\s*(?:문화|세션|주도)/, type: 'mentoring', weight: 1 },

  // Architecture / process ownership
  {
    re: /(?:아키텍처|인프라|시스템\s*설계)\s*(?:설계|결정|선택|주도|수립)/,
    type: 'process_ownership',
    weight: 3,
  },
  {
    re: /기술\s*(?:스택|선택|방향|표준)\s*(?:수립|정의|결정|도입)/,
    type: 'process_ownership',
    weight: 2,
  },
  {
    re: /개발\s*(?:문화|프로세스|방법론)\s*(?:개선|수립|도입)/,
    type: 'process_ownership',
    weight: 2,
  },
  { re: /기술\s*부채\s*(?:해결|개선|관리)/, type: 'process_ownership', weight: 1 },

  // Cross-functional coordination
  { re: /유관\s*부서\s*(?:협업|조율|커뮤니케이션|협의)/, type: 'cross_functional', weight: 2 },
  { re: /이해\s*관계자\s*(?:관리|커뮤니케이션|조율|협의)/, type: 'cross_functional', weight: 2 },
  { re: /C\s*레벨|C-level|임원\s*(?:보고|발표)/, type: 'cross_functional', weight: 2 },
  { re: /(?:사업|기획|디자인)\s*팀과\s*(?:협업|협력|조율)/, type: 'cross_functional', weight: 1 },

  // Budget & resource management
  { re: /예산\s*(?:\d+[억만]?원?\s*)?(?:관리|집행|편성)/, type: 'budget_resource', weight: 3 },
  { re: /\d+\s*억\s*(?:규모|예산|원)/, type: 'budget_resource', weight: 3 },
  { re: /비용\s*(?:\d+%|절감|최적화)\s*(?:달성|실현)/, type: 'budget_resource', weight: 2 },
];

const LEADERSHIP_TYPE_LABEL: Record<LeadershipSignalType, string> = {
  people_management: '인력 관리',
  project_ownership: '프로젝트 오너십',
  mentoring: '멘토링/육성',
  process_ownership: '아키텍처/프로세스',
  cross_functional: '유관부서 협업',
  budget_resource: '예산/리소스 관리',
};

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function analyzeResumeLeadership(text: string): LeadershipReport {
  const t = text ?? '';
  const signals: LeadershipSignal[] = [];
  const seenTypes = new Set<LeadershipSignalType>();

  for (const { re, type, weight } of LEADERSHIP_PATTERNS) {
    const m = t.match(re);
    if (m) {
      signals.push({ type, phrase: m[0].slice(0, 50), weight });
      seenTypes.add(type);
    }
  }

  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
  const peopleManagement = seenTypes.has('people_management');

  let strength: LeadershipStrength;
  if (totalWeight >= 8) strength = 'strong';
  else if (totalWeight >= 4) strength = 'moderate';
  else if (totalWeight >= 1) strength = 'weak';
  else strength = 'none';

  const suggestions: string[] = [];
  if (!peopleManagement && totalWeight < 8) {
    suggestions.push('직접 관리한 팀원 수 또는 관련 직책을 명시하면 관리 역량이 드러납니다.');
  }
  if (!seenTypes.has('project_ownership')) {
    suggestions.push('리드하거나 오너십을 가진 프로젝트/서비스를 명확히 기술하세요.');
  }
  if (!seenTypes.has('mentoring')) {
    suggestions.push('주니어 멘토링, 코드 리뷰 문화 기여 등 육성 활동을 추가하세요.');
  }
  if (!seenTypes.has('process_ownership')) {
    suggestions.push('아키텍처 결정, 기술 스택 선택, 개발 문화 개선 이력을 포함하세요.');
  }

  return { strength, signals, totalWeight, peopleManagement, suggestions };
}

export { LEADERSHIP_TYPE_LABEL };
