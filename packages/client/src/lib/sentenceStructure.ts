/**
 * 문장 구조 분석 모듈 — koreanChecker.ts 에서 분리.
 *
 * 공통 주제: 문장 단위의 리듬·변주·능동성.
 *
 * - analyzeSentenceEndings: 종결 어미 분포(HHI)로 단조로움 측정
 * - analyzeSentenceStarts: 같은 단어로 시작하는 문장 비율
 * - analyzePassiveVoice: 수동태/능동태 비율 및 예시 추출
 */

export interface SentenceEndingAnalysis {
  total: number;
  dominantEndings: Array<{ ending: string; count: number; percent: number }>;
  monotonyScore: number;
  suggestion: string;
}

const ENDING_PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: '했습니다', regex: /(했|됐|받았|만들었|썼|봤|갔|왔|냈)습니다(?=[.!?。\s]|$)/ },
  { label: '합니다', regex: /(합|됩|드립|봅|갑|옵)니다(?=[.!?。\s]|$)/ },
  { label: '입니다', regex: /입니다(?=[.!?。\s]|$)/ },
  { label: '있습니다', regex: /있습니다(?=[.!?。\s]|$)/ },
  { label: '없습니다', regex: /없습니다(?=[.!?。\s]|$)/ },
  { label: '됩니다', regex: /됩니다(?=[.!?。\s]|$)/ },
  { label: '~다.', regex: /[가-힣]다(?=[.!?。\s]|$)/ },
  { label: '했다', regex: /(했|됐|갔|왔|봤|받았)다(?=[.!?。\s]|$)/ },
  { label: '해요', regex: /해요(?=[.!?。\s]|$)/ },
  { label: '~요.', regex: /[가-힣]요(?=[.!?。\s]|$)/ },
];

/**
 * 종결어미 분포 분석 — Herfindahl-Hirschman 지표(HHI) 기반 단조로움 계산.
 * monotonyScore: 0~100. 100 에 가까울수록 한두 어미에 집중되어 단조로움.
 * dominantEndings: 빈도 상위 어미 최대 5개.
 */
export function analyzeSentenceEndings(text: string): SentenceEndingAnalysis {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) {
    return { total: 0, dominantEndings: [], monotonyScore: 0, suggestion: '' };
  }
  const sentences = clean.split(/[.!?。]+/).filter((s) => s.trim().length > 0);
  const counts = new Map<string, number>();
  let matched = 0;
  for (const s of sentences) {
    const trimmed = s.trim();
    for (const { label, regex } of ENDING_PATTERNS) {
      if (regex.test(trimmed + '.')) {
        counts.set(label, (counts.get(label) ?? 0) + 1);
        matched++;
        break;
      }
    }
  }
  const total = matched;
  const entries = [...counts.entries()]
    .map(([ending, count]) => ({ ending, count, percent: total ? (count * 100) / total : 0 }))
    .sort((a, b) => b.count - a.count);
  const top5 = entries.slice(0, 5);

  // Herfindahl-Hirschman index — 0~10000 기준, %² 합계. 단일 어미면 10000.
  let hhi = 0;
  for (const e of entries) hhi += e.percent * e.percent;
  const monotonyScore = Math.min(100, Math.round(hhi / 100));

  let suggestion = '';
  if (total < 5) {
    suggestion = '분석을 위한 문장이 부족합니다 (5 문장 이상 권장).';
  } else if (monotonyScore >= 60) {
    const dom = top5[0];
    suggestion = `"${dom.ending}" 어미에 ${dom.percent.toFixed(0)}% 집중되어 단조롭습니다. 종결어미를 2~3 종류로 변주해 보세요.`;
  } else if (monotonyScore >= 40) {
    suggestion = '종결어미 분포가 약간 편중되어 있습니다. 상위 어미 비중을 낮춰 보세요.';
  } else {
    suggestion = '종결어미 분포가 자연스럽습니다.';
  }

  return { total, dominantEndings: top5, monotonyScore, suggestion };
}

export interface SentenceStartAnalysis {
  totalSentences: number;
  topStarts: Array<{ word: string; count: number; percent: number }>;
  repeatedStartRatio: number; // 0~1, 1 이면 모두 같은 단어로 시작
  suggestion: string;
}

/**
 * 문장 시작 반복 — "저는/제가" 등 같은 단어로 시작하는 문장이 연속되면 단조로움.
 * 이력서·자소서에서 특히 자주 발생. 상위 3개 시작 단어 빈도 반환.
 */
export function analyzeSentenceStarts(text: string): SentenceStartAnalysis {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return { totalSentences: 0, topStarts: [], repeatedStartRatio: 0, suggestion: '' };
  const sentences = clean.split(/[.!?。]+/).filter((s) => s.trim().length > 0);
  const counts = new Map<string, number>();
  for (const s of sentences) {
    const trimmed = s.trim();
    const firstWord = trimmed.match(/^[가-힣A-Za-z]+/)?.[0];
    if (!firstWord) continue;
    counts.set(firstWord, (counts.get(firstWord) ?? 0) + 1);
  }
  const total = sentences.length;
  const entries = [...counts.entries()]
    .map(([word, count]) => ({ word, count, percent: total ? (count * 100) / total : 0 }))
    .sort((a, b) => b.count - a.count);
  const topStarts = entries.slice(0, 3);
  const repeatedStartRatio = topStarts[0] ? topStarts[0].count / total : 0;
  let suggestion = '';
  if (total < 5) suggestion = '분석을 위한 문장이 부족합니다.';
  else if (repeatedStartRatio > 0.4)
    suggestion = `문장의 ${Math.round(repeatedStartRatio * 100)}% 가 "${topStarts[0].word}" 로 시작합니다. 시작을 변주하세요.`;
  else if (repeatedStartRatio > 0.25)
    suggestion = `"${topStarts[0].word}" 로 시작하는 문장이 ${topStarts[0].count}개입니다. 일부를 재구성해 보세요.`;
  else suggestion = '문장 시작이 자연스럽게 분산되어 있습니다.';
  return {
    totalSentences: total,
    topStarts,
    repeatedStartRatio: Math.round(repeatedStartRatio * 1000) / 1000,
    suggestion,
  };
}

export interface PassiveVoiceAnalysis {
  passiveCount: number;
  activeCount: number;
  ratio: number; // passive / (passive + active), 낮을수록 좋음
  level: 'low' | 'medium' | 'high';
  examples: Array<{ phrase: string; index: number }>;
  suggestion: string;
}

const PASSIVE_PATTERNS: RegExp[] = [
  /이루어지(?:었|게 되)/g,
  /되어지(?:었|게 되)/g,
  /되어졌/g,
  /지어지(?:었|게 되)/g,
  /(?<![가-힣])되었(?:다|습니다|으며)/g,
  /(?<![가-힣])시켜지/g,
  /만들어지(?:었|게 되)/g,
];
const ACTIVE_PATTERNS: RegExp[] = [
  /(?:했|주도했|구현했|달성했|개선했|만들었|진행했|완료했|배포했|설계했)(?:다|습니다|으며)/g,
];

/**
 * 수동태 남용 검출 — 이력서는 능동태 "~했다/했습니다" 가 원칙. 수동태("되었다/이루어졌다")
 * 가 많으면 주체성이 흐려지고 성과 주인이 불분명해짐.
 */
export function analyzePassiveVoice(text: string): PassiveVoiceAnalysis {
  const t = text ?? '';
  const examples: PassiveVoiceAnalysis['examples'] = [];
  let passiveCount = 0;
  for (const re of PASSIVE_PATTERNS) {
    const src = new RegExp(re.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = src.exec(t))) {
      passiveCount++;
      if (examples.length < 10) examples.push({ phrase: m[0], index: m.index });
    }
  }
  let activeCount = 0;
  for (const re of ACTIVE_PATTERNS) {
    const src = new RegExp(re.source, 'g');
    activeCount += (t.match(src) ?? []).length;
  }
  const total = passiveCount + activeCount;
  const ratio = total === 0 ? 0 : Math.round((passiveCount / total) * 100) / 100;
  let level: PassiveVoiceAnalysis['level'];
  if (total < 3) level = 'medium';
  else if (ratio >= 0.35) level = 'high';
  else if (ratio >= 0.15) level = 'medium';
  else level = 'low';
  const suggestion =
    total < 3
      ? '분석을 위한 용언이 부족합니다.'
      : level === 'low'
        ? '능동태 비율이 우수합니다.'
        : level === 'medium'
          ? `수동태 ${passiveCount}건 — 일부는 능동태로 전환해 주체를 드러내세요.`
          : `수동태 비율이 ${Math.round(ratio * 100)}% 로 높습니다. "되었다" → "했다/주도했다" 처럼 능동형으로 바꾸세요.`;
  return { passiveCount, activeCount, ratio, level, examples: examples.slice(0, 5), suggestion };
}
