/**
 * JD 전형 절차 추출기 — 채용공고에 명시된 채용 단계(서류→코테→면접→처우협의)를
 * 파싱하여 지원자가 실제 파이프라인을 파악하고 준비하도록 돕는다.
 *
 * jdInterviewStrategy(신호 기반 예측)와 달리, JD에 "적힌" 절차를 그대로 읽어낸다.
 */

export type HiringStage =
  | 'document' // 서류 전형
  | 'coding_test' // 코딩 테스트
  | 'assignment' // 과제 전형
  | 'phone' // 전화/사전 인터뷰
  | 'first' // 1차 면접
  | 'second' // 2차 면접
  | 'third' // 3차 면접
  | 'culture' // 컬처핏 면접
  | 'personality' // 인적성 검사
  | 'reference' // 평판 조회
  | 'final' // 최종 면접
  | 'offer'; // 처우 협의/최종 합격

export type HiringProcessClarity = 'detailed' | 'partial' | 'none';

export interface JdHiringProcessReport {
  clarity: HiringProcessClarity;
  stages: HiringStage[]; // 정규 순서로 정렬된 감지 단계
  pipeline: string; // "서류 전형 → 코딩 테스트 → ..."
  roundCount: number; // 면접 라운드 수
  hasCodingTest: boolean;
  hasAssignment: boolean;
  hasReferenceCheck: boolean;
  summary: string;
  tips: string[];
}

// ---------------------------------------------------------------------------
// Stage definitions in canonical order
// ---------------------------------------------------------------------------

const STAGE_DEFS: Array<{ stage: HiringStage; label: string; re: RegExp }> = [
  {
    stage: 'document',
    label: '서류 전형',
    re: /서류\s*(?:전형|심사|접수|검토)|지원서\s*검토|이력서\s*심사/,
  },
  {
    stage: 'coding_test',
    label: '코딩 테스트',
    re: /코딩\s*테스트|코테|온라인\s*코딩|알고리즘\s*테스트|프로그래밍\s*테스트|coding\s*test/i,
  },
  {
    stage: 'assignment',
    label: '과제 전형',
    re: /과제\s*전형|사전\s*과제|과제\s*제출|기술\s*과제|포트폴리오\s*심사|take[\s-]?home/i,
  },
  {
    stage: 'phone',
    label: '전화/사전 인터뷰',
    re: /전화\s*(?:인터뷰|면접)|폰\s*스크리닝|사전\s*인터뷰|phone\s*screen/i,
  },
  {
    stage: 'first',
    label: '1차 면접',
    re: /1\s*차\s*(?:면접|인터뷰)|실무\s*면접|기술\s*면접|일차\s*면접/,
  },
  { stage: 'second', label: '2차 면접', re: /2\s*차\s*(?:면접|인터뷰)|임원\s*면접|이차\s*면접/ },
  { stage: 'third', label: '3차 면접', re: /3\s*차\s*(?:면접|인터뷰)|삼차\s*면접/ },
  {
    stage: 'culture',
    label: '컬처핏 면접',
    re: /컬처\s*핏|컬쳐\s*핏|culture\s*fit|문화\s*적합성|컬처\s*인터뷰/i,
  },
  { stage: 'personality', label: '인적성 검사', re: /인적성|인성\s*검사|적성\s*검사|성격\s*검사/ },
  {
    stage: 'reference',
    label: '평판 조회',
    re: /평판\s*조회|레퍼런스\s*체크|평판\s*체크|reference\s*check/i,
  },
  { stage: 'final', label: '최종 면접', re: /최종\s*(?:면접|인터뷰)/ },
  {
    stage: 'offer',
    label: '처우 협의',
    re: /처우\s*협의|연봉\s*협상|입사\s*제안|최종\s*합격|오퍼\s*레터|offer\s*letter/i,
  },
];

const INTERVIEW_ROUND_STAGES: HiringStage[] = [
  'phone',
  'first',
  'second',
  'third',
  'culture',
  'final',
];

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function extractJdHiringProcess(text: string): JdHiringProcessReport {
  const t = (text ?? '').trim();

  const detected: HiringStage[] = [];
  const labelByStage = new Map<HiringStage, string>();

  for (const { stage, label, re } of STAGE_DEFS) {
    if (re.test(t)) {
      detected.push(stage);
      labelByStage.set(stage, label);
    }
  }

  const roundCount = detected.filter((s) => INTERVIEW_ROUND_STAGES.includes(s)).length;
  const hasCodingTest = detected.includes('coding_test');
  const hasAssignment = detected.includes('assignment');
  const hasReferenceCheck = detected.includes('reference');

  const pipeline = detected.map((s) => labelByStage.get(s)).join(' → ');

  let clarity: HiringProcessClarity;
  if (detected.length >= 3) {
    clarity = 'detailed';
  } else if (detected.length >= 1) {
    clarity = 'partial';
  } else {
    clarity = 'none';
  }

  // Summary
  let summary: string;
  if (clarity === 'none') {
    summary = '전형 절차가 공고에 명시되지 않았습니다.';
  } else {
    summary = `${pipeline} (${detected.length}단계)`;
  }

  // Tips
  const tips: string[] = [];
  if (hasCodingTest) {
    tips.push('코딩 테스트가 포함됩니다. 알고리즘·자료구조를 미리 연습하세요.');
  }
  if (hasAssignment) {
    tips.push('과제 전형이 있습니다. 마감까지 충분한 작업 시간을 확보하세요.');
  }
  if (hasReferenceCheck) {
    tips.push('평판 조회가 있습니다. 전 직장 레퍼런스를 사전에 정리해 두세요.');
  }
  if (roundCount >= 3) {
    tips.push(`면접이 ${roundCount}회 진행되어 전체 일정이 길 수 있으니 여유를 두고 준비하세요.`);
  }
  if (clarity === 'none') {
    tips.push('전형 단계·소요 기간을 채용 담당자에게 문의해 준비 범위를 파악하세요.');
  } else if (clarity === 'partial') {
    tips.push('명시되지 않은 후속 전형이 있을 수 있으니 전체 절차를 확인하세요.');
  }

  return {
    clarity,
    stages: detected,
    pipeline,
    roundCount,
    hasCodingTest,
    hasAssignment,
    hasReferenceCheck,
    summary,
    tips,
  };
}
