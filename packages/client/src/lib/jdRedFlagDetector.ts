/**
 * 채용공고 레드플래그 감지 모듈 — 한국 취업 시장의 독성 직장 신호 분석.
 *
 * 제공:
 * - detectJdRedFlags: JD 텍스트에서 주의 표현·과로 신호·불투명 조건 감지
 *
 * 관련 타입: RedFlag, RedFlagReport.
 */

export type RedFlagSeverity = 'high' | 'medium' | 'low';

export interface RedFlag {
  matched: string;
  category: string;
  severity: RedFlagSeverity;
  reason: string;
}

export interface RedFlagReport {
  flags: RedFlag[];
  highCount: number;
  mediumCount: number;
  lowCount: number;
  riskLevel: 'high' | 'moderate' | 'low' | 'clean';
  summary: string;
}

// ---------------------------------------------------------------------------
// Red flag patterns
// ---------------------------------------------------------------------------

interface RedFlagPattern {
  re: RegExp;
  category: string;
  severity: RedFlagSeverity;
  reason: string;
}

const RED_FLAG_PATTERNS: RedFlagPattern[] = [
  // ── Overwork / No work-life balance ──────────────────────────────────────
  {
    re: /야근\s*(?:가능|선호|있음|불가피|필수|이해)/,
    category: '야근',
    severity: 'high',
    reason: '야근이 명시적으로 언급됨 — 상시 초과근무 가능성 확인 필요',
  },
  {
    re: /주말\s*근무|주말\s*출근/,
    category: '주말 근무',
    severity: 'high',
    reason: '주말 근무가 명시됨 — 휴일 보상 여부 확인 필요',
  },
  {
    re: /(?:업무|근무|출근)\s*시간\s*유연.*(?:없음|아님)|고정\s*시간/,
    category: '유연 근무 없음',
    severity: 'medium',
    reason: '유연 근무 제도가 없거나 제한적으로 보임',
  },
  {
    re: /패밀리\s*(?:같은|같음|회사|문화)/,
    category: '패밀리 문화',
    severity: 'high',
    reason: '"패밀리 같은 문화"는 초과근무·경계 없는 업무 요구의 완곡어법일 수 있음',
  },
  {
    re: /열정\s*(?:있는|넘치는|적인)\s*분|열정\s*페이/,
    category: '열정 강조',
    severity: 'medium',
    reason: '"열정"이 핵심 요구사항이면 낮은 보상을 열의로 대체하는 문화일 수 있음',
  },
  {
    re: /끈기\s*(?:있는|있으신)\s*분|포기하지\s*않는/,
    category: '끈기 강조',
    severity: 'low',
    reason: '인내심을 강조하는 경우 높은 업무 강도 환경일 가능성',
  },

  // ── Vague or unfavorable compensation ───────────────────────────────────
  {
    re: /연봉\s*협의|급여\s*협의|보상\s*협의/,
    category: '연봉 비공개',
    severity: 'medium',
    reason: '급여 범위 미공개 — 업계 기준보다 낮게 협의될 수 있음',
  },
  {
    re: /내부\s*규정\s*(?:에\s*따름|따라|준함)|사내\s*규정/,
    category: '불투명 조건',
    severity: 'medium',
    reason: '구체적 조건 없이 내부 규정 적용 — 입사 후 불이익 가능',
  },
  {
    re: /스톡옵션.*(?:협의|추후|예정)|스톡\s*추후/,
    category: '스톡옵션 모호',
    severity: 'low',
    reason: '스톡옵션 조건이 불명확 — 베스팅 일정·수량 사전 확인 필요',
  },

  // ── Toxic culture signals ────────────────────────────────────────────────
  {
    re: /수평적\s*(?:인\s*)?문화|수평\s*조직/,
    category: '수평 문화 주장',
    severity: 'low',
    reason: '"수평적 문화"가 근거 없이 자주 언급되면 실제 위계가 높은 조직일 수 있음',
  },
  {
    re: /자기\s*주도\s*(?:적인?\s*)?(?:분|인재|개발)/,
    category: '자기 주도 강조',
    severity: 'low',
    reason: '"자기 주도" 강조는 온보딩·멘토링 시스템 부재를 의미할 수 있음',
  },
  {
    re: /빠른\s*(?:성장|성과|실행)|애자일.*(?:스타트업|초기)/,
    category: '빠른 성장 압박',
    severity: 'low',
    reason: '"빠른 성장"이 주요 셀링포인트인 경우 높은 업무 강도·번아웃 위험 확인 필요',
  },
  {
    re: /즉시\s*출근|바로\s*합류\s*가능/,
    category: '즉시 출근',
    severity: 'low',
    reason: '즉시 출근 요구는 조직이 인력 부족 상태임을 시사할 수 있음',
  },

  // ── Ambiguous or legally risky conditions ────────────────────────────────
  {
    re: /수습\s*(?:기간|기간\s*중)?\s*(?:3개월|6개월).*(?:이후\s*협의|확정)/,
    category: '수습 후 조건 변경',
    severity: 'medium',
    reason: '수습 기간 후 연봉·직급 조건 변경은 불이익 가능성 — 계약서에 명시 요청 필요',
  },
  {
    re: /포괄\s*임금|포괄\s*임금제/,
    category: '포괄임금제',
    severity: 'high',
    reason: '포괄임금제는 초과근무 수당 미지급의 법적 회색지대 — 실제 적용 방식 반드시 확인',
  },
  {
    re: /근무지\s*변경\s*가능|전국\s*순환\s*근무|지방\s*발령/,
    category: '근무지 변경',
    severity: 'medium',
    reason: '근무지 변경 조건이 포함되어 있음 — 구체적 범위와 사전 통보 기간 확인 필요',
  },
];

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

/**
 * JD 텍스트에서 레드플래그 신호를 감지하고 위험도를 평가.
 */
export function detectJdRedFlags(text: string): RedFlagReport {
  const t = text ?? '';

  if (!t.trim()) {
    return {
      flags: [],
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      riskLevel: 'clean',
      summary: '채용공고 내용을 입력하면 주의 신호를 분석합니다.',
    };
  }

  const flags: RedFlag[] = RED_FLAG_PATTERNS.filter(({ re }) => re.test(t)).map(
    ({ re, category, severity, reason }) => ({
      matched: (t.match(re) ?? [''])[0].trim(),
      category,
      severity,
      reason,
    }),
  );

  const highCount = flags.filter((f) => f.severity === 'high').length;
  const mediumCount = flags.filter((f) => f.severity === 'medium').length;
  const lowCount = flags.filter((f) => f.severity === 'low').length;

  let riskLevel: RedFlagReport['riskLevel'];
  if (highCount >= 2 || (highCount >= 1 && mediumCount >= 2)) {
    riskLevel = 'high';
  } else if (highCount >= 1 || mediumCount >= 2) {
    riskLevel = 'moderate';
  } else if (flags.length > 0) {
    riskLevel = 'low';
  } else {
    riskLevel = 'clean';
  }

  const summary =
    riskLevel === 'high'
      ? `심각한 주의 신호 ${highCount}개 포함 — 지원 전 반드시 조건 확인이 필요합니다.`
      : riskLevel === 'moderate'
        ? `주의할 표현이 발견되었습니다. 면접 시 구체적인 조건을 확인하세요.`
        : riskLevel === 'low'
          ? `경미한 주의 신호가 있습니다. 궁금한 점은 면접 시 질문하세요.`
          : '명시적인 레드플래그 신호가 감지되지 않았습니다.';

  return { flags, highCount, mediumCount, lowCount, riskLevel, summary };
}
