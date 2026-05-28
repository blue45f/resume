/**
 * 자기소개서 STAR 구조 분석기 — Situation/Task/Action/Result
 * 각 요소가 얼마나 포함되어 있는지 측정하고 빈 요소를 알린다.
 */

export type StarElement = 'situation' | 'task' | 'action' | 'result';

export interface StarElementSignal {
  element: StarElement;
  excerpt: string;
}

export type StarUsageGrade = 'strong' | 'partial' | 'weak' | 'absent';

export interface CoverLetterStarReport {
  foundElements: StarElement[];
  missingElements: StarElement[];
  signals: StarElementSignal[];
  grade: StarUsageGrade;
  summary: string;
  tips: string[];
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

interface StarPattern {
  element: StarElement;
  re: RegExp;
}

const STAR_PATTERNS: StarPattern[] = [
  // ── Situation ─────────────────────────────────────────────────────────────
  // 배경 설명, 문제 상황 서술
  {
    element: 'situation',
    re: /(?:당시|그\s*때|[0-9]+년\s*[0-9]*월?\s*(?:에|당시)|재직\s*중\s*(?:에|이던))/,
  },
  {
    element: 'situation',
    re: /(?:팀\s*내|조직\s*내|프로젝트\s*초기|입사\s*후|인턴\s*기간)\s*(?:에|에서|당시)/,
  },
  {
    element: 'situation',
    re: /(?:문제|이슈|과제|도전)\s*(?:가|이|에)\s*(?:발생|있었|존재|생겼)/,
  },
  {
    element: 'situation',
    re: /(?:상황|환경|여건)\s*(?:이|에서|속에서|하에서)\s*(?:저는|우리\s*팀|프로젝트)/,
  },

  // ── Task ──────────────────────────────────────────────────────────────────
  // 맡은 역할, 목표 서술
  {
    element: 'task',
    re: /(?:저는|제가|본인).{0,25}(?:담당|맡아|맡게|맡았|책임|주도)/,
  },
  {
    element: 'task',
    re: /(?:목표\s*(?:는|는\s*|가\s*))\s*(?:[^.。]{3,50})\s*(?:이었|였|이었습니다|였습니다)/,
  },
  {
    element: 'task',
    re: /(?:역할|임무|업무)\s*(?:은|는|을|를)\s*(?:맡아|담당|수행|부여)/,
  },
  {
    element: 'task',
    re: /(?:기한|마감|데드라인)\s*(?:내|까지|안에)\s*(?:완료|납기|마무리)/,
  },

  // ── Action ────────────────────────────────────────────────────────────────
  // 구체적 행동 서술
  {
    element: 'action',
    re: /(?:이를\s*위해|해결을\s*위해|개선을\s*위해|이에)\s*(?:저는|저|팀|직접)/,
  },
  {
    element: 'action',
    re: /(?:도입|구현|개발|설계|적용|제안|실행|분석|구축)\s*(?:했습니다|했고|했으며|하였습니다)/,
  },
  {
    element: 'action',
    re: /(?:코드\s*리뷰|리팩토링|자동화|최적화|모니터링)\s*(?:를|을)?\s*(?:도입|진행|시작|수행)/,
  },
  {
    element: 'action',
    re: /(?:직접|주도적으로|능동적으로|스스로)\s*(?:[가-힣a-zA-Z\s]{2,20})\s*(?:했습니다|했고|했으며)/,
  },

  // ── Result ────────────────────────────────────────────────────────────────
  // 수치화된 결과, 정성적 성과
  {
    element: 'result',
    re: /(?:결과\s*(?:적으로|로|,\s*))[^.。]{0,50}(?:[0-9]+%?|[가-힣]{2,10})\s*(?:달성|개선|향상|증가|감소|절감)/,
  },
  {
    element: 'result',
    re: /[0-9]+\s*%\s*(?:향상|개선|증가|감소|단축|절감|상승|증대)/,
  },
  {
    element: 'result',
    re: /[0-9,]+\s*(?:만\s*원|억\s*원|명|건|배|시간|일)\s*(?:절감|단축|증가|달성|확보|처리)/,
  },
  {
    element: 'result',
    re: /(?:사용자|고객|트래픽|매출|비용|시간)\s*(?:[0-9]+%?\s*)?(?:향상|증가|개선|절감|단축|확보)/,
  },
  {
    element: 'result',
    re: /(?:그\s*결과|이를\s*통해|덕분에)\s*(?:[^.。]{5,})\s*(?:수\s*있었|할\s*수\s*있었|었습니다)/,
  },
];

// ---------------------------------------------------------------------------
// Main analysis
// ---------------------------------------------------------------------------

export function checkCoverLetterStarPattern(text: string): CoverLetterStarReport {
  const t = text ?? '';

  const foundSet = new Set<StarElement>();
  const signals: StarElementSignal[] = [];

  for (const { element, re } of STAR_PATTERNS) {
    if (foundSet.has(element)) continue; // one match per element is enough
    const m = t.match(re);
    if (m) {
      foundSet.add(element);
      signals.push({ element, excerpt: m[0].slice(0, 50) });
    }
  }

  const ALL_ELEMENTS: StarElement[] = ['situation', 'task', 'action', 'result'];
  const foundElements = ALL_ELEMENTS.filter((e) => foundSet.has(e));
  const missingElements = ALL_ELEMENTS.filter((e) => !foundSet.has(e));

  let grade: StarUsageGrade;
  if (foundElements.length === 4) grade = 'strong';
  else if (foundElements.length >= 2) grade = 'partial';
  else if (foundElements.length === 1) grade = 'weak';
  else grade = 'absent';

  const ELEM_KO: Record<StarElement, string> = {
    situation: 'Situation(배경)',
    task: 'Task(역할)',
    action: 'Action(행동)',
    result: 'Result(결과)',
  };

  let summary: string;
  if (grade === 'strong') {
    summary = 'STAR 4요소(배경·역할·행동·결과)가 모두 포함되어 있습니다.';
  } else if (grade === 'partial') {
    const missing = missingElements.map((e) => ELEM_KO[e]).join(', ');
    summary = `STAR 구조 중 ${missing} 가 부족합니다. 추가하면 설득력이 높아집니다.`;
  } else if (grade === 'weak') {
    summary = 'STAR 구조가 거의 없습니다. 구체적 배경·행동·결과를 서술해 보세요.';
  } else {
    summary =
      'STAR 구조가 감지되지 않습니다. Situation → Task → Action → Result 흐름으로 재작성하세요.';
  }

  const tips: string[] = [];
  if (missingElements.includes('situation')) {
    tips.push('배경: "당시 팀에서 OO 문제가 있었습니다." 처럼 맥락을 먼저 설명하세요.');
  }
  if (missingElements.includes('task')) {
    tips.push('역할: "저는 OO 기능 개발을 단독으로 담당했습니다." 처럼 본인 책임 범위를 밝히세요.');
  }
  if (missingElements.includes('action')) {
    tips.push(
      '행동: "이를 위해 직접 X를 도입하고 Y를 리팩토링했습니다." 처럼 구체적 행동을 쓰세요.',
    );
  }
  if (missingElements.includes('result')) {
    tips.push('결과: "그 결과 응답 시간 40% 단축" 처럼 수치화된 성과를 반드시 포함하세요.');
  }

  return { foundElements, missingElements, signals, grade, summary, tips };
}
