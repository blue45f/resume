/**
 * 비격식 표현 검출 모듈 — koreanChecker.ts 에서 분리.
 * 이모티콘, 초성체(ㅎㅎㅋㅋㅠ), 줄임말(존맛/갑분싸/JMT), 구어체 강조어 등 공식 문서
 * (이력서·자소서)에 부적합한 표현 신호.
 */

export interface InformalHit {
  category: 'emoticon' | 'chosung' | 'slang' | 'casual' | 'exclaim';
  phrase: string;
  index: number;
  reason: string;
}

export interface InformalAnalysis {
  hits: InformalHit[];
  count: number;
  level: 'none' | 'few' | 'many';
  suggestion: string;
}

const INFORMAL_PATTERNS: Array<{ re: RegExp; category: InformalHit['category']; reason: string }> =
  [
    {
      re: /[😀-🙏🌀-🗿🚀-🛿🤀-🧿]/gu,
      category: 'emoticon',
      reason: '이모지(이모티콘)는 공식 문서에 부적합합니다.',
    },
    {
      re: /[ㅋㅎㅠㅜㅗㅎ]{2,}/g,
      category: 'chosung',
      reason: '초성체(ㅋㅋ/ㅎㅎ/ㅠㅠ)는 비격식 표현입니다.',
    },
    {
      re: /(?<![가-힣])ㄱㅅ(?![가-힣])/g,
      category: 'chosung',
      reason: '"감사"는 줄이지 않고 전체로 표기.',
    },
    {
      re: /(?<![가-힣])존맛|JMT|존좋|개좋/g,
      category: 'slang',
      reason: '은어·속어는 공식 문서에 부적합.',
    },
    {
      re: /(?<![가-힣])갑분싸|ㅇㅋ|오키|ㄴㄴ/g,
      category: 'slang',
      reason: '줄임·유행어는 제거하세요.',
    },
    {
      re: /(?<![가-힣])인싸|아싸|스펙|꿀|개이득/g,
      category: 'slang',
      reason: '구어체 속어는 공식 문서에 부적합.',
    },
    {
      re: /(?<![가-힣])근데(?![가-힣])/g,
      category: 'casual',
      reason: '"근데" 대신 "그런데"를 쓰세요.',
    },
    {
      re: /(?<![가-힣])했던거(?![가-힣])/g,
      category: 'casual',
      reason: '"했던 것"처럼 띄어 쓰고 구체화.',
    },
    { re: /!{2,}|\?{2,}/g, category: 'exclaim', reason: '느낌표·물음표 반복은 비공식 느낌.' },
    {
      re: /(?<![가-힣])뭔가|되게|엄청|너무너무/g,
      category: 'casual',
      reason: '구어체 강조어. 객관적 표현으로.',
    },
  ];

export function detectInformalLanguage(text: string): InformalAnalysis {
  const t = text ?? '';
  const hits: InformalHit[] = [];
  for (const p of INFORMAL_PATTERNS) {
    const re = new RegExp(p.re.source, p.re.flags.includes('g') ? p.re.flags : p.re.flags + 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      hits.push({ category: p.category, phrase: m[0], index: m.index, reason: p.reason });
      if (hits.length > 50) break;
    }
    if (hits.length > 50) break;
  }
  hits.sort((a, b) => a.index - b.index);
  const count = hits.length;
  let level: InformalAnalysis['level'];
  let suggestion: string;
  if (count === 0) {
    level = 'none';
    suggestion = '비격식 표현이 없습니다.';
  } else if (count <= 2) {
    level = 'few';
    suggestion = `비격식 표현 ${count}건 — "${hits[0].phrase}" 등을 공식 표현으로 교체하세요.`;
  } else {
    level = 'many';
    suggestion = `비격식 표현이 ${count}건으로 많습니다. 공식 문서 톤으로 전면 재작성을 권장합니다.`;
  }
  return { hits: hits.slice(0, 30), count, level, suggestion };
}
