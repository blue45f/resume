/**
 * 자기소개서 ↔ 채용공고 가치·테마 정합성(Resonance) 분석.
 *
 * 기존 coverLetterJdAlignment(기술/직무/도메인 키워드 커버리지)와 달리, 공고가 강조하는
 * "가치·문화·업무 스타일 테마"(자율·성장·협업·고객지향·데이터·속도 등)를 자소서가
 * 얼마나 반영하는지 본다. 한국 자소서 평가의 핵심인 "회사 가치 이해도"에 대응한다.
 *
 * 순수 함수(no DOM/network) — vitest 로 검증.
 */

export type ResonanceTone = 'good' | 'neutral' | 'warning';

interface ThemeDef {
  id: string;
  label: string;
  cue: RegExp; // JD/자소서 공통 단서 패턴
}

const THEMES: ThemeDef[] = [
  {
    id: 'ownership',
    label: '자율·오너십',
    cue: /자율|주도|주도성|오너십|ownership|능동|스스로|책임감/i,
  },
  { id: 'growth', label: '성장·학습', cue: /성장|배움|학습|발전|성숙|역량\s*강화|배우/i },
  { id: 'collaboration', label: '협업·소통', cue: /협업|소통|커뮤니케이션|팀워크|함께|공유|동료/i },
  { id: 'customer', label: '고객·사용자 지향', cue: /고객|사용자|유저|user|클라이언트|CS|니즈/i },
  { id: 'data', label: '데이터 기반', cue: /데이터|지표|수치|분석|측정|metric|A\/B/i },
  { id: 'speed', label: '빠른 실행', cue: /빠르|신속|실행력|애자일|agile|스피드|기민|민첩/i },
  { id: 'quality', label: '품질·완성도', cue: /품질|안정성|완성도|견고|신뢰성|테스트|리팩토링/i },
  { id: 'challenge', label: '도전·혁신', cue: /도전|혁신|새로운|변화|개척|실험|시도/i },
  { id: 'problem', label: '문제 해결', cue: /문제\s*해결|해결|개선|트러블|이슈\s*대응|원인/i },
  { id: 'global', label: '글로벌', cue: /글로벌|해외|영어|english|global|다국어|현지화/i },
];

export interface ResonanceTheme {
  id: string;
  label: string;
  resonant: boolean; // JD가 강조 + 자소서도 반영
  jdEvidence: string; // JD에서의 근거
  clEvidence: string | null; // 자소서에서의 근거
}

export interface CoverLetterJdResonanceReport {
  resonanceScore: number; // 0-100 (JD 테마 중 자소서가 반영한 비율)
  themes: ResonanceTheme[]; // JD가 강조한 테마들 (resonant 여부 포함)
  resonantLabels: string[];
  missingLabels: string[]; // JD는 강조하나 자소서에 없음
  tone: ResonanceTone;
  summary: string;
  suggestion: string;
}

function firstMatch(re: RegExp, text: string): string | null {
  const m = text.match(re);
  return m ? m[0] : null;
}

/**
 * 자소서가 채용공고의 가치·테마를 얼마나 반영하는지 분석한다.
 * @param coverLetter 자기소개서 본문
 * @param jd 채용공고/자격요건 텍스트
 */
export function analyzeCoverLetterJdResonance(
  coverLetter: string,
  jd: string,
): CoverLetterJdResonanceReport {
  const cl = coverLetter ?? '';
  const jdText = jd ?? '';

  // JD가 강조한 테마만 평가 대상
  const jdThemes = THEMES.map((t) => {
    const jdEvidence = firstMatch(t.cue, jdText);
    return { def: t, jdEvidence };
  }).filter((x) => x.jdEvidence);

  const themes: ResonanceTheme[] = jdThemes.map(({ def, jdEvidence }) => {
    const clEvidence = firstMatch(def.cue, cl);
    return {
      id: def.id,
      label: def.label,
      resonant: !!clEvidence,
      jdEvidence: jdEvidence as string,
      clEvidence,
    };
  });

  const resonantLabels = themes.filter((t) => t.resonant).map((t) => t.label);
  const missingLabels = themes.filter((t) => !t.resonant).map((t) => t.label);
  const resonanceScore = themes.length
    ? Math.round((resonantLabels.length / themes.length) * 100)
    : 0;

  let tone: ResonanceTone;
  if (themes.length === 0) tone = 'neutral';
  else if (resonanceScore >= 70) tone = 'good';
  else if (resonanceScore >= 40) tone = 'neutral';
  else tone = 'warning';

  let summary: string;
  let suggestion: string;
  if (themes.length === 0) {
    summary = '공고에서 뚜렷한 가치·문화 테마가 감지되지 않았습니다.';
    suggestion = '채용공고 본문을 더 붙여넣으면 가치 정합성을 분석할 수 있습니다.';
  } else if (tone === 'good') {
    summary = `공고가 강조한 ${themes.length}개 테마 중 ${resonantLabels.length}개를 자소서가 잘 반영했습니다.`;
    suggestion = missingLabels.length
      ? `"${missingLabels[0]}" 가치를 한 문장 더 녹이면 정합성이 완벽해집니다.`
      : '공고의 핵심 가치를 빠짐없이 반영했습니다. 구체 사례로 뒷받침되는지 확인하세요.';
  } else if (tone === 'neutral') {
    summary = `정합성 ${resonanceScore}% — 일부 핵심 가치가 자소서에 빠져 있습니다.`;
    suggestion = `공고가 강조하는 "${missingLabels.slice(0, 2).join('", "')}" 를 본인 경험과 연결해 보강하세요.`;
  } else {
    summary = `정합성 ${resonanceScore}% — 공고의 가치·문화가 자소서에 거의 드러나지 않습니다.`;
    suggestion = `이 회사는 "${missingLabels.slice(0, 2).join('", "')}" 를 중시합니다. 해당 경험을 구체적으로 추가하세요.`;
  }

  return {
    resonanceScore,
    themes,
    resonantLabels,
    missingLabels,
    tone,
    summary,
    suggestion,
  };
}
