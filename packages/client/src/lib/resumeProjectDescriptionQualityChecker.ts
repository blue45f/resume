/**
 * 이력서 프로젝트/포트폴리오 기술 품질 검사기 —
 * "~을 개발했습니다" 수준의 단순 서술과
 * 역할·기술 스택·성과(수치)를 갖춘 고품질 서술을 구분한다.
 */

export type ProjectQualityDimension =
  | 'role_clarity' // 본인 역할 명시 (팀장, 백엔드 담당, 단독 개발 등)
  | 'tech_specificity' // 구체적 기술 스택 언급 (React 18, Spring Boot 3 등)
  | 'outcome_quantified' // 수치화된 성과 (응답속도 40% 개선, MAU 10만 등)
  | 'problem_statement' // 해결한 문제 서술 (기존 방식의 한계, 병목 발견 등)
  | 'team_scale' // 팀 규모·협업 언급 (5인 팀, 4개 팀 협업 등)
  | 'timeline'; // 기간·이정표 명시 (3개월, 2024.01–2024.06)

export type ProjectWeaknessType =
  | 'vague_verb' // "개발했습니다", "만들었습니다" 등 결과 없음
  | 'no_role' // 역할 불명확
  | 'no_outcome'; // 성과 없음

export interface ProjectQualitySignal {
  dimension: ProjectQualityDimension;
  excerpt: string;
}

export interface ProjectWeaknessSignal {
  type: ProjectWeaknessType;
  excerpt: string;
}

export type ProjectDescriptionGrade = 'excellent' | 'good' | 'weak' | 'vague';

export interface ResumeProjectDescriptionReport {
  qualitySignals: ProjectQualitySignal[];
  weaknessSignals: ProjectWeaknessSignal[];
  qualityScore: number; // 0–100
  grade: ProjectDescriptionGrade;
  summary: string;
  suggestions: string[];
}

// ---------------------------------------------------------------------------
// Quality signal patterns
// ---------------------------------------------------------------------------

interface QualityPattern {
  re: RegExp;
  dimension: ProjectQualityDimension;
  weight: number;
}

const QUALITY_PATTERNS: QualityPattern[] = [
  // Role clarity
  {
    re: /(?:팀장|리드|Lead|단독\s*개발|FE\s*담당|BE\s*담당|풀스택|백엔드\s*담당|프론트엔드\s*담당)\s*(?:으로|로|담당)/,
    dimension: 'role_clarity',
    weight: 20,
  },
  {
    re: /(?:기획부터\s*개발|설계부터\s*배포|처음부터\s*끝까지|A\s*to\s*Z)\s*(?:담당|개발|진행)/,
    dimension: 'role_clarity',
    weight: 20,
  },
  {
    re: /(?:[0-9]+인\s*팀|팀원\s*[0-9]+명)\s*(?:중\s*)?(?:리드|담당|개발|구현)/,
    dimension: 'role_clarity',
    weight: 15,
  },

  // Tech specificity
  {
    re: /(?:React|Vue|Angular|Next\.js|Nuxt)\s*(?:18|17|16|3|2|[0-9]+\.?[0-9]*)\s*(?:기반|사용|도입|적용)/,
    dimension: 'tech_specificity',
    weight: 15,
  },
  {
    re: /(?:Spring\s*Boot|Django|FastAPI|NestJS|Express)\s*(?:[0-9]+\.?[0-9]*\s*)?(?:기반|사용|도입|서버|API)/,
    dimension: 'tech_specificity',
    weight: 15,
  },
  {
    re: /(?:PostgreSQL|MySQL|MongoDB|Redis|Elasticsearch)\s*(?:기반|사용|도입|최적화|설계)/,
    dimension: 'tech_specificity',
    weight: 10,
  },
  {
    re: /(?:Kubernetes|Docker|AWS|GCP|Terraform)\s*(?:기반|사용|도입|구축|운영|배포)/,
    dimension: 'tech_specificity',
    weight: 10,
  },

  // Outcome quantified
  {
    re: /(?:응답\s*(?:속도|시간|레이턴시)).{0,10}[0-9]+%?\s*(?:개선|단축|감소|향상)/,
    dimension: 'outcome_quantified',
    weight: 25,
  },
  {
    re: /(?:트래픽|처리량|처리\s*속도)\s*(?:[0-9]+배?\s*(?:증가|향상|개선))/,
    dimension: 'outcome_quantified',
    weight: 25,
  },
  {
    re: /(?:MAU|DAU|사용자|회원)\s*(?:[0-9,]+명?\s*(?:달성|돌파|운영|서비스))/,
    dimension: 'outcome_quantified',
    weight: 20,
  },
  {
    re: /(?:매출|수익|비용)\s*(?:[0-9]+%?\s*(?:증가|감소|절감|향상))/,
    dimension: 'outcome_quantified',
    weight: 25,
  },
  {
    re: /(?:에러율|오류율|장애)\s*(?:[0-9]+%?\s*(?:감소|개선|제거))/,
    dimension: 'outcome_quantified',
    weight: 20,
  },

  // Problem statement
  {
    re: /(?:기존\s*(?:방식|시스템|구조|아키텍처)).{0,15}(?:한계|문제|병목|비효율).{0,10}(?:발견|파악|분석|개선)/,
    dimension: 'problem_statement',
    weight: 20,
  },
  {
    re: /(?:레거시\s*코드|기술\s*부채|비효율적\s*구조)\s*(?:개선|리팩토링|전환|해결)/,
    dimension: 'problem_statement',
    weight: 15,
  },
  {
    re: /(?:병목\s*(?:현상|구간|지점))\s*(?:발견|파악|분석|해결|개선)/,
    dimension: 'problem_statement',
    weight: 20,
  },

  // Team scale
  {
    re: /[0-9]+명?\s*(?:팀|인\s*팀|인\s*프로젝트|명\s*규모)/,
    dimension: 'team_scale',
    weight: 10,
  },
  {
    re: /(?:크로스\s*펑셔널|[0-9]+개?\s*팀\s*(?:협업|협력)|타\s*팀\s*협업)/,
    dimension: 'team_scale',
    weight: 15,
  },

  // Timeline
  {
    re: /(?:20[0-9]{2}\.(?:0?[1-9]|1[0-2])[^가-힣]*~[^가-힣]*20[0-9]{2})|(?:[0-9]+개월\s*(?:동안|간|만에|프로젝트))/,
    dimension: 'timeline',
    weight: 10,
  },
];

// ---------------------------------------------------------------------------
// Weakness patterns
// ---------------------------------------------------------------------------

interface WeaknessPattern {
  re: RegExp;
  type: ProjectWeaknessType;
}

const WEAKNESS_PATTERNS: WeaknessPattern[] = [
  // Vague verb without outcome
  {
    re: /(?:(?:개발|구현|제작|만들었|빌드)\s*(?:했습니다|하였습니다|했다))(?!\s*(?:[.,·].*(?:[0-9]|개선|향상)))/,
    type: 'vague_verb',
  },
  { re: /(?:사용\s*경험이\s*있|활용\s*경험이\s*있|다룰\s*수\s*있)\s*습니다/, type: 'vague_verb' },
];

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function checkResumeProjectDescriptionQuality(text: string): ResumeProjectDescriptionReport {
  const t = text ?? '';
  const qualitySignals: ProjectQualitySignal[] = [];
  const weaknessSignals: ProjectWeaknessSignal[] = [];
  let qualityRaw = 0;
  const seenDimensions = new Set<ProjectQualityDimension>();

  for (const { re, dimension, weight } of QUALITY_PATTERNS) {
    const m = t.match(re);
    if (m) {
      qualitySignals.push({ dimension, excerpt: m[0].slice(0, 60) });
      if (!seenDimensions.has(dimension)) {
        seenDimensions.add(dimension);
        qualityRaw += weight;
      }
    }
  }

  for (const { re, type } of WEAKNESS_PATTERNS) {
    const m = t.match(re);
    if (m) {
      weaknessSignals.push({ type, excerpt: m[0].slice(0, 60) });
    }
  }

  const qualityScore = Math.min(100, qualityRaw);

  let grade: ProjectDescriptionGrade;
  if (qualityScore >= 65) grade = 'excellent';
  else if (qualityScore >= 35) grade = 'good';
  else if (weaknessSignals.length >= 2) grade = 'vague';
  else grade = 'weak';

  let summary: string;
  if (grade === 'excellent') {
    summary = '역할·기술·성과가 구체적으로 서술된 프로젝트 설명입니다.';
  } else if (grade === 'good') {
    summary =
      '일부 구체적인 정보가 있습니다. 수치화된 성과와 문제 해결 과정을 보강하면 더 강해집니다.';
  } else if (grade === 'weak') {
    summary = '프로젝트 설명에 구체성이 부족합니다. 역할, 기술 스택, 결과 수치를 추가하세요.';
  } else {
    summary =
      '"~을 개발했습니다" 수준의 서술이 많습니다. 왜, 어떻게, 결과가 무엇인지를 명확히 기술하세요.';
  }

  const suggestions: string[] = [];
  if (!seenDimensions.has('outcome_quantified')) {
    suggestions.push('성과를 수치로 표현하세요. (응답속도 N% 개선, MAU N만 달성 등)');
  }
  if (!seenDimensions.has('role_clarity')) {
    suggestions.push(
      '프로젝트에서 본인의 역할을 명확히 서술하세요. (N인 팀 리드, BE 단독 개발 등)',
    );
  }
  if (!seenDimensions.has('problem_statement')) {
    suggestions.push('해결한 문제(기존 방식의 한계, 병목 발견)를 서술하면 설득력이 높아집니다.');
  }

  return { qualitySignals, weaknessSignals, qualityScore, grade, summary, suggestions };
}
