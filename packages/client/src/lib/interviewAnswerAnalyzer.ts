/**
 * 면접 답변 텍스트 분석 — 자동 채점 + 개선 힌트.
 *
 * 사용처: MockInterviewPage 의 사용자 메모(note) 또는 transcript 입력.
 * heuristic 기반 (LLM 호출 없음) — 즉시 응답 + 비용 0.
 *
 * 분석 항목:
 * 1. 길이 적정성: 100~600자 (한국어 면접 기준 1~3분 분량)
 * 2. 필러(채움말) 빈도: '음', '어', '그', '저', '뭐', '근데' 등
 * 3. STAR 구조 신호: 상황/임무/행동/결과 키워드 4종 hit 갯수
 * 4. 정량화 신호: 숫자(%/명/개/년/원) 포함 여부
 * 5. 1인칭 주체성: '저는/제가' 등장 (책임 명확)
 *
 * Score 0-100 (가중 평균):
 * - 길이 30 + STAR 30 + 정량 20 + 필러 회피 15 + 주체성 5
 */

export interface AnswerAnalysis {
  score: number; // 0-100
  wordCount: number;
  charCount: number;
  fillerCount: number;
  fillerRate: number; // 필러/전체단어 비율 (0~1)
  starSignals: { situation: boolean; task: boolean; action: boolean; result: boolean };
  starScore: number; // 0~4
  hasNumbers: boolean;
  hasFirstPerson: boolean;
  tips: string[];
}

const FILLERS = ['음', '어', '그러니까', '그', '저', '뭐', '근데', '아', '이제', '진짜'];

const SITUATION_HINTS = ['당시', '상황', '맡았', '진행 중', '프로젝트', '회사', '팀에서', '근무'];
const TASK_HINTS = ['목표', '해야', '맡았', '담당', '책임', '업무', '과제', '미션', '임무', '필요'];
const ACTION_HINTS = [
  '제안',
  '구현',
  '도입',
  '개선',
  '리팩토링',
  '설계',
  '협업',
  '주도',
  '진행',
  '커뮤니케이션',
  '분석',
  '결정',
  '리드',
];
const RESULT_HINTS = [
  '결과',
  '성과',
  '달성',
  '단축',
  '증가',
  '감소',
  '개선되었',
  '향상',
  '완료',
  '배포',
  '출시',
  '성공',
  '도출',
  '%',
];

const NUMBER_RE = /\d+\s*(%|명|개|년|월|일|시간|회|원|배|위|등|건)/;
const FIRST_PERSON_RE = /(저는|저희|제가|저의)/;

export function analyzeInterviewAnswer(text: string): AnswerAnalysis {
  const clean = (text || '').trim();
  const charCount = clean.length;
  // 빈 입력은 명시적으로 0점 + 안내만
  if (charCount === 0) {
    return {
      score: 0,
      wordCount: 0,
      charCount: 0,
      fillerCount: 0,
      fillerRate: 0,
      starSignals: { situation: false, task: false, action: false, result: false },
      starScore: 0,
      hasNumbers: false,
      hasFirstPerson: false,
      tips: ['답변이 짧아요. 1-2분 분량(150자 이상)으로 보강해보세요.'],
    };
  }
  // 한국어는 띄어쓰기 기준 단어 수 — 비공백 그룹 카운트
  const tokens = clean.split(/\s+/).filter(Boolean);
  const wordCount = tokens.length;

  // 필러: 전체 토큰 중 short filler 가 차지하는 비율 (정확한 계산은 어렵지만 근사)
  let fillerCount = 0;
  for (const tok of tokens) {
    const lower = tok.replace(/[.,!?'"]/g, '');
    if (FILLERS.includes(lower)) fillerCount += 1;
  }
  const fillerRate = wordCount > 0 ? fillerCount / wordCount : 0;

  const lc = clean;
  const star = {
    situation: SITUATION_HINTS.some((h) => lc.includes(h)),
    task: TASK_HINTS.some((h) => lc.includes(h)),
    action: ACTION_HINTS.some((h) => lc.includes(h)),
    result: RESULT_HINTS.some((h) => lc.includes(h)),
  };
  const starScore = Object.values(star).filter(Boolean).length;
  const hasNumbers = NUMBER_RE.test(lc);
  const hasFirstPerson = FIRST_PERSON_RE.test(lc);

  // 점수 계산 (0~100):
  // 1. 길이 (max 30): 100자 미만 0~10, 100~600자 30 만점, 600자 초과 -선형 감점 (장황)
  let lenScore = 0;
  if (charCount < 100) lenScore = Math.round((charCount / 100) * 10);
  else if (charCount <= 600) lenScore = 30;
  else lenScore = Math.max(15, 30 - Math.floor((charCount - 600) / 100) * 3);

  // 2. STAR (max 30): starScore 0~4 → 0,8,15,23,30
  const starPoints = [0, 8, 15, 23, 30][starScore] ?? 30;

  // 3. 정량 (max 20)
  const numPoints = hasNumbers ? 20 : 0;

  // 4. 필러 회피 (max 15): fillerRate 0% → 15, 5% → 8, 10%+ → 0
  const fillerPoints = Math.max(0, Math.round(15 - fillerRate * 300));

  // 5. 1인칭 주체성 (max 5)
  const firstPoints = hasFirstPerson ? 5 : 0;

  const score = Math.min(100, lenScore + starPoints + numPoints + fillerPoints + firstPoints);

  // 개선 힌트 생성
  const tips: string[] = [];
  if (charCount < 100) tips.push('답변이 짧아요. 1-2분 분량(150자 이상)으로 보강해보세요.');
  if (charCount > 800) tips.push('답변이 너무 길어요. 핵심만 간결하게 요약해보세요.');
  if (!star.situation) tips.push('S(상황): 어떤 상황·프로젝트인지 짧게 설명해주세요.');
  if (!star.task) tips.push('T(임무): 본인이 맡은 역할/목표를 명시해주세요.');
  if (!star.action) tips.push('A(행동): 구체적으로 어떤 행동/결정을 했는지 설명해주세요.');
  if (!star.result) tips.push('R(결과): 정량적 성과(%/숫자)로 결과를 보여주세요.');
  if (!hasNumbers) tips.push('정량적 표현(숫자/% 등)을 1개 이상 포함하면 설득력↑');
  if (fillerRate > 0.07)
    tips.push(`필러("음"/"그") 비율 ${Math.round(fillerRate * 100)}% — 의식적으로 줄이면 신뢰감↑`);
  if (!hasFirstPerson && charCount >= 30)
    tips.push('주어("저는/제가")를 명확히 하면 책임감이 더 잘 전달돼요.');
  if (tips.length === 0) tips.push('훌륭한 답변이에요. 톤 + 속도까지 일관되게 유지해보세요.');

  return {
    score,
    wordCount,
    charCount,
    fillerCount,
    fillerRate,
    starSignals: star,
    starScore,
    hasNumbers,
    hasFirstPerson,
    tips,
  };
}
