import type { Resume } from '@/types/resume';

export type ProficiencyLevel = 'Novice' | 'Intermediate' | 'Advanced' | 'Expert';

export interface SkillProficiency {
  skill: string;
  level: ProficiencyLevel;
  /** 0-100 점수 */
  score: number;
  /** 스킬이 언급된 경력 년수 합산 (겹치는 기간은 한 번만) */
  years: number;
  /** 프로젝트에서 사용된 횟수 */
  projectCount: number;
  /** 전체 텍스트에서 등장한 횟수 */
  mentions: number;
  /** 근거 — 어디서 감지됐는지 */
  evidence: string[];
}

/**
 * 이력서 전체(경력/프로젝트 설명·기술스택/스킬 카테고리)를 훑어 각 스킬의
 * 숙련도를 자동 추정. LLM 호출 없음.
 *
 * 점수 가중 (0-100):
 * - 경력 년수 (최대 40): years × 8점, 5년 이상이면 40
 * - 프로젝트 사용 횟수 (최대 30): count × 10
 * - 텍스트 언급 횟수 (최대 20): mentions × 2
 * - 기술스택 명시 (10): 스킬 섹션에 카테고리별 명시되었을 때
 */
export function analyzeSkillProficiency(resume: Resume): SkillProficiency[] {
  // 1. 스킬 목록 수집 — 스킬 섹션의 items 우선
  const skillsFromSection = new Set<string>();
  for (const s of resume.skills) {
    for (const item of s.items.split(',')) {
      const name = item.trim();
      if (name) skillsFromSection.add(name);
    }
  }

  // 2. 경력·프로젝트 techStack 에서 추가 추출
  const techStackSkills = new Set<string>();
  for (const e of resume.experiences) {
    if (e.techStack) {
      for (const item of e.techStack.split(',')) {
        const name = item.trim();
        if (name) techStackSkills.add(name);
      }
    }
  }
  for (const p of resume.projects) {
    if (p.techStack) {
      for (const item of p.techStack.split(',')) {
        const name = item.trim();
        if (name) techStackSkills.add(name);
      }
    }
  }

  // 스킬 섹션에 있거나 techStack 에 명시된 것만 분석 대상
  const allSkills = new Set<string>([...skillsFromSection, ...techStackSkills]);
  const allText = collectAllText(resume).toLowerCase();

  const results: SkillProficiency[] = [];

  for (const skill of allSkills) {
    const lower = skill.toLowerCase();

    // 언급 횟수 (단어 경계 매칭)
    const mentions = countOccurrences(allText, lower);

    // 프로젝트 사용 횟수
    let projectCount = 0;
    for (const p of resume.projects) {
      const pTech = (p.techStack || '').toLowerCase();
      const pDesc = (p.description || '').toLowerCase();
      if (pTech.includes(lower) || pDesc.includes(lower)) {
        projectCount++;
      }
    }

    // 경력 년수 — 해당 스킬이 언급된 경력의 기간 합산 (중복 제거)
    const intervals: Array<[number, number]> = [];
    for (const e of resume.experiences) {
      const eTech = (e.techStack || '').toLowerCase();
      const eDesc = (e.description || '').toLowerCase();
      if (!eTech.includes(lower) && !eDesc.includes(lower)) continue;
      if (!e.startDate) continue;
      const start = parseMonth(e.startDate);
      const end = e.current ? Date.now() : parseMonth(e.endDate || e.startDate);
      if (start && end && end > start) intervals.push([start, end]);
    }
    const years = mergeIntervalsToYears(intervals);

    // 근거 문자열
    const evidence: string[] = [];
    if (skillsFromSection.has(skill)) evidence.push('기술 섹션');
    if (years > 0) evidence.push(`경력 ${Math.round(years * 10) / 10}년`);
    if (projectCount > 0) evidence.push(`프로젝트 ${projectCount}개`);
    if (mentions > 3) evidence.push(`본문 ${mentions}회 언급`);

    // 점수 계산
    const yearScore = Math.min(40, Math.round(years * 8));
    const projectScore = Math.min(30, projectCount * 10);
    const mentionScore = Math.min(20, Math.round(mentions * 2));
    const sectionScore = skillsFromSection.has(skill) ? 10 : 0;
    const score = yearScore + projectScore + mentionScore + sectionScore;

    const level: ProficiencyLevel =
      score >= 80 ? 'Expert' : score >= 55 ? 'Advanced' : score >= 30 ? 'Intermediate' : 'Novice';

    results.push({
      skill,
      level,
      score,
      years: Math.round(years * 10) / 10,
      projectCount,
      mentions,
      evidence,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

function collectAllText(resume: Resume): string {
  const parts: string[] = [];
  if (resume.personalInfo.summary) parts.push(resume.personalInfo.summary);
  for (const e of resume.experiences) {
    parts.push(e.description || '');
    parts.push(e.achievements || '');
    parts.push(e.techStack || '');
    parts.push(e.position || '');
  }
  for (const p of resume.projects) {
    parts.push(p.description || '');
    parts.push(p.techStack || '');
    parts.push(p.name || '');
  }
  for (const s of resume.skills) {
    parts.push(s.items);
  }
  return parts.join(' ');
}

function parseMonth(date: string): number | null {
  if (!date) return null;
  const parts = date.split('-');
  if (parts.length < 2) return new Date(parseInt(parts[0]), 0, 1).getTime();
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1).getTime();
}

/** 겹치는 기간을 제거하고 총 년수 반환 */
function mergeIntervalsToYears(intervals: Array<[number, number]>): number {
  if (intervals.length === 0) return 0;
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const curr = sorted[i];
    if (curr[0] <= last[1]) {
      last[1] = Math.max(last[1], curr[1]);
    } else {
      merged.push(curr);
    }
  }
  const msPerYear = 1000 * 60 * 60 * 24 * 365;
  return merged.reduce((sum, [s, e]) => sum + (e - s) / msPerYear, 0);
}

/** 대소문자 무관 단어 경계 카운트 */
function countOccurrences(haystack: string, needle: string): number {
  if (!needle || needle.length < 2) return 0;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|[\\s,.;(<])${escaped}(?:$|[\\s,.;)>])`, 'g');
  const matches = haystack.match(re);
  return matches ? matches.length : 0;
}
