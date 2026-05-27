export type JdBiasCategory = 'age' | 'gender' | 'region' | 'education' | 'physical' | 'family';

export type JdBiasSeverity = 'high' | 'medium' | 'low';

export interface JdBiasFinding {
  category: JdBiasCategory;
  severity: JdBiasSeverity;
  excerpt: string;
  detail: string;
  suggestion: string;
}

export type JdBiasTone = 'good' | 'neutral' | 'warning' | 'danger';

export interface JdBiasReport {
  findings: JdBiasFinding[];
  totalCount: number;
  highCount: number;
  tone: JdBiasTone;
  label: string;
  summary: string;
}

interface BiasRule {
  category: JdBiasCategory;
  severity: JdBiasSeverity;
  /** Regex (multi-line, global, case-insensitive). */
  pattern: RegExp;
  detail: string;
  suggestion: string;
}

const RULES: BiasRule[] = [
  // Age — 한국 채용공고에서 가장 흔한 편향. 법적으로도 '연령차별금지법' 적용.
  {
    category: 'age',
    severity: 'high',
    pattern:
      /\b(?:20|30)대?(?:\s*초중|초반|중반|후반)?\b|20[-~]30대|만\s*\d{1,2}\s*세\s*(?:이하|이상)/g,
    detail:
      '연령대를 직접 지정하는 표현은 「고용상 연령차별금지 및 고령자고용촉진법」 위반 소지가 있습니다.',
    suggestion: '연차/경력 기반 요건(예: 5년 이상 경력)으로 바꾸세요.',
  },
  {
    category: 'age',
    severity: 'high',
    pattern: /청년(?:\s*(?:채용|선호|우대|환영))?|젊은(?:\s*(?:인재|분|사원))?/g,
    detail: '"청년·젊은"은 특정 연령대를 암시해 연령 차별 신호로 해석될 수 있습니다.',
    suggestion:
      '"성장 가능성이 높은 분", "변화에 빠르게 적응하는 분" 등 행동/태도 기반으로 표현하세요.',
  },
  {
    category: 'age',
    severity: 'medium',
    pattern: /나이\s*(?:불문|무관)|연령\s*(?:불문|제한\s*없음)/g,
    detail: '"나이 무관"은 긍정 의도지만 여전히 연령을 명시적으로 거론합니다.',
    suggestion: '"누구나 지원 가능"으로 다시 쓰거나, 아예 연령 언급을 생략하세요.',
  },

  // Gender — '남직원', '여비서', '여직원만' 같은 표현은 「남녀고용평등법」 위반 소지.
  {
    category: 'gender',
    severity: 'high',
    pattern: /(?<![가-힣])(?:남|여)(?:직원|사원|비서|간호사|승무원|운전기사|기사|선생님)/g,
    detail: '특정 성별을 직무에 결합하는 표현은 남녀고용평등법 위반 소지가 있습니다.',
    suggestion: '성별 단어를 제거하고 직무명만 사용하세요(예: "직원", "사원").',
  },
  {
    category: 'gender',
    severity: 'high',
    pattern: /(?:남자|여자|남성|여성)(?:\s*(?:만|우대|환영|선호|지원\s*가능))/g,
    detail: '성별을 자격요건으로 명시하면 차별로 간주됩니다.',
    suggestion: '성별 요건을 삭제하세요. 직무 수행에 필요한 역량 중심으로 다시 쓰세요.',
  },
  {
    category: 'gender',
    severity: 'medium',
    pattern: /(?:참하|얌전|여성스러운|남자다운|여자다운|이쁘|예쁘)(?:신|은)?\s*(?:분|사원|직원)/g,
    detail: '성별 고정관념을 강화하는 외모/성격 묘사는 차별 신호입니다.',
    suggestion: '직무 관련 역량(예: "꼼꼼한", "분석적인")으로 대체하세요.',
  },

  // Region — '서울 거주자만', '수도권 출신' 등도 차별 소지.
  {
    category: 'region',
    severity: 'medium',
    pattern: /(?:서울|수도권|경기|인천)\s*(?:거주(?:자)?|출신)\s*(?:만|우대|환영|선호)/g,
    detail: '거주지·출신 지역으로 제한하면 지역 차별로 해석될 수 있습니다.',
    suggestion: '실제로 출근이 필요하다면 "근무지: 서울"로 표기하고 거주지 요건은 제거하세요.',
  },
  {
    category: 'region',
    severity: 'low',
    pattern: /지방\s*(?:출신|거주(?:자)?)\s*(?:불가|제외)/g,
    detail: '특정 지역을 명시적으로 배제하는 표현은 강한 차별 신호입니다.',
    suggestion: '근무지/출근 가능 요건만 명시하세요.',
  },

  // Education — 학벌 차별. SKY, 인서울 등도 차별 소지.
  {
    category: 'education',
    severity: 'high',
    pattern: /(?:SKY|sky|서울대|연세대|고려대)(?:\s*(?:출신|졸업)?\s*(?:만|우대|환영|선호))/g,
    detail: '특정 대학·학벌 기반 우대는 학력 차별 신호입니다.',
    suggestion: '학교 대신 직무 역량·프로젝트 경험·결과로 평가 기준을 바꾸세요.',
  },
  {
    category: 'education',
    severity: 'medium',
    pattern: /인서울(?:\s*(?:출신|졸업)?\s*(?:만|우대|환영|선호))/g,
    detail: '"인서울" 우대는 지역+학벌 복합 편향 신호입니다.',
    suggestion: '학력 요건 대신 입증 가능한 직무 능력을 요구하세요.',
  },
  {
    category: 'education',
    severity: 'low',
    pattern: /4년제\s*(?:대학|학사)?\s*(?:이상|졸업\s*(?:자)?|필수)/g,
    detail: '"4년제 이상" 명시 학력 컷오프는 학력 기반 배제로 해석됩니다.',
    suggestion: '학위 대신 "직무 관련 실무 경험 3년 이상"처럼 능력 기반으로 다시 쓰세요.',
  },

  // Physical — 키·외모·체력 등.
  {
    category: 'physical',
    severity: 'high',
    pattern: /키\s*\d{2,3}\s*(?:cm|센티|이상|이하)/g,
    detail: '신체 사이즈는 명백한 외모 차별로 「채용절차의 공정화에 관한 법률」 위반입니다.',
    suggestion:
      '신체 조건 요건을 즉시 삭제하세요. 직무가 실제로 신체 능력을 요구한다면 "X kg 들기 가능" 등 직무 능력으로 표현하세요.',
  },
  {
    category: 'physical',
    severity: 'medium',
    pattern: /(?:용모|외모|인상|이미지|체형)\s*(?:단정|준수|좋은|훌륭한|뛰어난)/g,
    detail: '외모·이미지 평가는 채용에서 제외되어야 합니다.',
    suggestion: '서비스직이라면 "고객 응대 역량"으로, 영업이라면 "관계 형성 역량"으로 다시 쓰세요.',
  },
  {
    category: 'physical',
    severity: 'medium',
    pattern: /체력\s*(?:좋은|튼튼한|뛰어난)|건강한\s*(?:분|사원|직원)/g,
    detail: '"체력 좋은"은 장애인·연령 차별로 해석될 수 있습니다.',
    suggestion:
      '직무에 실제 신체 작업이 있다면 "X kg 인양", "야간 근무 가능" 등 구체 요건을 쓰세요.',
  },

  // Family — 기혼 여부, 자녀 유무 등.
  {
    category: 'family',
    severity: 'high',
    pattern: /(?:기혼|미혼|결혼)\s*(?:자\s*|여성|남성|불가|제외|우대|선호)/g,
    detail: '결혼·가족 상태는 「남녀고용평등법」상 자격요건이 될 수 없습니다.',
    suggestion: '결혼 상태 요건을 삭제하세요.',
  },
  {
    category: 'family',
    severity: 'medium',
    pattern: /자녀\s*(?:없는|있는)\s*(?:분|여성|남성|직원|사원)/g,
    detail: '자녀 유무를 채용 요건으로 다는 것은 차별입니다.',
    suggestion: '자녀 관련 요건을 삭제하세요.',
  },
];

const CATEGORY_LABELS: Record<JdBiasCategory, string> = {
  age: '연령',
  gender: '성별',
  region: '지역',
  education: '학력·학벌',
  physical: '외모·신체',
  family: '가족·결혼',
};

const CONTEXT_RADIUS = 18;

function makeExcerpt(text: string, match: RegExpExecArray): string {
  const start = Math.max(0, match.index - CONTEXT_RADIUS);
  const end = Math.min(text.length, match.index + match[0].length + CONTEXT_RADIUS);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

export function detectJdBias(text: string): JdBiasFinding[] {
  const findings: JdBiasFinding[] = [];
  const safe = (text ?? '').trim();
  if (!safe) return findings;

  const seen = new Set<string>();
  for (const rule of RULES) {
    const re = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(safe)) !== null) {
      if (match[0].length === 0) {
        re.lastIndex += 1;
        continue;
      }
      const key = `${rule.category}:${rule.severity}:${match.index}:${match[0]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({
        category: rule.category,
        severity: rule.severity,
        excerpt: makeExcerpt(safe, match),
        detail: rule.detail,
        suggestion: rule.suggestion,
      });
    }
  }

  const severityRank: Record<JdBiasSeverity, number> = { high: 0, medium: 1, low: 2 };
  findings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  return findings;
}

function categoryLabelList(findings: JdBiasFinding[]): string {
  const set = new Set<string>();
  for (const f of findings) set.add(CATEGORY_LABELS[f.category]);
  return Array.from(set).join('·');
}

export function buildJdBiasReport(text: string): JdBiasReport {
  const findings = detectJdBias(text);
  const total = findings.length;
  const high = findings.filter((f) => f.severity === 'high').length;
  const mid = findings.filter((f) => f.severity === 'medium').length;

  if (total === 0) {
    return {
      findings: [],
      totalCount: 0,
      highCount: 0,
      tone: 'good',
      label: '편향 신호 없음',
      summary: '연령·성별·지역·학력·외모·가족 관련 차별 신호를 찾지 못했습니다.',
    };
  }

  const tone: JdBiasTone = high > 0 ? 'danger' : mid > 0 ? 'warning' : 'neutral';
  const label =
    tone === 'danger'
      ? `심각 ${high}건 · 총 ${total}건`
      : tone === 'warning'
        ? `주의 ${mid}건 · 총 ${total}건`
        : `참고 ${total}건`;
  const summary =
    tone === 'danger'
      ? `법적 위반 소지가 있는 표현 ${high}건이 발견되었습니다 (${categoryLabelList(findings)}). 지원 전에 채용 담당자와 확인하거나, 회사의 다른 공고도 점검해보세요.`
      : tone === 'warning'
        ? `차별 신호로 해석될 수 있는 표현 ${mid}건이 보입니다 (${categoryLabelList(findings)}). 회사의 채용 문화를 함께 살펴볼 가치가 있습니다.`
        : `참고할 만한 표현 ${total}건 (${categoryLabelList(findings)}).`;

  return { findings, totalCount: total, highCount: high, tone, label, summary };
}

export const __JD_BIAS_CATEGORIES__ = CATEGORY_LABELS;
