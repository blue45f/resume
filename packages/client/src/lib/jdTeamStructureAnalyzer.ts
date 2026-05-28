/**
 * JD 팀·조직 구조 명확성 분석기 — 채용공고가 팀 규모·보고 체계·팀 구성·협업 관계를
 * 얼마나 구체적으로 밝히는지 평가하여 입사 전 조직 파악을 돕는다.
 */

export type TeamSignalType =
  | 'team_size' // 팀 규모(인원)
  | 'reporting_line' // 보고 체계/직속
  | 'team_composition' // 팀 구성/멤버 소개
  | 'collaboration'; // 협업 부서/유관 조직

export interface TeamSignalMatch {
  type: TeamSignalType;
  excerpt: string;
}

export type TeamClarity = 'detailed' | 'partial' | 'opaque';

export interface JdTeamStructureReport {
  clarity: TeamClarity;
  signals: TeamSignalMatch[];
  presentTypes: TeamSignalType[];
  summary: string;
  questions: string[]; // 면접에서 물어볼 질문 제안
}

// ---------------------------------------------------------------------------
// Pattern sets
// ---------------------------------------------------------------------------

const PATTERNS: Array<{ type: TeamSignalType; re: RegExp }> = [
  {
    type: 'team_size',
    re: /(?:\d+\s*명\s*(?:규모|내외|으로\s*구성|의\s*팀)|팀\s*규모|구성원\s*\d+\s*명|총\s*\d+\s*명)/,
  },
  {
    type: 'reporting_line',
    re: /(?:보고\s*(?:라인|체계)|직속\s*(?:상사|상관|보고)|에게\s*보고|CTO\s*직속|대표\s*직속|리포팅\s*라인|report\s*to)/i,
  },
  {
    type: 'team_composition',
    re: /(?:팀\s*구성|조직\s*구성|함께\s*일할\s*(?:동료|팀)|팀\s*소개|팀\s*멤버|구성\s*[:：]|이런\s*분들과)/,
  },
  {
    type: 'collaboration',
    re: /(?:협업\s*(?:부서|팀|조직)|유관\s*부서|타\s*팀과|cross[\s-]?functional|부서\s*간\s*협업|함께\s*협업)/i,
  },
];

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function analyzeJdTeamStructure(text: string): JdTeamStructureReport {
  const t = (text ?? '').trim();
  const lines = t.split('\n').map((l) => l.trim());

  const signals: TeamSignalMatch[] = [];
  const seen = new Set<TeamSignalType>();

  for (const line of lines) {
    if (!line) continue;
    for (const { type, re } of PATTERNS) {
      if (!seen.has(type) && re.test(line)) {
        signals.push({ type, excerpt: line.slice(0, 55) });
        seen.add(type);
      }
    }
  }

  const presentTypes = Array.from(seen);
  const count = presentTypes.length;

  let clarity: TeamClarity;
  if (count >= 3) {
    clarity = 'detailed';
  } else if (count >= 1) {
    clarity = 'partial';
  } else {
    clarity = 'opaque';
  }

  // Summary
  const CLARITY_LABEL: Record<TeamClarity, string> = {
    detailed: `팀 구조가 비교적 명확합니다 (${count}개 항목 명시).`,
    partial: `팀 구조 정보가 일부만 제공됩니다 (${count}개 항목).`,
    opaque: '팀 규모·보고 체계 등 조직 정보가 거의 없습니다.',
  };
  const summary = CLARITY_LABEL[clarity];

  // Interview questions for missing pieces
  const ALL_TYPES: TeamSignalType[] = [
    'team_size',
    'reporting_line',
    'team_composition',
    'collaboration',
  ];
  const QUESTION: Record<TeamSignalType, string> = {
    team_size: '합류할 팀의 규모와 구성(직군별 인원)은 어떻게 되나요?',
    reporting_line: '이 포지션은 누구에게 보고하며 평가는 어떻게 이루어지나요?',
    team_composition: '함께 일하게 될 팀원들의 경력/역할 구성이 궁금합니다.',
    collaboration: '주로 협업하는 부서나 직군은 어디인가요?',
  };
  const questions: string[] = [];
  for (const type of ALL_TYPES) {
    if (!seen.has(type)) {
      questions.push(QUESTION[type]);
    }
  }

  return {
    clarity,
    signals: signals.slice(0, 6),
    presentTypes,
    summary,
    questions: questions.slice(0, 4),
  };
}
