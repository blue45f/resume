/**
 * 자기소개서 보조 모듈 — koreanChecker.ts 에서 분리.
 *
 * - recommendCoverLetterOpeners: 이력서 기반 3종 오프닝 문장 템플릿 (achievement/passion/pragmatic)
 * - detectSelfDeprecation: "부족하지만/미흡하나/혹시" 같은 자기비하 표현 검출
 * - analyzeCallToAction: 마지막 문단 CTA("기여하고 싶습니다" 등) 존재 확인
 */

import { detectSkillMentions } from './jdKeywords';
import { estimateJobLevel } from './resumeScoring';

export interface OpenerSuggestion {
  style: 'achievement' | 'passion' | 'pragmatic';
  text: string;
}

/**
 * 자기소개서 오프닝 추천 — 이력서에서 상위 스킬 + 경력 레벨을 뽑아 회사·직무에 맞는
 * 3가지 템플릿 문장을 생성.
 */
export function recommendCoverLetterOpeners(
  resumeText: string,
  company: string = '귀사',
  role: string = '해당 포지션',
): OpenerSuggestion[] {
  const skills = detectSkillMentions(resumeText, 3)
    .slice(0, 3)
    .map((s) => s.skill);
  const topSkills = skills.length > 0 ? skills.join(' · ') : '다양한 프로젝트';
  const level = estimateJobLevel(resumeText);
  const years = level.years;
  const yearsText = years > 0 ? `${years}년간 ` : '';

  return [
    {
      style: 'achievement',
      text: `${yearsText}${topSkills}를 바탕으로 실전 성과를 축적해 온 ${level.level === 'junior' ? '개발자 지망생' : '실무자'}로서, ${company}의 ${role}에서 다음 성과를 만들어 가고 싶습니다.`,
    },
    {
      style: 'passion',
      text: `${topSkills}를 통해 사용자에게 직접적인 가치를 전달하는 일이 가장 즐겁습니다. ${company}의 비전이 제 방향과 정확히 맞닿아 ${role}에 지원합니다.`,
    },
    {
      style: 'pragmatic',
      text: `${yearsText}쌓아 온 ${topSkills} 경험이 ${company} ${role}의 현재 과제와 맞물리는 지점을 확인했습니다. 다음 세 가지 영역에서 기여할 수 있습니다.`,
    },
  ];
}

const SELF_DEPRECATION_PATTERNS: Array<{ re: RegExp; phrase: string; reason: string }> = [
  {
    re: /부족하지만/g,
    phrase: '부족하지만',
    reason: '자신감 결여 표현 — "충실히 준비했습니다" 등으로 전환.',
  },
  {
    re: /미흡하[지나]/g,
    phrase: '미흡하지만/미흡하나',
    reason: '자기비하. 구체 근거로 역량을 제시하세요.',
  },
  { re: /(?<![가-힣])혹시(?![가-힣])/g, phrase: '혹시', reason: '불확실성 표현. 단정적으로 서술.' },
  { re: /실례[지되][만만]/g, phrase: '실례지만', reason: '공식 문서에 과잉 겸양.' },
  {
    re: /폐[가를 ]?끼치[지면]/g,
    phrase: '폐를 끼치',
    reason: '부정적 뉘앙스. 긍정적 가치 전달로.',
  },
  {
    re: /많은\s*부족함/g,
    phrase: '많은 부족함',
    reason: '자기 결함 강조 — 성장 가능성으로 재구성.',
  },
  { re: /잘\s*모르지만/g, phrase: '잘 모르지만', reason: '무지 인정 — 학습 의지로 전환.' },
  { re: /서투르지만/g, phrase: '서투르지만', reason: '기술 부족 인정 — 배움의 자세로 표현.' },
];

export interface SelfDeprecationHit {
  phrase: string;
  index: number;
  reason: string;
}

export interface SelfDeprecationAnalysis {
  hits: SelfDeprecationHit[];
  count: number;
  level: 'none' | 'few' | 'many';
  suggestion: string;
}

/**
 * 자기비하 표현 검출 — "부족하지만/미흡하나/혹시/실례지만/폐를 끼치" 등 지나친 겸양은
 * 자신감 결여 신호.
 */
export function detectSelfDeprecation(text: string): SelfDeprecationAnalysis {
  const t = text ?? '';
  const hits: SelfDeprecationHit[] = [];
  for (const p of SELF_DEPRECATION_PATTERNS) {
    const re = new RegExp(p.re.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) {
      hits.push({ phrase: p.phrase, index: m.index, reason: p.reason });
      if (hits.length > 30) break;
    }
    if (hits.length > 30) break;
  }
  hits.sort((a, b) => a.index - b.index);
  const count = hits.length;
  const level: SelfDeprecationAnalysis['level'] =
    count === 0 ? 'none' : count <= 2 ? 'few' : 'many';
  const suggestion =
    level === 'none'
      ? '자기비하 표현이 감지되지 않았습니다.'
      : level === 'few'
        ? `자기비하 ${count}건 — 자신감 있는 표현으로 교체하세요.`
        : `자기비하가 ${count}건으로 많습니다. 공식 문서에서는 성과·학습 의지 중심으로 재작성하세요.`;
  return { hits: hits.slice(0, 20), count, level, suggestion };
}

const CTA_PATTERNS = [
  /기여하(?:고 싶|겠)/,
  /함께(?:하고 싶|하겠)/,
  /성장하(?:고 싶|겠)/,
  /만들어\s*가(?:고 싶|겠)/,
  /도전하(?:고 싶|겠)/,
  /이바지하/,
  /합류하(?:고 싶|기)/,
  /기대하(?:고 있|겠)/,
  /감사합니다/,
];

export interface CallToActionAnalysis {
  hasCTA: boolean;
  matched: string[];
  lastParagraph: string;
  suggestion: string;
}

/**
 * 클로징 CTA 검출 — 자소서 마지막 문단에 "기여/함께하겠습니다/기대하겠습니다" 같은
 * 행동 유발 마무리가 있는지 확인.
 */
export function analyzeCallToAction(text: string): CallToActionAnalysis {
  const t = (text ?? '').trim();
  if (!t) {
    return { hasCTA: false, matched: [], lastParagraph: '', suggestion: '본문이 비어 있습니다.' };
  }
  const paragraphs = t.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  const lastParagraph = (paragraphs[paragraphs.length - 1] ?? '').trim();
  const matched: string[] = [];
  for (const re of CTA_PATTERNS) {
    const m = lastParagraph.match(re);
    if (m) matched.push(m[0]);
  }
  const hasCTA = matched.length > 0;
  const suggestion = hasCTA
    ? `마지막 문단에 CTA 표현 ${matched.length}건 감지 — "${matched[0]}" 등 행동 유발 마무리가 있습니다.`
    : '마지막 문단에 명시적 CTA(기여/함께/성장/도전/감사합니다) 가 없습니다 — 인상적인 마무리를 추가하세요.';
  return { hasCTA, matched, lastParagraph: lastParagraph.slice(0, 100), suggestion };
}
