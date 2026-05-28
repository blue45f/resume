export type CultureCategory =
  | 'flat' // 수평적 문화
  | 'autonomy' // 자율과 책임 / 책임감 있는 자율
  | 'work-life' // 워라밸 / 일과 삶의 균형
  | 'growth' // 빠르게 성장하는 / 성장하는 회사
  | 'family' // 가족같은 분위기
  | 'startup-pace' // 빠른 속도 / dynamic
  | 'passionate-team'; // 열정적인 동료

export type CultureTone = 'good' | 'neutral' | 'warning';

export interface CultureHit {
  category: CultureCategory;
  categoryLabel: string;
  match: string;
  excerpt: string;
  /** Korean explanation of what's vague. */
  concern: string;
  /** A concrete interview question to verify the claim. */
  interviewQuestion: string;
  /** Red flag intensity (high=실제로 부정 신호 위험, medium=확인 필요, low=일반적 표현). */
  severity: 'high' | 'medium' | 'low';
}

export interface CultureReport {
  /** All detected hits. */
  hits: CultureHit[];
  /** 0-100 specificity score. Higher = JD is more concrete. */
  specificityScore: number;
  /** How many concrete signals (numbers, named programs) were also present. */
  concreteSignals: number;
  tone: CultureTone;
  /** Korean short label. */
  label: string;
  /** Korean one-sentence summary. */
  summary: string;
}

interface CultureRule {
  category: CultureCategory;
  categoryLabel: string;
  patterns: RegExp[];
  concern: string;
  interviewQuestion: string;
  severity: 'high' | 'medium' | 'low';
}

const RULES: CultureRule[] = [
  {
    category: 'flat',
    categoryLabel: '수평적 문화',
    patterns: [
      /수평적(?:인|\s*인)?\s*(?:문화|조직|커뮤니케이션|소통)/g,
      /직급\s*없는\s*(?:문화|조직)/g,
      /(?:열린|오픈한)\s*(?:커뮤니케이션|소통)/g,
      /\bflat\s*(?:organization|culture|hierarchy)\b/gi,
    ],
    concern:
      '실제로는 의사결정이 위에서 내려오는 경우가 많습니다. 어떤 사례로 "수평적"이 작동하는지 확인이 필요합니다.',
    interviewQuestion: '"최근 6개월 안에 신입·주니어 의견으로 회사 결정이 바뀐 사례가 있나요?"',
    severity: 'medium',
  },
  {
    category: 'autonomy',
    categoryLabel: '자율과 책임',
    patterns: [
      /자율(?:과|성과)?\s*(?:책임|성과)/g,
      /자율적(?:인|으로)\s*(?:업무|근무|일)/g,
      /(?<![가-힣])주도적(?:인|으로)\s*(?:업무|일|일하는)/g,
      /\bownership\s*(?:culture|mindset)?\b/gi,
    ],
    concern: '"자율"이 실제로는 도구·예산·일정·승인 권한 없이 결과만 책임지는 구조일 수 있습니다.',
    interviewQuestion:
      '"실무자가 단독으로 결재할 수 있는 의사결정 범위(예산·인원·일정)는 어디까지인가요?"',
    severity: 'medium',
  },
  {
    category: 'work-life',
    categoryLabel: '워라밸',
    patterns: [
      /워라밸(?:이|을|을\s*보장|보장|중시|중요시)?/g,
      /일과\s*삶의?\s*균형/g,
      /(?:정시\s*퇴근|칼퇴근?)/g,
      /\bwork[-\s]?life\s*balance\b/gi,
    ],
    concern:
      'JD에 "워라밸"이 자주 등장하는 회사일수록 실제로는 그렇지 않다는 업계 통념이 있습니다.',
    interviewQuestion: '"지난 분기 평균 잔업 시간과, 가장 바빴던 달의 잔업 시간이 어땠나요?"',
    severity: 'high',
  },
  {
    category: 'growth',
    categoryLabel: '빠른 성장',
    patterns: [
      /빠르게\s*성장(?:하는|중인)/g,
      /(?:폭발적(?:인|으로)|급격(?:한|히))\s*성장/g,
      /성장(?:하는|할\s*수\s*있는)\s*(?:회사|조직|환경)/g,
      /\b(?:high[-\s]?growth|fast[-\s]?growing|hyper[-\s]?growth)\b/gi,
    ],
    concern:
      '"빠른 성장"은 보통 인력 부족·잔업·역할 모호함을 동반합니다. 성장의 종류(매출/팀/제품)를 확인하세요.',
    interviewQuestion:
      '"최근 12개월 매출·MAU·팀원 수 중 어느 지표가 몇 배 늘었나요? 다음 12개월 목표는?"',
    severity: 'medium',
  },
  {
    category: 'family',
    categoryLabel: '가족같은 분위기',
    patterns: [
      /가족\s*같은\s*(?:분위기|회사|조직|문화)/g,
      /(?<![가-힣])하나의\s*가족/g,
      /\b(?:like\s*a\s*family|family[-\s]?like)\b/gi,
    ],
    concern:
      '"가족"은 한국 시장에서 잔업·정서적 부담·경계 모호함을 암시하는 경고 표현으로 자주 분류됩니다.',
    interviewQuestion:
      '"가족같은 분위기"가 구체적으로 어떤 의례·이벤트·회식 패턴을 의미하는지 물어보세요.',
    severity: 'high',
  },
  {
    category: 'startup-pace',
    categoryLabel: '스타트업 속도',
    patterns: [
      /(?:빠른|치열한)\s*속도/g,
      /역동적(?:인|으로)/g,
      /다이내믹한?\s*(?:환경|조직|분위기)/g,
      /\b(?:dynamic|fast[-\s]?paced|move\s*fast)\b/gi,
    ],
    concern: '"빠른 속도/역동적"은 보통 잦은 요구사항 변경·우선순위 재배치·OKR 잔존을 의미합니다.',
    interviewQuestion: '"한 분기 동안 사용자에게 직접 가는 의사결정 변경 빈도는 어느 정도였나요?"',
    severity: 'low',
  },
  {
    category: 'passionate-team',
    categoryLabel: '열정 동료',
    patterns: [
      /열정(?:적인|있는)\s*(?:동료|팀|구성원|사람들)/g,
      /열정\s*가득(?:한|찬)/g,
      /\bpassionate\s*(?:team|colleagues|people)\b/gi,
    ],
    concern: '"열정"은 평가하기 어렵고 잔업·자발적 무급 근무를 정당화하는 신호일 수 있습니다.',
    interviewQuestion: '"동료들의 평균 근속 연수와 1년 차 이내 퇴사율을 알 수 있을까요?"',
    severity: 'low',
  },
];

const CONCRETE_PATTERNS: RegExp[] = [
  // Concrete numbers attached to culture/comp/benefits.
  /\d{1,3}\s*시간\s*(?:이내|미만|이하)?\s*(?:근무|퇴근)/g,
  /연차\s*\d{1,2}일/g,
  /주\s*\d일\s*재택/g,
  /식대\s*월\s*\d/g,
  /\d{1,3}만원\s*(?:식대|교통비|자기계발|도서)/g,
  /평균\s*근속\s*\d/g,
  // English numeric culture signals.
  /\b\d+\s*(?:weeks?|days?)\s*of\s*(?:pto|vacation|parental\s*leave)\b/gi,
];

const CONTEXT_RADIUS = 28;

function makeExcerpt(text: string, start: number, length: number): string {
  const left = Math.max(0, start - CONTEXT_RADIUS);
  const right = Math.min(text.length, start + length + CONTEXT_RADIUS);
  const prefix = left > 0 ? '…' : '';
  const suffix = right < text.length ? '…' : '';
  return `${prefix}${text.slice(left, right).trim()}${suffix}`;
}

function countConcrete(text: string): number {
  let n = 0;
  for (const p of CONCRETE_PATTERNS) {
    const flags = p.flags.includes('g') ? p.flags : p.flags + 'g';
    const re = new RegExp(p.source, flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex += 1;
        continue;
      }
      n += 1;
    }
  }
  return n;
}

export function buildJdCultureReport(text: string): CultureReport {
  const safe = (text ?? '').trim();
  if (!safe) {
    return {
      hits: [],
      specificityScore: 0,
      concreteSignals: 0,
      tone: 'neutral',
      label: '문화 신호 없음',
      summary: '분석할 채용 공고 본문이 비어 있습니다.',
    };
  }

  const hits: CultureHit[] = [];
  for (const rule of RULES) {
    const seen = new Set<number>();
    for (const pattern of rule.patterns) {
      const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
      const re = new RegExp(pattern.source, flags);
      let m: RegExpExecArray | null;
      while ((m = re.exec(safe)) !== null) {
        if (m[0].length === 0) {
          re.lastIndex += 1;
          continue;
        }
        if (seen.has(m.index)) continue;
        seen.add(m.index);
        hits.push({
          category: rule.category,
          categoryLabel: rule.categoryLabel,
          match: m[0],
          excerpt: makeExcerpt(safe, m.index, m[0].length),
          concern: rule.concern,
          interviewQuestion: rule.interviewQuestion,
          severity: rule.severity,
        });
      }
    }
  }

  const concreteSignals = countConcrete(safe);

  // Specificity: start at 50, add for concrete, subtract for vague.
  let specificity = 50;
  specificity += Math.min(50, concreteSignals * 12);
  for (const hit of hits) {
    specificity -= hit.severity === 'high' ? 12 : hit.severity === 'medium' ? 7 : 3;
  }
  if (specificity < 0) specificity = 0;
  if (specificity > 100) specificity = 100;

  let tone: CultureTone;
  let summary: string;
  if (hits.length === 0 && concreteSignals === 0) {
    tone = 'neutral';
    summary = '문화·복지 관련 명시적 신호가 거의 없습니다. 면접에서 직접 묻는 게 좋습니다.';
  } else if (specificity >= 70) {
    tone = 'good';
    summary = `구체 신호 ${concreteSignals}개로 JD가 솔직한 편입니다. 모호 표현(${hits.length}개)은 면접에서 1~2개만 검증하세요.`;
  } else if (specificity >= 45) {
    tone = 'neutral';
    summary = `모호한 문화 표현 ${hits.length}개가 보입니다. 가장 신경 쓰이는 표현을 면접에서 확인하세요.`;
  } else {
    tone = 'warning';
    summary = `JD가 모호한 문화 표현 위주(${hits.length}개)이고 구체 신호는 ${concreteSignals}개에 그칩니다. 입사 전 검증이 필요합니다.`;
  }

  // Sort hits: high severity first, then by occurrence count.
  const sev = { high: 0, medium: 1, low: 2 } as const;
  hits.sort((a, b) => sev[a.severity] - sev[b.severity]);

  return {
    hits,
    specificityScore: specificity,
    concreteSignals,
    tone,
    label: `구체성 ${specificity}점`,
    summary,
  };
}
