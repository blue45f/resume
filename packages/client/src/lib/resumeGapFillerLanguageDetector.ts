/**
 * 이력서 공허 표현 감지기 — "열심히 노력", "다양한 경험",
 * "성실하게 임했습니다" 등 실질 내용 없이 지면을 채우는
 * 상투적 표현을 감지한다.
 */

export type GapFillerCategory =
  | 'vague_effort' // 노력·성실·열정만 강조
  | 'hollow_diversity' // "다양한" 수식어 남용
  | 'responsibility_dodge' // 역할 회피 ("맡은 바 최선")
  | 'vague_contribution' // 기여/참여 모호화
  | 'generic_teamwork' // 팀워크 클리셰
  | 'growth_cliche' // 성장·발전 공허 표현
  | 'vague_experience'; // "경험을 쌓았습니다" 류

export interface GapFillerMatch {
  category: GapFillerCategory;
  phrase: string;
  suggestion: string;
}

export type GapFillerSeverity = 'heavy' | 'moderate' | 'light' | 'clean';

export interface ResumeGapFillerReport {
  matches: GapFillerMatch[];
  severity: GapFillerSeverity;
  fillerDensity: number; // matches / 100 chars (x1000 for display)
  summary: string;
  rewriteGuide: string[];
}

// ---------------------------------------------------------------------------
// Pattern registry
// ---------------------------------------------------------------------------

interface PatternDef {
  re: RegExp;
  category: GapFillerCategory;
  suggestion: string;
}

const FILLER_PATTERNS: PatternDef[] = [
  // vague_effort
  {
    re: /열심히\s*(?:노력|임했|했|했습니다|하였습니다|하겠습니다)/,
    category: 'vague_effort',
    suggestion: '구체적 행동과 결과로 교체 (예: "OKR 달성률 120% 달성")',
  },
  {
    re: /성실(?:하게|히)\s*(?:임했|했|하였|수행)/,
    category: 'vague_effort',
    suggestion: '어떤 업무를 얼마나 일관성 있게 했는지 수치로 표현하세요',
  },
  {
    re: /(?:최선을\s*다해|최선을\s*다하여|최선으로)\s*(?:임했|했|하겠|수행)/,
    category: 'vague_effort',
    suggestion: '"최선" 대신 실제 성과 (예: "마감 기한 100% 준수")',
  },
  {
    re: /(?:꾸준히|끊임없이)\s*(?:노력|공부|발전|성장)(?:해왔|했|하였|해)/,
    category: 'vague_effort',
    suggestion: '학습 내용·완료한 과정·레벨업 기점을 명시하세요',
  },

  // hollow_diversity
  {
    re: /다양한\s*(?:경험|업무|프로젝트|환경|기술|도전)/,
    category: 'hollow_diversity',
    suggestion: '"다양한" 대신 구체적 항목 2-3개를 열거하세요',
  },
  {
    re: /여러\s*(?:분야|경험|프로젝트|역할)\s*(?:를|을)?\s*(?:쌓|경험|수행)/,
    category: 'hollow_diversity',
    suggestion: '어떤 분야인지 명시하고 각 경험의 임팩트를 적으세요',
  },

  // responsibility_dodge
  {
    re: /맡은\s*바\s*(?:최선|성실|열심)/,
    category: 'responsibility_dodge',
    suggestion: '담당 업무 범위와 의사결정 권한을 구체적으로 적으세요',
  },
  {
    re: /(?:주어진|맡겨진)\s*업무\s*(?:를|을)?\s*(?:충실히|성실히|열심히)\s*수행/,
    category: 'responsibility_dodge',
    suggestion: '업무 내용과 산출물을 명시하세요 (예: "월 보고서 5종 작성·배포")',
  },

  // vague_contribution
  {
    re: /(?:기여|참여|관여)(?:했|하였|해왔)\s*습니다?/,
    category: 'vague_contribution',
    suggestion: '어떤 방식으로 얼마나 기여했는지 수치·역할을 명시하세요',
  },
  {
    re: /(?:일원|팀원)으로서?\s*(?:기여|참여|역할)(?:했|하였|을\s*담당)/,
    category: 'vague_contribution',
    suggestion: '팀 내 구체적 역할과 본인 단독 산출물을 분리해서 쓰세요',
  },

  // generic_teamwork
  {
    re: /(?:원활한|좋은|적극적인)\s*(?:소통|커뮤니케이션|협업|협력)\s*(?:을|를)?\s*(?:통해|바탕으로|기반으로)/,
    category: 'generic_teamwork',
    suggestion: '어떤 방식으로 소통했는지 (슬랙, PR리뷰, 데일리스크럼 등) 구체화하세요',
  },
  {
    re: /(?:팀워크|팀\s*정신|협동심)\s*(?:을|를)?\s*(?:발휘|높이|강화)/,
    category: 'generic_teamwork',
    suggestion: '팀 협업의 구체적 사례 (분쟁 해결, 온보딩 지원 등)를 적으세요',
  },

  // growth_cliche
  {
    re: /(?:끊임없이|지속적으로)\s*(?:성장|발전|배움)\s*(?:하고자|하기\s*위해|을\s*추구)/,
    category: 'growth_cliche',
    suggestion: '무엇을 배웠고 어떻게 적용했는지 (기술명, 완료 프로젝트) 서술하세요',
  },
  {
    re: /스스로\s*(?:성장|발전)\s*(?:하는|하기\s*위해|하고자)/,
    category: 'growth_cliche',
    suggestion: '자기주도 학습의 구체적 사례 (오픈소스 기여, 사이드 프로젝트 등)를 넣으세요',
  },

  // vague_experience
  {
    re: /(?:다양한|귀중한|소중한)?\s*경험(?:을|을\s*통해)?\s*(?:쌓았|쌓아왔|얻었|하였)\s*습니다?/,
    category: 'vague_experience',
    suggestion: '"경험을 쌓았습니다" 대신 구체적 프로젝트·역할·결과를 나열하세요',
  },
  {
    re: /(?:많은|풍부한)\s*(?:경험|노하우|역량)\s*(?:을|를)?\s*(?:보유|갖추|가지고)/,
    category: 'vague_experience',
    suggestion: '"많은 경험 보유" 대신 대표 경험 2-3개를 수치화해서 서술하세요',
  },
];

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function detectResumeGapFillerLanguage(text: string): ResumeGapFillerReport {
  const t = text ?? '';
  const matches: GapFillerMatch[] = [];

  for (const { re, category, suggestion } of FILLER_PATTERNS) {
    const m = t.match(re);
    if (m) {
      matches.push({ category, phrase: m[0].slice(0, 40), suggestion });
    }
  }

  const charLen = Math.max(t.length, 1);
  const fillerDensity = Math.round((matches.length / charLen) * 1000 * 10) / 10;

  let severity: GapFillerSeverity;
  if (matches.length >= 5) severity = 'heavy';
  else if (matches.length >= 3) severity = 'moderate';
  else if (matches.length >= 1) severity = 'light';
  else severity = 'clean';

  let summary: string;
  if (severity === 'heavy') {
    summary = `공허한 표현이 ${matches.length}개 감지됩니다. 구체적 성과와 수치로 교체하면 서류 통과율이 크게 오릅니다.`;
  } else if (severity === 'moderate') {
    summary = `상투적 표현 ${matches.length}개가 있습니다. 일부를 구체적 사례로 바꾸세요.`;
  } else if (severity === 'light') {
    summary = `가벼운 상투 표현 ${matches.length}개가 감지됩니다. 수치나 사례로 대체하면 더 설득력 있습니다.`;
  } else {
    summary = '공허한 표현이 감지되지 않습니다. 구체적·수치적 서술이 잘 되어 있습니다.';
  }

  const rewriteGuide: string[] = [];
  if (matches.some((m) => m.category === 'vague_effort')) {
    rewriteGuide.push('노력·성실 표현 → 수치화 (예: "마감 준수율 100%", "주 5회 코드 리뷰 주도")');
  }
  if (matches.some((m) => m.category === 'hollow_diversity')) {
    rewriteGuide.push('"다양한" → 구체적 목록 열거 (예: "React/Next.js/Svelte 3개 FE 스택 경험")');
  }
  if (matches.some((m) => m.category === 'vague_contribution')) {
    rewriteGuide.push('기여/참여 → 개인 산출물 구분 (예: "API 설계 3종 단독 담당")');
  }
  if (matches.some((m) => m.category === 'generic_teamwork')) {
    rewriteGuide.push('팀워크 클리셰 → 협업 메커니즘 (예: "PR 리뷰 응답 시간 4h 이내 유지")');
  }

  return { matches, severity, fillerDensity, summary, rewriteGuide };
}
