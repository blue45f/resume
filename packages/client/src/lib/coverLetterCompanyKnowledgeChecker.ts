/**
 * 자기소개서 회사 이해도 깊이 검사기 — 지원자가 회사의 제품·기술·
 * 비즈니스·문화를 얼마나 구체적으로 언급하는지 평가한다.
 * 추상적 찬사(최고의 기업, 업계 선도)와 구체적 지식(제품명, 기술 스택,
 * 특정 이니셔티브, 성과 수치)을 구분한다.
 */

export type CompanyKnowledgeSignalType =
  | 'product_mention' // 회사 특정 제품·서비스 언급
  | 'tech_stack_match' // 회사 실제 기술 스택 언급
  | 'business_context' // 회사 비즈니스·시장 포지션 이해
  | 'initiative_reference' // 공개 이니셔티브·전략 언급
  | 'culture_alignment' // 회사 특정 문화 키워드와 정렬
  | 'milestone_reference'; // 회사 특정 성과·이정표 언급

export type VaguePraiseType =
  | 'generic_best' // "최고의", "최고 수준"
  | 'hollow_aspiration' // "귀사의 비전에 공감"
  | 'unspecific_culture'; // "좋은 문화"

export interface CompanyKnowledgeSignal {
  type: CompanyKnowledgeSignalType;
  excerpt: string;
}

export interface VaguePraiseSignal {
  type: VaguePraiseType;
  excerpt: string;
}

export type CompanyKnowledgeDepth = 'specific' | 'moderate' | 'generic' | 'none';

export interface CoverLetterCompanyKnowledgeReport {
  knowledgeSignals: CompanyKnowledgeSignal[];
  vaguePraiseSignals: VaguePraiseSignal[];
  knowledgeScore: number; // 0–100
  vaguePraiseCount: number;
  depth: CompanyKnowledgeDepth;
  suggestion: string;
}

// ---------------------------------------------------------------------------
// Specific knowledge patterns
// ---------------------------------------------------------------------------

interface KnowledgePattern {
  re: RegExp;
  type: CompanyKnowledgeSignalType;
  weight: number;
}

const KNOWLEDGE_PATTERNS: KnowledgePattern[] = [
  // Product / service mention (company-specific names likely to appear)
  {
    re: /(?:귀사의|해당\s*회사의|[가-힣]{2,8}사의)\s*(?:서비스|제품|플랫폼|앱|솔루션)/,
    type: 'product_mention',
    weight: 15,
  },
  {
    re: /(?:직접\s*사용|사용해\s*보며|써\s*보면서|경험하며)\s*(?:느꼈|알게\s*되었|파악했)/,
    type: 'product_mention',
    weight: 20,
  },

  // Tech stack match
  {
    re: /(?:귀사의|해당\s*기업의)\s*(?:기술\s*스택|아키텍처|인프라|오픈소스)/,
    type: 'tech_stack_match',
    weight: 15,
  },
  {
    re: /귀사\s*(?:블로그|기술\s*블로그|테크\s*블로그)\s*(?:를\s*읽으며|를\s*통해|에서)/,
    type: 'tech_stack_match',
    weight: 20,
  },

  // Business context
  {
    re: /(?:시장\s*점유율|MAU|DAU|월간\s*활성\s*사용자|시장\s*규모)\s*(?:[0-9]|언급|성장)/,
    type: 'business_context',
    weight: 20,
  },
  {
    re: /(?:B2B|B2C|SaaS|플랫폼\s*비즈니스|핀테크|에듀테크|헬스케어)\s*(?:모델|사업|전략|시장)/,
    type: 'business_context',
    weight: 15,
  },
  {
    re: /(?:경쟁사|업계\s*경쟁|시장\s*포지셔닝|차별화\s*전략)\s*(?:대비|분석|파악|이해)/,
    type: 'business_context',
    weight: 20,
  },

  // Initiative / strategy reference
  {
    re: /귀사\s*(?:의\s*)?(?:[가-힣A-Za-z0-9]+)\s*(?:프로젝트|이니셔티브|로드맵|전략)\s*(?:에\s*대해|을\s*보고|를\s*접하며)/,
    type: 'initiative_reference',
    weight: 20,
  },
  {
    re: /(?:최근\s*발표|작년\s*발표|지난\s*달\s*공개)\s*(?:된|하신|한)\s*[가-힣A-Za-z0-9\s]{2,20}/,
    type: 'initiative_reference',
    weight: 20,
  },

  // Culture alignment (specific culture keywords)
  {
    re: /(?:오너십|ownership|주도적\s*문화|자율\s*책임|자율과\s*책임)\s*(?:문화|가치|철학)/,
    type: 'culture_alignment',
    weight: 15,
  },
  {
    re: /(?:피드백\s*문화|투명한\s*소통|수평적\s*조직|심리적\s*안전감)\s*(?:을\s*보고|을\s*통해|에\s*공감)/,
    type: 'culture_alignment',
    weight: 20,
  },

  // Milestone reference
  {
    re: /(?:시리즈\s*[A-E]|IPO|상장|[0-9,]+억\s*투자|유니콘)\s*(?:달성|기업|성과|이후)/,
    type: 'milestone_reference',
    weight: 20,
  },
  {
    re: /(?:[0-9]+\s*주년|[0-9]+만\s*사용자\s*돌파|글로벌\s*진출\s*성공)\s*(?:을\s*보고|을\s*기념|을\s*달성)/,
    type: 'milestone_reference',
    weight: 20,
  },
];

// ---------------------------------------------------------------------------
// Vague praise patterns (reduce credibility)
// ---------------------------------------------------------------------------

interface VaguePattern {
  re: RegExp;
  type: VaguePraiseType;
}

const VAGUE_PATTERNS: VaguePattern[] = [
  // Generic superlatives
  { re: /(?:최고의|최선의|최고\s*수준의)\s*(?:기업|회사|팀|환경)/, type: 'generic_best' },
  { re: /(?:업계\s*최고|국내\s*최고|세계\s*최고)\s*(?:기업|수준|기술)/, type: 'generic_best' },
  { re: /(?:대단한|뛰어난|훌륭한)\s*(?:기업|회사|팀)\s*(?:이라고|입니다)/, type: 'generic_best' },

  // Hollow aspiration
  {
    re: /귀사의\s*(?:비전|미션|가치)\s*(?:에\s*공감|에\s*매력|에\s*감동|에\s*동의)/,
    type: 'hollow_aspiration',
  },
  {
    re: /(?:함께\s*성장하고\s*싶|함께\s*발전하고\s*싶|일원이\s*되고\s*싶|기여하고\s*싶습니다)/,
    type: 'hollow_aspiration',
  },

  // Unspecific culture praise
  {
    re: /(?:좋은|훌륭한|긍정적인)\s*(?:조직\s*문화|기업\s*문화|팀\s*문화)\s*(?:에\s*끌려|로\s*알려진|을\s*추구)/,
    type: 'unspecific_culture',
  },
  {
    re: /(?:수평적|자유로운|열린)\s*(?:분위기|문화|환경)\s*(?:에\s*매력|을\s*좋아|로\s*유명)/,
    type: 'unspecific_culture',
  },
];

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function checkCoverLetterCompanyKnowledge(text: string): CoverLetterCompanyKnowledgeReport {
  const t = text ?? '';
  const knowledgeSignals: CompanyKnowledgeSignal[] = [];
  const vaguePraiseSignals: VaguePraiseSignal[] = [];
  let knowledgeRaw = 0;
  const seenTypes = new Set<CompanyKnowledgeSignalType>();

  for (const { re, type, weight } of KNOWLEDGE_PATTERNS) {
    const m = t.match(re);
    if (m) {
      knowledgeSignals.push({ type, excerpt: m[0].slice(0, 60) });
      if (!seenTypes.has(type)) {
        seenTypes.add(type);
        knowledgeRaw += weight;
      }
    }
  }

  for (const { re, type } of VAGUE_PATTERNS) {
    const m = t.match(re);
    if (m) {
      vaguePraiseSignals.push({ type, excerpt: m[0].slice(0, 60) });
    }
  }

  const knowledgeScore = Math.min(100, knowledgeRaw);
  const vaguePraiseCount = vaguePraiseSignals.length;

  // Adjust for vague praise penalty
  const adjustedScore = Math.max(0, knowledgeScore - vaguePraiseCount * 5);

  let depth: CompanyKnowledgeDepth;
  if (adjustedScore >= 40) depth = 'specific';
  else if (adjustedScore >= 15) depth = 'moderate';
  else if (vaguePraiseCount >= 2) depth = 'generic';
  else depth = 'none';

  let suggestion: string;
  if (depth === 'specific') {
    suggestion = '회사를 구체적으로 이해하고 있음이 잘 드러납니다.';
  } else if (depth === 'moderate') {
    suggestion =
      '일부 구체적 언급이 있습니다. 제품 직접 사용 경험, 기술 블로그 내용, 최근 이니셔티브를 추가하면 더 강해집니다.';
  } else if (depth === 'generic') {
    suggestion =
      '추상적인 찬사 위주입니다. 회사 제품을 직접 써본 경험, 기술 블로그에서 읽은 내용, 특정 전략을 언급하세요.';
  } else {
    suggestion =
      '회사 이해도를 보여주는 내용이 없습니다. 지원 전 기업 리서치 후 구체적 사실을 삽입하세요.';
  }

  return {
    knowledgeSignals,
    vaguePraiseSignals,
    knowledgeScore: adjustedScore,
    vaguePraiseCount,
    depth,
    suggestion,
  };
}
