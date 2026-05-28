/**
 * 이력서 소프트 스킬 근거 품질 검사기 — "커뮤니케이션 능력 우수"처럼
 * 주장만 있고 근거가 없는 소프트 스킬 선언을 감지하여 개선을 유도한다.
 */

export type SoftSkillCategory =
  | 'communication' // 커뮤니케이션/의사소통
  | 'teamwork' // 협업/팀워크
  | 'leadership_soft' // 주도적/적극적 (리더십 색채)
  | 'problem_solving' // 문제해결력
  | 'responsibility' // 책임감/성실성
  | 'adaptability' // 유연성/적응력
  | 'creativity'; // 창의성/혁신

export type SoftSkillQuality = 'evidenced' | 'bare';

export interface SoftSkillClaim {
  category: SoftSkillCategory;
  phrase: string;
  quality: SoftSkillQuality;
}

export type OverallSoftSkillGrade = 'good' | 'mixed' | 'bare' | 'none';

export interface SoftSkillEvidenceReport {
  claims: SoftSkillClaim[];
  bareClaims: SoftSkillClaim[];
  evidencedClaims: SoftSkillClaim[];
  grade: OverallSoftSkillGrade;
  score: number; // 0-100 (ratio evidenced / total)
  suggestion: string;
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

interface SoftSkillPattern {
  re: RegExp;
  category: SoftSkillCategory;
}

// Bare claims — isolated keyword with no numeric or story context
const BARE_PATTERNS: SoftSkillPattern[] = [
  // communication
  {
    re: /(?:커뮤니케이션|의사소통)\s*(?:능력|역량|스킬)?\s*(?:우수|뛰어남|탁월|보유|원활)/,
    category: 'communication',
  },
  {
    re: /원활한\s*(?:커뮤니케이션|의사소통|소통)(?!\s*(?:통해|으로\s*\d|\s*\d))/,
    category: 'communication',
  },

  // teamwork
  {
    re: /(?:팀워크|협업)\s*(?:능력|역량|스킬)?\s*(?:우수|뛰어남|탁월|보유|원활)/,
    category: 'teamwork',
  },
  { re: /팀\s*(?:플레이어|플레이)\s*(?:정신)?(?!\s*(?:으로\s*\d|\s*\d))/, category: 'teamwork' },

  // leadership_soft
  {
    re: /주도적\s*(?:인|으로)?\s*(?:성격|성향|태도|인재|업무처리)(?!\s*(?:\d|[가-힣]{0,3}하여))/,
    category: 'leadership_soft',
  },
  {
    re: /적극적\s*(?:인|으로)?\s*(?:성격|성향|자세|태도|인재)(?!\s*(?:\d|\s*[가-힣]{0,3}하여))/,
    category: 'leadership_soft',
  },

  // problem_solving
  {
    re: /문제\s*해결\s*(?:능력|역량|력)\s*(?:보유|우수|탁월)?(?!\s*(?:사례|경험|통해|\d))/,
    category: 'problem_solving',
  },
  {
    re: /분석적\s*(?:사고|사고력)\s*(?:보유|우수)?(?!\s*(?:으로\s*\d|\s*\d))/,
    category: 'problem_solving',
  },

  // responsibility
  {
    re: /(?:책임감|성실성|성실함)\s*(?:강함|높음|보유|우수|탁월)?(?!\s*(?:있게\s*\d|\s*\d[^%]))/,
    category: 'responsibility',
  },
  {
    re: /끈기\s*(?:있는|보유|있음|있어)(?!\s*(?:\d|[가-힣]{0,3}하여))/,
    category: 'responsibility',
  },

  // adaptability
  {
    re: /(?:유연한|뛰어난)\s*(?:적응력|유연성)(?!\s*(?:으로\s*\d|\s*\d))/,
    category: 'adaptability',
  },
  { re: /빠른\s*적응력\s*(?:보유|우수)?(?!\s*(?:으로\s*\d))/, category: 'adaptability' },

  // creativity
  {
    re: /창의적\s*(?:인|인재|사고|역량|아이디어)\s*(?:보유|우수|탁월)?(?!\s*(?:으로\s*\d|\s*[가-힣]{0,6}하여))/,
    category: 'creativity',
  },
  {
    re: /혁신적\s*(?:인|인재|사고)\s*(?:보유)?(?!\s*(?:\d|\s*[가-힣]{0,6}하여))/,
    category: 'creativity',
  },
];

// Evidenced claims — same keywords followed by quantitative or narrative context
const EVIDENCED_PATTERNS: SoftSkillPattern[] = [
  // communication
  {
    re: /(?:커뮤니케이션|의사소통|소통)\s*(?:능력|역량|스킬)?\s*[가-힣\s]{0,20}(?:통해|으로)\s*[가-힣\s]{0,30}(?:\d+|표준화|도입|개선|단축|향상|해결)/,
    category: 'communication',
  },
  { re: /\d+\s*개?\s*팀\s*(?:과|와|간)?\s*(?:협업|소통|커뮤니케이션)/, category: 'communication' },

  // teamwork
  {
    re: /(?:팀워크|협업)\s*[가-힣\s]{0,20}(?:통해|으로)\s*[가-힣\s]{0,30}(?:\d+|표준화|도입|개선|단축|향상|달성)/,
    category: 'teamwork',
  },
  { re: /\d+\s*명\s*(?:팀|팀원|구성원)\s*[가-힣\s]{0,20}(?:협업|협력|함께)/, category: 'teamwork' },

  // leadership_soft
  {
    re: /주도적\s*[가-힣\s]{0,20}(?:기획|설계|구축|도입|개선)\s*(?:하여|하고|해서)\s*[가-힣\s]{0,30}\d+/,
    category: 'leadership_soft',
  },
  {
    re: /적극적\s*[가-힣\s]{0,20}(?:제안|건의|추진)\s*(?:하여|하고|해서)\s*[가-힣\s]{0,30}(?:\d+|개선|도입|채택)/,
    category: 'leadership_soft',
  },

  // problem_solving
  {
    re: /(?:문제\s*해결|분석적\s*사고)\s*[가-힣\s]{0,20}(?:통해|으로|하여)\s*[가-힣\s]{0,30}\d+/,
    category: 'problem_solving',
  },
  {
    re: /\d+\s*(?:가지|개|건)\s*(?:문제|버그|이슈)\s*[가-힣\s]{0,20}(?:해결|수정|개선|처리)/,
    category: 'problem_solving',
  },

  // responsibility
  {
    re: /(?:책임감|성실)\s*[가-힣\s]{0,20}(?:있게|으로)\s*[가-힣\s]{0,30}(?:\d+건?|\d+개?\s*월|\d+년)/,
    category: 'responsibility',
  },
  {
    re: /\d+\s*(?:건|개|회)\s*(?:무결근|무결점|무장애)\s*(?:달성|유지)/,
    category: 'responsibility',
  },

  // adaptability
  {
    re: /(?:적응력|유연성)\s*[가-힣\s]{0,20}(?:통해|으로|덕분에)\s*[가-힣\s]{0,30}(?:\d+일|\d+주|\d+개월)\s*(?:만에|안에|내에)/,
    category: 'adaptability',
  },
  {
    re: /\d+\s*(?:주|일|개월)\s*(?:만에|안에)\s*[가-힣\s]{0,20}(?:온보딩|적응|파악|습득)/,
    category: 'adaptability',
  },

  // creativity
  {
    re: /창의적\s*[가-힣\s]{0,20}(?:아이디어|제안|방법)\s*[가-힣\s]{0,20}(?:통해|으로|하여)\s*[가-힣\s]{0,30}\d+/,
    category: 'creativity',
  },
  {
    re: /새로운\s*(?:방식|방법|접근법)\s*[가-힣\s]{0,20}(?:제안|도입|적용)\s*(?:하여|하고|해서)\s*[가-힣\s]{0,30}\d+/,
    category: 'creativity',
  },
];

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function checkSoftSkillEvidence(text: string): SoftSkillEvidenceReport {
  const t = text ?? '';
  const claims: SoftSkillClaim[] = [];
  const seenBare = new Set<SoftSkillCategory>();
  const seenEvidenced = new Set<SoftSkillCategory>();

  // Collect evidenced first (higher priority)
  for (const { re, category } of EVIDENCED_PATTERNS) {
    const m = t.match(re);
    if (m && !seenEvidenced.has(category)) {
      seenEvidenced.add(category);
      claims.push({ category, phrase: m[0].slice(0, 60), quality: 'evidenced' });
    }
  }

  // Collect bare — only if not already found as evidenced
  for (const { re, category } of BARE_PATTERNS) {
    const m = t.match(re);
    if (m && !seenBare.has(category) && !seenEvidenced.has(category)) {
      seenBare.add(category);
      claims.push({ category, phrase: m[0].slice(0, 60), quality: 'bare' });
    }
  }

  const bareClaims = claims.filter((c) => c.quality === 'bare');
  const evidencedClaims = claims.filter((c) => c.quality === 'evidenced');
  const total = claims.length;

  let grade: OverallSoftSkillGrade;
  let score: number;

  if (total === 0) {
    grade = 'none';
    score = 0;
  } else {
    score = Math.round((evidencedClaims.length / total) * 100);
    if (score >= 80) grade = 'good';
    else if (score >= 30) grade = 'mixed';
    else grade = 'bare';
  }

  let suggestion: string;
  if (grade === 'good') {
    suggestion = '소프트 스킬 주장에 구체적인 근거가 잘 뒷받침되어 있습니다.';
  } else if (grade === 'mixed') {
    suggestion =
      '일부 소프트 스킬 주장에 수치나 사례 근거가 부족합니다. 근거를 추가하면 설득력이 높아집니다.';
  } else if (grade === 'bare') {
    suggestion =
      '소프트 스킬 주장이 근거 없이 선언형으로 기술되어 있습니다. "커뮤니케이션 능력 우수" 대신 "5개 팀과 협업하여 배포 리드타임 20% 단축"처럼 구체적으로 작성하세요.';
  } else {
    suggestion = '소프트 스킬 관련 표현이 감지되지 않았습니다.';
  }

  return { claims, bareClaims, evidencedClaims, grade, score, suggestion };
}
