/**
 * JD·키워드·스킬 매칭 모듈 — koreanChecker.ts 에서 분리.
 *
 * 공통 주제: 이력서·채용공고 텍스트에서 키워드를 뽑아 비교·빈도 집계.
 *
 * - extractKeywords: 한글 2자+/영문 3자+ 토큰 중 조사·불용어 제외 빈도 상위 N개
 * - computeJDMatch: 이력서 ↔ JD 키워드 매칭 점수 (0-100)
 * - detectSkillMentions: 정의된 TECH_SKILLS 43종 빈도 카운트
 */

export interface ExtractedKeyword {
  word: string;
  count: number;
  weight: number; // TF 상대 가중치 (0~1)
}

const KEYWORD_STOPWORDS = new Set([
  '그리고',
  '그래서',
  '하지만',
  '그러나',
  '따라서',
  '하여',
  '있습',
  '없습',
  '있어',
  '없어',
  '입니',
  '합니',
  '됩니',
  '것과',
  '것을',
  '것이',
  '것은',
  '대한',
  '위해',
  '통해',
  '대해',
  '하지',
  '에서',
  '으로',
  '에게',
  '까지',
  '부터',
  '보다',
  '처럼',
  '마저',
  '역시',
  '또한',
  '많은',
  '다양',
  '여러',
  '모든',
  '저는',
  '제가',
  '우리',
  '사람',
  '경우',
  '때문',
  '정도',
  '이상',
  '이하',
  '관련',
]);

/**
 * 핵심 키워드 추출 — 한글 2자↑ 명사·전문용어를 빈도 기반 상위 N 개 반환.
 * 조사/접속사/불용어 제거. 태그 클라우드·이력서 키워드 배지에 활용.
 */
export function extractKeywords(text: string, topN = 15): ExtractedKeyword[] {
  const t = (text ?? '').replace(/\s+/g, ' ');
  if (!t.trim()) return [];
  const tokens = t.match(/[가-힣]{2,}|[A-Za-z][A-Za-z0-9+#.-]{2,}/g)?.map((s) => s.trim()) ?? [];
  const freq = new Map<string, number>();
  for (const tk of tokens) {
    const lower = /[A-Za-z]/.test(tk) ? tk : tk;
    if (KEYWORD_STOPWORDS.has(lower)) continue;
    let normalized = lower;
    if (/[가-힣]{3,}/.test(normalized)) {
      normalized = normalized.replace(/[을를이가은는의에서로와과및]$/, '') || normalized;
    }
    if (normalized.length < 2) continue;
    if (KEYWORD_STOPWORDS.has(normalized)) continue;
    freq.set(normalized, (freq.get(normalized) ?? 0) + 1);
  }
  const entries = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] ?? 1;
  return entries
    .slice(0, topN)
    .map(([word, count]) => ({ word, count, weight: Math.round((count / max) * 100) / 100 }));
}

export interface JDMatchResult {
  score: number;
  matched: string[];
  missing: string[]; // JD 에만 있는 키워드
  onlyInResume: string[]; // 이력서에만 있는 키워드
  suggestion: string;
}

/**
 * 이력서·자소서 ↔ 채용공고(JD) 키워드 매칭 점수.
 * 양쪽에서 상위 키워드를 추출해 중복·누락·고유 키워드를 분류. 0~100 match %.
 */
export function computeJDMatch(resumeText: string, jdText: string, topN = 30): JDMatchResult {
  if (!resumeText || !jdText) {
    return {
      score: 0,
      matched: [],
      missing: [],
      onlyInResume: [],
      suggestion: '이력서 또는 공고 본문이 비어 있습니다.',
    };
  }
  const resumeKw = new Set(extractKeywords(resumeText, topN * 2).map((k) => k.word));
  const jdKws = extractKeywords(jdText, topN);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const kw of jdKws) {
    if (resumeKw.has(kw.word)) matched.push(kw.word);
    else missing.push(kw.word);
  }
  const onlyInResume = [...resumeKw].filter((w) => !jdKws.some((j) => j.word === w)).slice(0, 10);
  const score = jdKws.length > 0 ? Math.round((matched.length / jdKws.length) * 100) : 0;
  let suggestion = '';
  if (jdKws.length < 3) suggestion = '공고 본문이 너무 짧아 분석이 제한적입니다.';
  else if (score >= 75) suggestion = '공고 키워드 적합도가 우수합니다.';
  else if (score >= 50)
    suggestion = `적합도 ${score}% — 공고의 "${missing.slice(0, 3).join(', ')}" 키워드를 이력서에 추가 반영해 보세요.`;
  else
    suggestion = `적합도가 ${score}% 로 낮습니다. 공고 핵심 키워드를 이력서 문장에 녹여 내세요: ${missing.slice(0, 5).join(', ')}`;
  return { score, matched, missing: missing.slice(0, 15), onlyInResume, suggestion };
}

const TECH_SKILLS = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'Kotlin',
  'Swift',
  'Go',
  'Rust',
  'C++',
  'C#',
  'React',
  'Vue.js',
  'Angular',
  'Svelte',
  'Next.js',
  'Nuxt',
  'Node.js',
  'Express',
  'NestJS',
  'Django',
  'FastAPI',
  'Spring',
  'MySQL',
  'PostgreSQL',
  'MongoDB',
  'Redis',
  'Elasticsearch',
  'AWS',
  'GCP',
  'Azure',
  'Docker',
  'Kubernetes',
  'Terraform',
  'GitHub',
  'GitLab',
  'Figma',
  'Sketch',
  'Photoshop',
  'Illustrator',
  'TailwindCSS',
  'HTML',
  'CSS',
  'GraphQL',
  'REST',
];

export interface SkillMention {
  skill: string;
  count: number;
}

/**
 * 기술 스택·스킬 언급 감지 — 빈도 많은 스킬/도구 이름을 추출해 카운트.
 * 이력서 요약 대시보드·스킬 배지에 활용.
 */
export function detectSkillMentions(text: string, topN = 15): SkillMention[] {
  const t = text ?? '';
  const hits: SkillMention[] = [];
  for (const skill of TECH_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<![A-Za-z0-9.])${escaped}(?![A-Za-z0-9.])`, 'gi');
    const matches = t.match(re);
    if (matches) hits.push({ skill, count: matches.length });
  }
  hits.sort((a, b) => b.count - a.count);
  return hits.slice(0, topN);
}
