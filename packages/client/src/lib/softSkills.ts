/**
 * 소프트 스킬·축약어 분석 모듈 — koreanChecker.ts 에서 분리.
 *
 * - detectSoftSkills: 협업/소통/문제해결/리더십 등 10종 소프트 스킬 키워드 감지
 * - detectAbbreviations: 확장 없이 사용된 영문 축약어(TLA/FLA) 감지
 */

const SOFT_SKILLS: Array<{ key: string; variants: string[] }> = [
  { key: '협업', variants: ['협업', '협력', '공동 작업', '팀워크', 'teamwork'] },
  { key: '커뮤니케이션', variants: ['커뮤니케이션', '소통', '의사소통', 'communication'] },
  { key: '문제해결', variants: ['문제 해결', '문제해결', '트러블슈팅', 'troubleshooting'] },
  { key: '리더십', variants: ['리더십', '리딩', '팀 리드', '팀장', 'leadership'] },
  { key: '기획', variants: ['기획', '설계', '계획'] },
  { key: '주도성', variants: ['주도', '오너십', '책임감', 'ownership'] },
  { key: '학습', variants: ['학습', '습득', '배움', '자기계발'] },
  { key: '분석', variants: ['분석', '데이터 기반', '인사이트', 'analysis'] },
  { key: '창의성', variants: ['창의', '혁신', '아이디어', 'creative'] },
  { key: '협상', variants: ['협상', '설득', '조율'] },
];

export interface SoftSkillHit {
  skill: string;
  count: number;
}

export interface SoftSkillAnalysis {
  hits: SoftSkillHit[];
  total: number;
  distinctCount: number;
  suggestion: string;
}

/**
 * 소프트 스킬 감지 — 기술 스킬 외 협업·소통·문제해결 역량 키워드.
 */
export function detectSoftSkills(text: string): SoftSkillAnalysis {
  const t = text ?? '';
  const hits: SoftSkillHit[] = [];
  for (const s of SOFT_SKILLS) {
    let count = 0;
    for (const v of s.variants) {
      const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'gi');
      count += (t.match(re) ?? []).length;
    }
    if (count > 0) hits.push({ skill: s.key, count });
  }
  hits.sort((a, b) => b.count - a.count);
  const total = hits.reduce((a, b) => a + b.count, 0);
  const distinctCount = hits.length;
  const suggestion =
    distinctCount === 0
      ? '소프트 스킬 표현이 감지되지 않았습니다 — 협업·문제해결 경험을 녹여 내세요.'
      : distinctCount >= 5
        ? `소프트 스킬 ${distinctCount}종 · ${total}회 — 균형 잡힌 역량 표현.`
        : `소프트 스킬 ${distinctCount}종만 감지 — 협업/커뮤니케이션/주도성 등 다양화 권장.`;
  return { hits: hits.slice(0, 10), total, distinctCount, suggestion };
}

const COMMON_ACRONYMS = new Set([
  'AI',
  'ML',
  'API',
  'URL',
  'UI',
  'UX',
  'IT',
  'OS',
  'DB',
  'SQL',
  'CSS',
  'HTML',
  'JS',
  'TS',
  'AWS',
  'GCP',
  'CI',
  'CD',
  'PR',
  'QA',
  'KPI',
  'ROI',
  'OKR',
  'PM',
  'TF',
  'BM',
  'FE',
  'BE',
]);

export interface AcronymHit {
  acronym: string;
  index: number;
  hasExpansion: boolean;
}

export interface AcronymAnalysis {
  hits: AcronymHit[];
  unexplained: AcronymHit[];
  suggestion: string;
}

/**
 * 축약어 검출 — 확장 없이 사용된 영문 축약어(TLA/FLA) 감지. 심사자가 모를 수 있는 업계
 * 용어의 첫 등장에 풀어 쓴 설명이 동반되었는지 확인.
 */
export function detectAbbreviations(text: string): AcronymAnalysis {
  const t = text ?? '';
  const re = /\b([A-Z]{2,5})\b/g;
  const hits: AcronymHit[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const acronym = m[1];
    if (COMMON_ACRONYMS.has(acronym)) continue;
    const after = t.slice(m.index + acronym.length, m.index + acronym.length + 80);
    const hasExpansion = /^\s*[(（][^)）]{3,}[)）]/.test(after);
    hits.push({ acronym, index: m.index, hasExpansion: hasExpansion || seen.has(acronym) });
    seen.add(acronym);
  }
  const unexplained = hits.filter((h) => !h.hasExpansion);
  const suggestion =
    hits.length === 0
      ? '분석 가능한 축약어가 감지되지 않았습니다.'
      : unexplained.length === 0
        ? `축약어 ${hits.length}개 — 모두 처음 등장 시 풀어 쓰여 있거나 일반 용어입니다.`
        : `설명 없이 쓰인 축약어 ${unexplained.length}건 (${unexplained
            .slice(0, 3)
            .map((h) => h.acronym)
            .join(', ')}) — 처음 등장 시 "(풀이)" 를 괄호로 부연 권장.`;
  return { hits: hits.slice(0, 20), unexplained: unexplained.slice(0, 10), suggestion };
}
