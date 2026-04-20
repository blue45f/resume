/**
 * 언어 위험 분석 모듈 — 상투구 · 자곤 · 과장. koreanChecker.ts 에서 분리.
 *
 * 공통 주제: "내용 없이 수 있는" 언어. 심사자의 신뢰도·차별성을 떨어뜨리는
 * 3가지 결함 패턴을 한 모듈에 응집.
 *
 * - detectCliches: "노력하는 자세·성실한·열정" 등 누구나 쓰는 상투구
 * - detectJargon: "인사이트·시너지·이니셔티브" 등 공허한 비즈니스 자곤
 * - detectExaggeration: "세계 최초·완벽·100% 달성" 등 검증 불가 과장
 */

export interface ClicheHit {
  phrase: string;
  index: number;
  reason: string;
}

export interface ClicheAnalysis {
  hits: ClicheHit[];
  count: number;
  level: 'none' | 'few' | 'many';
  suggestion: string;
}

const CLICHES: Array<{ re: RegExp; phrase: string; reason: string }> = [
  {
    re: /노력하는 자세/g,
    phrase: '노력하는 자세',
    reason: '누구나 쓰는 상투구. 구체 행동으로 증명.',
  },
  {
    re: /성실하[게나다]/g,
    phrase: '성실하게/성실하다',
    reason: '추상 표현. 근거 사례로 보여주세요.',
  },
  { re: /최선을 다[해하]/g, phrase: '최선을 다해/다하', reason: '검증 불가. 수치·결과로 증명.' },
  { re: /열정[을이 ]/g, phrase: '열정', reason: '평가자가 지겹게 보는 단어. 구체 에피소드로.' },
  { re: /꿈꿔[왔오]/g, phrase: '꿈꿔왔', reason: '감성 어조. 비즈니스 문서엔 구체 계획을.' },
  {
    re: /귀사에 [지적]원/g,
    phrase: '귀사에 지원/적원',
    reason: '격식 과잉. "OO에 지원합니다" 간결히.',
  },
  {
    re: /입니[다.][^"]*저는/g,
    phrase: '…입니다 저는',
    reason: '"저는"으로 문장을 반복 시작하는 습관.',
  },
  { re: /있어서는 안 될/g, phrase: '있어서는 안 될', reason: '과장 표현. 더 구체적으로.' },
  { re: /남다른 [열정각오]/g, phrase: '남다른 열정/각오', reason: '누구나 "남다른". 사실로 증명.' },
  { re: /(?:커다란|큰) 보람/g, phrase: '커다란 보람', reason: '상투적 감정 표현. 실제 결과로.' },
  { re: /시너지 [효창]/g, phrase: '시너지 효과/창출', reason: '버즈워드. 구체 프로세스로.' },
  { re: /(?<![가-힣])창의적[인이다]/g, phrase: '창의적인', reason: '자기평가 단어. 예시 제공.' },
  { re: /체계적으로/g, phrase: '체계적으로', reason: '자기평가. 프로세스·도구 명시.' },
  { re: /적극적[인이으]/g, phrase: '적극적인', reason: '자기평가. 행동 사례로.' },
  { re: /열심히 [노공]/g, phrase: '열심히 노력/공부', reason: '검증 불가. 구체 활동으로.' },
  { re: /[다되]는 데 있어/g, phrase: '~함에 있어', reason: '번역체. 불필요한 격식.' },
  { re: /함에 있어/g, phrase: '함에 있어', reason: '일본어 번역투. "~할 때" 로.' },
  { re: /~에 대한 책임감/g, phrase: '~에 대한 책임감', reason: '추상 표현. 책임진 구체 업무로.' },
  {
    re: /서로 도와[가주]/g,
    phrase: '서로 도와가며/주며',
    reason: '협업 상투구. 역할 분담 구체화.',
  },
  {
    re: /(?<![가-힣])성과를 [창내]/g,
    phrase: '성과를 창출/냈',
    reason: '추상 동사. 수치 포함한 성과.',
  },
];

/**
 * 자소서·이력서에서 자주 쓰이는 진부한 표현 검출.
 * 남들과 구별되지 않는 상투구는 차별성을 떨어뜨림. 심사자가 지겹게 본 표현 모음.
 */
export function detectCliches(text: string): ClicheAnalysis {
  const t = text ?? '';
  const hits: ClicheHit[] = [];
  for (const c of CLICHES) {
    let m: RegExpExecArray | null;
    const re = new RegExp(c.re.source, 'g');
    while ((m = re.exec(t))) {
      hits.push({ phrase: c.phrase, index: m.index, reason: c.reason });
    }
  }
  hits.sort((a, b) => a.index - b.index);
  const count = hits.length;
  let level: ClicheAnalysis['level'];
  let suggestion: string;
  if (count === 0) {
    level = 'none';
    suggestion = '상투적 표현이 없습니다.';
  } else if (count <= 2) {
    level = 'few';
    suggestion = `상투적 표현 ${count}건 — 구체 에피소드나 수치로 바꿔 보세요.`;
  } else {
    level = 'many';
    suggestion = `상투적 표현이 ${count}건으로 많습니다. 심사자 눈에 익은 관용구 대신 고유한 경험을 드러내세요.`;
  }
  return { hits: hits.slice(0, 30), count, level, suggestion };
}

const JARGON_WORDS = [
  '인사이트',
  '시너지',
  '커뮤니케이션',
  '이니셔티브',
  '리소스',
  '패러다임',
  '디벨롭',
  '얼라인',
  '온보딩',
  '데브옵스',
  '오너십',
  '임팩트',
  '레버리지',
  '밸류',
  '어젠다',
  '콘텐츠',
  '스케일업',
];

export interface JargonAnalysis {
  hits: Array<{ word: string; count: number }>;
  totalCount: number;
  distinctCount: number;
  level: 'none' | 'few' | 'many';
  suggestion: string;
}

/**
 * 비즈니스 자곤(jargon) 과잉 사용 검출 — "인사이트/시너지/커뮤니케이션/이니셔티브/리소스"
 * 같은 버즈워드는 구체성이 없고 공허한 인상. 3건 이상이면 재작성 권고.
 */
export function detectJargon(text: string): JargonAnalysis {
  const t = text ?? '';
  const counts = new Map<string, number>();
  for (const w of JARGON_WORDS) {
    const re = new RegExp(w, 'g');
    const matches = t.match(re);
    if (matches) counts.set(w, matches.length);
  }
  const hits = [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
  const totalCount = hits.reduce((a, b) => a + b.count, 0);
  const distinctCount = hits.length;
  const level: JargonAnalysis['level'] =
    totalCount === 0 ? 'none' : totalCount < 3 ? 'few' : 'many';
  const suggestion =
    level === 'none'
      ? '자곤 표현이 감지되지 않았습니다.'
      : level === 'few'
        ? `자곤 ${totalCount}건 — "${hits[0].word}" 등을 구체 표현으로 바꾸세요.`
        : `자곤이 ${totalCount}건, ${distinctCount}종 남용됩니다. 구체적 행동·결과로 재작성하세요.`;
  return { hits: hits.slice(0, 10), totalCount, distinctCount, level, suggestion };
}

const EXAGGERATION_PATTERNS: Array<{ re: RegExp; phrase: string; reason: string }> = [
  {
    re: /세계\s*(최초|최고|유일)/g,
    phrase: '세계 최초/최고/유일',
    reason: '증명 어려운 과장. 구체 수치·범위로 한정.',
  },
  {
    re: /국내\s*(최초|최고|유일)/g,
    phrase: '국내 최초/최고/유일',
    reason: '증명 어려운 과장. 범위 한정 권장.',
  },
  {
    re: /완벽(?:한|하게|히)/g,
    phrase: '완벽',
    reason: '"완벽"은 검증 불가. "누락 없이" 등 구체 기준으로.',
  },
  { re: /무한[한히]/g, phrase: '무한한/무한히', reason: '추상 표현. 측정 가능한 값으로.' },
  {
    re: /100%\s*(?:완료|달성|완벽)/g,
    phrase: '100% 완료/달성',
    reason: '정량 지표는 실제 KPI 기준 명시.',
  },
  { re: /유일무이[한하]/g, phrase: '유일무이', reason: '사실 확인 불가 표현.' },
  { re: /타의 추종을 불허/g, phrase: '타의 추종을 불허', reason: '상투적 과장. 구체 수치로 증명.' },
  { re: /절대\s*(?:적|로)/g, phrase: '절대적/절대로', reason: '극단 표현. 조건부로 완화.' },
  { re: /최고\s*수준/g, phrase: '최고 수준', reason: '근거 제시 필요.' },
  {
    re: /타사\s*대비\s*(?:월등|우수)/g,
    phrase: '타사 대비 월등/우수',
    reason: '비교 근거·수치 필요.',
  },
];

export interface ExaggerationHit {
  phrase: string;
  index: number;
  reason: string;
}

export interface ExaggerationAnalysis {
  hits: ExaggerationHit[];
  count: number;
  level: 'none' | 'few' | 'many';
  suggestion: string;
}

/**
 * 과장 표현 검출 — "세계 최초/유일", "100% 완벽", "무한한 가능성" 같은 검증 불가 과장은
 * 공식 문서 신뢰도를 떨어뜨림. 10개 패턴 대응.
 */
export function detectExaggeration(text: string): ExaggerationAnalysis {
  const t = text ?? '';
  const hits: ExaggerationHit[] = [];
  for (const p of EXAGGERATION_PATTERNS) {
    const re = new RegExp(p.re.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      hits.push({ phrase: p.phrase, index: m.index, reason: p.reason });
      if (hits.length > 40) break;
    }
    if (hits.length > 40) break;
  }
  hits.sort((a, b) => a.index - b.index);
  const count = hits.length;
  const level: ExaggerationAnalysis['level'] = count === 0 ? 'none' : count <= 2 ? 'few' : 'many';
  const suggestion =
    level === 'none'
      ? '과장 표현이 없습니다.'
      : level === 'few'
        ? `과장 표현 ${count}건 — "${hits[0].phrase}" 를 증거 있는 표현으로 바꿔보세요.`
        : `과장 표현이 ${count}건으로 많습니다. 신뢰도를 위해 증명 가능한 수치로 대체하세요.`;
  return { hits: hits.slice(0, 20), count, level, suggestion };
}
