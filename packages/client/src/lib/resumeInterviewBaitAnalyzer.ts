/**
 * 면접 유도 소재(Interview Bait) 분석 — 이력서에서 면접관이 자연스럽게 질문하고 싶어지는
 * "스토리 훅"을 감지한다. 단순 수치 검증(quantification)과 달리, 질문을 유도하는
 * 서사 구조(before→after 전환, 규모 성장, 도전 극복)에 집중한다.
 */

export type BaitType =
  | 'transformation' // A→B 또는 X에서 Y로 전환
  | 'scale' // 대규모 수치 (억 단위, 수백만 사용자 등)
  | 'challenge_overcome' // 어려운 상황을 극복한 서술
  | 'unexpected_achievement' // 역할 대비 예상을 뛰어넘는 성과
  | 'initiative' // 공식 권한 없이 주도한 행동
  | 'impact_chain'; // 한 행동이 연쇄적으로 결과를 낳은 구조

export interface InterviewBait {
  type: BaitType;
  phrase: string;
  explanation: string;
}

export interface InterviewBaitReport {
  baits: InterviewBait[];
  hookScore: number; // 0-100
  level: 'rich' | 'adequate' | 'sparse' | 'none';
  tip: string;
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

interface BaitPattern {
  re: RegExp;
  type: BaitType;
  explanation: string;
  score: number;
}

const BAIT_PATTERNS: BaitPattern[] = [
  // Transformation: A→B or before→after
  {
    re: /\d+\s*(?:만|억|천|ms|초|분|px|KB|MB|GB|%|배|명|건|개|원)?\s*(?:→|에서\s*\d|에서\s*[가-힣])/,
    type: 'transformation',
    explanation: '수치 전환 (이전→이후)',
    score: 20,
  },
  {
    re: /(?:기존|레거시|기존\s*시스템|모놀리식)\s*(?:대비|에서|을)\s*(?:개선|전환|마이그레이션|리팩터)/,
    type: 'transformation',
    explanation: '레거시→현대화 전환',
    score: 18,
  },
  {
    re: /(?:초기|0명|1명|소규모|팀\s*없이|혼자서?)\s*(?:부터|에서|시작해)\s*(?:\d+명|\S+\s*팀|조직|확장)/,
    type: 'transformation',
    explanation: '0→N 조직/팀 성장',
    score: 22,
  },

  // Scale — impressive numbers
  {
    re: /(?:DAU|MAU|UV)\s*\d+\s*만/,
    type: 'scale',
    explanation: '대규모 사용자 서비스',
    score: 20,
  },
  {
    re: /\d+\s*억\s*(?:건|원|회|트랜잭션)/,
    type: 'scale',
    explanation: '억 단위 거래/규모',
    score: 18,
  },
  {
    re: /\d{4,}(?:만)?\s*(?:명|사용자|유저|회원)(?:\s*서비스|\s*플랫폼)?/,
    type: 'scale',
    explanation: '대규모 사용자 기반',
    score: 16,
  },
  {
    re: /글로벌\s*(?:\d+개국|\d+개\s*국가|서비스|배포)/,
    type: 'scale',
    explanation: '글로벌 서비스 규모',
    score: 16,
  },

  // Challenge overcome
  {
    re: /(?:장애|인시던트|사고|이슈)\s*(?:대응|해결|복구|처리)/,
    type: 'challenge_overcome',
    explanation: '장애/위기 대응 경험',
    score: 15,
  },
  {
    re: /(?:마감|데드라인|런칭|출시)\s*(?:직전|압박|촉박한)\s*(?:상황|일정)/,
    type: 'challenge_overcome',
    explanation: '타이트한 일정 극복',
    score: 12,
  },
  {
    re: /(?:없던|부재|부재했던|미흡했던|부족했던)\s*[가-힣\s]*(?:인프라|프로세스|문서화|기술|환경|시스템)\s*[가-힣\s]*(?:구축|수립|도입|정립)/,
    type: 'challenge_overcome',
    explanation: '무에서 유로 환경 구축',
    score: 18,
  },
  {
    re: /(?:혼자서?|단독으로?|1인\s*개발)\s*(?:설계|구현|개발|구축|운영)/,
    type: 'challenge_overcome',
    explanation: '1인 단독 구현 경험',
    score: 14,
  },

  // Unexpected achievement (junior doing senior work)
  {
    re: /(?:신입|인턴|주니어)\s*[가-힣\s]{0,20}(?:임에도|이었음에도|였지만|시절에?)\s*[가-힣\s]{0,20}(?:리드|주도|설계|아키텍처|구축)/,
    type: 'unexpected_achievement',
    explanation: '직급 대비 높은 책임',
    score: 22,
  },
  {
    re: /(?:비개발|비전공|비IT)\s*(?:배경|전공|출신)\s*(?:으로|임에도|이지만)/,
    type: 'unexpected_achievement',
    explanation: '비전공자 전향 스토리',
    score: 18,
  },

  // Initiative — acted without formal authority
  {
    re: /(?:직접\s*제안|자발적으로|아무도\s*하지\s*않았던|사내\s*첫|최초로\s*도입)/,
    type: 'initiative',
    explanation: '자발적 주도 행동',
    score: 16,
  },
  {
    re: /(?:기술\s*부채|개발\s*문화|프로세스)\s*(?:개선을?\s*제안|해결을?\s*주도)/,
    type: 'initiative',
    explanation: '프로세스/문화 개선 주도',
    score: 14,
  },

  // Impact chain
  {
    re: /(?:결과적으로|이로\s*인해|덕분에|이후\s*[가-힣]+\s*(?:개선|증가|감소|단축|향상))/,
    type: 'impact_chain',
    explanation: '행동→결과 연쇄 서술',
    score: 12,
  },
  {
    re: /(?:비용|처리\s*시간|응답\s*시간|에러\s*율|실패\s*율)\s*(?:\d+%?|절반)\s*(?:절감|단축|감소|개선)/,
    type: 'impact_chain',
    explanation: '구체적 지표 개선',
    score: 16,
  },
];

const BAIT_TYPE_LABEL: Record<BaitType, string> = {
  transformation: '전환/개선',
  scale: '규모/임팩트',
  challenge_overcome: '도전 극복',
  unexpected_achievement: '기대 초과 성과',
  initiative: '자발적 주도',
  impact_chain: '연쇄 결과',
};

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function analyzeInterviewBait(text: string): InterviewBaitReport {
  const t = text ?? '';
  const baits: InterviewBait[] = [];

  for (const { re, type, explanation, score: _ } of BAIT_PATTERNS) {
    const m = t.match(re);
    if (m) {
      baits.push({ type, phrase: m[0].slice(0, 60), explanation });
    }
  }

  const totalScore = BAIT_PATTERNS.filter(({ re }) => re.test(t)).reduce(
    (sum, p) => sum + p.score,
    0,
  );

  const hookScore = Math.min(100, totalScore);

  let level: InterviewBaitReport['level'];
  if (hookScore >= 50) level = 'rich';
  else if (hookScore >= 25) level = 'adequate';
  else if (hookScore >= 5) level = 'sparse';
  else level = 'none';

  const tip =
    level === 'rich'
      ? '면접관의 질문을 유도하는 흥미로운 소재가 풍부합니다. 답변 준비를 철저히 하세요.'
      : level === 'adequate'
        ? '이야기할 수 있는 소재가 있지만, A→B 수치 전환이나 도전 극복 스토리를 더 추가하면 더 풍성해집니다.'
        : level === 'sparse'
          ? '"이 경험에서 가장 어려웠던 점은?" 식의 질문에 답할 수 있는 구체적 스토리를 발굴하세요.'
          : '이력서에 인상적인 스토리 소재가 거의 없습니다. 과거 프로젝트에서 기억에 남는 전환점·위기·성과를 추가하세요.';

  return { baits, hookScore, level, tip };
}

export { BAIT_TYPE_LABEL };
