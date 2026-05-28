/**
 * 채용 방식 감지 모듈 — 공채(공개채용) vs 수시채용 신호 분석.
 *
 * 제공:
 * - detectHiringMode: JD 텍스트에서 채용 방식(공채/수시/혼합/불명확) 감지
 *
 * 관련 타입: HiringModeReport.
 */

export type HiringMode = 'batch' | 'rolling' | 'mixed' | 'unclear';

const HIRING_MODE_LABEL_KO: Record<HiringMode, string> = {
  batch: '공개채용 (공채)',
  rolling: '수시채용',
  mixed: '혼합',
  unclear: '불명확',
};

// ---------------------------------------------------------------------------
// Batch hiring (공채) signals
// ---------------------------------------------------------------------------

const BATCH_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /공개\s*채용|공채/, label: '공채' },
  { re: /상반기\s*(?:채용|공채)|하반기\s*(?:채용|공채)/, label: '상/하반기 공채' },
  { re: /인적성\s*(?:검사|시험|평가)|적성\s*검사/, label: '인적성 검사' },
  { re: /GSAT|HMAT|LSAT|LG\s*WAY/, label: '필기시험' },
  { re: /서류\s*전형.*필기.*면접|전형\s*절차/, label: '전형 절차' },
  { re: /일괄\s*채용|통합\s*채용/, label: '일괄 채용' },
  { re: /어학\s*성적|토익|TOEIC|OPIc/, label: '어학 성적' },
  { re: /자기\s*소개서\s*문항|자소서\s*(?:문항|항목)/, label: '자소서 문항' },
];

// ---------------------------------------------------------------------------
// Rolling hiring (수시채용) signals
// ---------------------------------------------------------------------------

const ROLLING_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /수시\s*채용|상시\s*채용/, label: '수시/상시 채용' },
  { re: /즉시\s*출근|즉시\s*입사/, label: '즉시 출근' },
  { re: /빠른\s*(?:채용|합류|입사)|빠른\s*분|긴급\s*채용/, label: '빠른 채용' },
  { re: /경력\s*(?:직접|중심)\s*채용|경력\s*무관/, label: '경력 채용' },
  { re: /포트폴리오\s*(?:제출|첨부|URL)/, label: '포트폴리오 제출' },
  { re: /채용\s*시\s*마감|수시\s*마감|Rolling\s*basis/, label: '채용 시 마감' },
  { re: /GitHub|깃허브|링크드인|LinkedIn\s*(?:URL|프로필)/, label: '포트폴리오 링크' },
  { re: /[Pp]робник시험|코딩\s*테스트|과제\s*전형|Take.home/, label: '코딩 테스트' },
];

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export interface HiringSignal {
  label: string;
  mode: 'batch' | 'rolling';
}

export interface HiringModeReport {
  mode: HiringMode;
  modeLabel: string;
  batchSignals: HiringSignal[];
  rollingSignals: HiringSignal[];
  batchScore: number;
  rollingScore: number;
  tips: string[];
}

const BATCH_TIPS = [
  '공채는 서류·인적성·면접 단계별 준비가 필요합니다.',
  '어학 성적(TOEIC 등) 마감일을 미리 확인하세요.',
  '자기소개서 문항을 미리 파악해 스토리를 준비하세요.',
  '공채 일정은 보통 상반기(3-5월)·하반기(8-10월)에 집중됩니다.',
];

const ROLLING_TIPS = [
  '수시채용은 공고 후 수주 이내 마감되는 경우가 많습니다.',
  '포트폴리오·GitHub를 최신 상태로 유지하세요.',
  '코딩 테스트 플랫폼(프로그래머스·LeetCode)을 미리 연습하세요.',
  '현업 경력자를 대상으로 하는 경우 경력 기술서가 중요합니다.',
];

/**
 * JD 텍스트에서 공채/수시 채용 방식을 감지하고 맞춤 조언을 제공.
 */
export function detectHiringMode(text: string): HiringModeReport {
  const t = text ?? '';

  if (!t.trim()) {
    return {
      mode: 'unclear',
      modeLabel: HIRING_MODE_LABEL_KO['unclear'],
      batchSignals: [],
      rollingSignals: [],
      batchScore: 0,
      rollingScore: 0,
      tips: ['채용공고 내용을 입력하면 채용 방식을 분석합니다.'],
    };
  }

  const batchSignals: HiringSignal[] = BATCH_PATTERNS.filter(({ re }) => re.test(t)).map(
    ({ label }) => ({ label, mode: 'batch' as const }),
  );

  const rollingSignals: HiringSignal[] = ROLLING_PATTERNS.filter(({ re }) => re.test(t)).map(
    ({ label }) => ({ label, mode: 'rolling' as const }),
  );

  const batchScore = batchSignals.length;
  const rollingScore = rollingSignals.length;

  let mode: HiringMode;
  if (batchScore === 0 && rollingScore === 0) {
    mode = 'unclear';
  } else if (batchScore >= 2 && rollingScore === 0) {
    mode = 'batch';
  } else if (rollingScore >= 2 && batchScore === 0) {
    mode = 'rolling';
  } else if (batchScore > rollingScore) {
    mode = 'batch';
  } else if (rollingScore > batchScore) {
    mode = 'rolling';
  } else {
    mode = 'mixed';
  }

  const tips =
    mode === 'batch'
      ? BATCH_TIPS.slice(0, 3)
      : mode === 'rolling'
        ? ROLLING_TIPS.slice(0, 3)
        : mode === 'mixed'
          ? [...BATCH_TIPS.slice(0, 1), ...ROLLING_TIPS.slice(0, 1)]
          : ['채용 방식을 명확히 파악하기 위해 지원 채널과 전형 절차를 확인하세요.'];

  return {
    mode,
    modeLabel: HIRING_MODE_LABEL_KO[mode],
    batchSignals,
    rollingSignals,
    batchScore,
    rollingScore,
    tips,
  };
}
