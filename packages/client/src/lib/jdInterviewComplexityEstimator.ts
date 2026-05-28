/**
 * JD 면접 난이도 추정기 — 기술 요건 밀도, 경력 요구 수준,
 * 알고리즘/시스템 설계 언급 등을 분석해 면접 복잡도를 추정한다.
 */

export type ComplexitySignalType =
  | 'algorithm_required' // 알고리즘 문제 풀이 요구
  | 'system_design_required' // 시스템 설계 면접 언급
  | 'high_seniority_bar' // 시니어/10년+ 급 경력 요구
  | 'multiple_tech_stacks' // 3개 이상 기술 스택 필수 요구
  | 'competitive_selection' // 경쟁률/선발 강조
  | 'advanced_concepts' // 분산 시스템, ML, 고가용성 등 심화 개념
  | 'leadership_required' // 테크리드/매니저 역할
  | 'coding_test_mentioned'; // 코딩 테스트 명시

export type InterviewDifficulty = 'expert' | 'senior' | 'mid' | 'junior' | 'entry';

export interface ComplexitySignal {
  type: ComplexitySignalType;
  excerpt: string;
}

export interface JdInterviewComplexityReport {
  signals: ComplexitySignal[];
  difficulty: InterviewDifficulty;
  signalCount: number;
  requiredExperienceYears: number | null;
  summary: string;
  prepTips: string[];
}

// ---------------------------------------------------------------------------
// Signal patterns
// ---------------------------------------------------------------------------

interface SignalPattern {
  type: ComplexitySignalType;
  re: RegExp;
}

const SIGNAL_PATTERNS: SignalPattern[] = [
  // algorithm_required
  {
    type: 'algorithm_required',
    re: /(?:알고리즘|자료구조|코딩\s*테스트|LeetCode|PS)\s*(?:역량|실력|경험|풀이|문제)/,
  },
  {
    type: 'algorithm_required',
    re: /(?:코딩\s*인터뷰|coding\s*interview)\s*(?:준비|역량|필수|경험)/i,
  },

  // coding_test_mentioned
  {
    type: 'coding_test_mentioned',
    re: /(?:코딩\s*테스트|온라인\s*테스트|1차\s*테스트|필기\s*시험)\s*(?:진행|실시|포함|있음|예정)/,
  },
  {
    type: 'coding_test_mentioned',
    re: /채용\s*과정\s*(?::|：|에는?)?\s*(?:코딩\s*테스트|온라인\s*테스트)/,
  },

  // system_design_required
  {
    type: 'system_design_required',
    re: /(?:시스템\s*설계|system\s*design|대용량\s*트래픽\s*설계|아키텍처\s*설계)\s*(?:경험|역량|필수|가능|면접)/i,
  },
  {
    type: 'system_design_required',
    re: /(?:분산\s*시스템|distributed\s*system|MSA|마이크로서비스)\s*(?:설계|구축|운영|경험)\s*(?:필수|우대|경험)/i,
  },

  // high_seniority_bar
  {
    type: 'high_seniority_bar',
    re: /(?:경력\s*)?(?:10년\s*이상|8년\s*이상|7년\s*이상)/,
  },
  {
    type: 'high_seniority_bar',
    re: /(?:수석|Principal|Staff\s*Engineer|Distinguished)\s*(?:급|레벨|엔지니어)/i,
  },
  {
    type: 'high_seniority_bar',
    re: /프로덕트\s*(?:전체|아키텍처)\s*(?:를|을)?\s*(?:설계|담당|주도)/,
  },

  // multiple_tech_stacks
  {
    type: 'multiple_tech_stacks',
    re: /(?:필수|required).{0,100}(?:(?:Java|Python|Go|Kotlin|TypeScript|Rust|C\+\+).{0,30}){3,}/i,
  },
  {
    type: 'multiple_tech_stacks',
    re: /(?:Java|Python|Go|Kotlin|TypeScript).{0,20}(?:Java|Python|Go|Kotlin|TypeScript).{0,20}(?:Java|Python|Go|Kotlin|TypeScript)/i,
  },

  // competitive_selection
  {
    type: 'competitive_selection',
    re: /(?:경쟁률|합격률|통과율)\s*(?:이|가)\s*(?:높|낮|치열)/,
  },
  {
    type: 'competitive_selection',
    re: /(?:서류|1차|2차|최종)\s*(?:합격|통과)\s*(?:후|자만|대상)\s*(?:진행|초대|면접)/,
  },

  // advanced_concepts
  {
    type: 'advanced_concepts',
    re: /(?:고가용성|HA|High\s*Availability|CAP\s*정리|CRDT|Raft|Paxos)/i,
  },
  {
    type: 'advanced_concepts',
    re: /(?:머신러닝|딥러닝|ML\s*엔지니어|MLOps|LLM\s*파인튜닝)\s*(?:경험|역량|필수)/,
  },
  {
    type: 'advanced_concepts',
    re: /(?:Kafka|Flink|Spark|실시간\s*데이터\s*파이프라인)\s*(?:구축|운영|경험)\s*(?:필수|우대)/,
  },

  // leadership_required
  {
    type: 'leadership_required',
    re: /(?:테크\s*리드|Tech\s*Lead|Engineering\s*Manager|EM)\s*(?:역할|경험|포지션)/i,
  },
  {
    type: 'leadership_required',
    re: /(?:팀\s*리드|팀장|조직\s*빌딩|채용\s*주도)\s*(?:경험|역량|필수)/,
  },
];

// ---------------------------------------------------------------------------
// Experience year extraction
// ---------------------------------------------------------------------------

function extractRequiredYears(text: string): number | null {
  const patterns = [
    /경력\s*([0-9]+)년?\s*이상/,
    /([0-9]+)\s*년?\s*(?:이상의?)?\s*(?:개발|경력|경험)/,
    /([0-9]+)\+\s*years?\s*of\s*experience/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const years = parseInt(m[1], 10);
      if (years >= 1 && years <= 30) return years;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function estimateJdInterviewComplexity(text: string): JdInterviewComplexityReport {
  const t = text ?? '';
  const signals: ComplexitySignal[] = [];
  const seenTypes = new Set<ComplexitySignalType>();

  for (const { type, re } of SIGNAL_PATTERNS) {
    if (seenTypes.has(type)) continue;
    const m = t.match(re);
    if (m) {
      seenTypes.add(type);
      signals.push({ type, excerpt: m[0].slice(0, 50) });
    }
  }

  const requiredExperienceYears = extractRequiredYears(t);
  const signalCount = signals.length;

  let difficulty: InterviewDifficulty;
  const hasAlgo = seenTypes.has('algorithm_required');
  const hasSystem = seenTypes.has('system_design_required');
  const hasLeadership = seenTypes.has('leadership_required');
  const hasHigh = seenTypes.has('high_seniority_bar');
  const hasAdvanced = seenTypes.has('advanced_concepts');

  if ((hasAlgo && hasSystem) || hasLeadership || hasHigh || signalCount >= 4) {
    difficulty = 'expert';
  } else if (
    hasSystem ||
    hasAlgo ||
    hasAdvanced ||
    (requiredExperienceYears !== null && requiredExperienceYears >= 5)
  ) {
    difficulty = 'senior';
  } else if (
    signalCount >= 2 ||
    (requiredExperienceYears !== null && requiredExperienceYears >= 3)
  ) {
    difficulty = 'mid';
  } else if (signalCount >= 1) {
    difficulty = 'junior';
  } else {
    difficulty = 'entry';
  }

  const DIFFICULTY_LABEL: Record<InterviewDifficulty, string> = {
    expert: '최상급 (Expert)',
    senior: '시니어급',
    mid: '미드레벨',
    junior: '주니어급',
    entry: '신입/입문',
  };

  let summary: string;
  if (difficulty === 'expert') {
    summary = `면접 난이도: ${DIFFICULTY_LABEL[difficulty]}. 알고리즘·시스템 설계·리더십까지 전방위 준비가 필요합니다.`;
  } else if (difficulty === 'senior') {
    summary = `면접 난이도: ${DIFFICULTY_LABEL[difficulty]}. 심화 기술 역량과 설계 능력을 집중 준비하세요.`;
  } else if (difficulty === 'mid') {
    summary = `면접 난이도: ${DIFFICULTY_LABEL[difficulty]}. 실무 경험 기반의 기술 인터뷰를 예상하세요.`;
  } else if (difficulty === 'junior') {
    summary = `면접 난이도: ${DIFFICULTY_LABEL[difficulty]}. 기본 CS 지식과 언어 역량 위주로 준비하세요.`;
  } else {
    summary = `면접 난이도: ${DIFFICULTY_LABEL[difficulty]}. 기초 역량과 학습 의지를 보여주세요.`;
  }

  const prepTips: string[] = [];
  if (seenTypes.has('algorithm_required') || seenTypes.has('coding_test_mentioned')) {
    prepTips.push('LeetCode/프로그래머스 Medium 수준 문제를 집중 연습하세요.');
  }
  if (seenTypes.has('system_design_required')) {
    prepTips.push('대용량 서비스 설계 (URL 단축기, 채팅 시스템 등) 시나리오를 준비하세요.');
  }
  if (seenTypes.has('multiple_tech_stacks')) {
    prepTips.push('각 기술 스택의 핵심 차이점과 선택 기준을 설명할 수 있게 준비하세요.');
  }
  if (seenTypes.has('advanced_concepts')) {
    prepTips.push('분산 시스템 기초 개념 (CAP, 일관성 모델, 데이터 파이프라인)을 복습하세요.');
  }

  return {
    signals,
    difficulty,
    signalCount,
    requiredExperienceYears,
    summary,
    prepTips: prepTips.slice(0, 3),
  };
}
