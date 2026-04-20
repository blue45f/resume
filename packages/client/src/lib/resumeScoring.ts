/**
 * 이력서 점수·구조 분석 모듈 — koreanChecker.ts 에서 분리.
 *
 * 공통 주제: 이력서 구조·완성도·구체성·레벨 추정.
 *
 * - detectMissingResumeSections: 표준 섹션(경력/학력/기술/프로젝트/자기소개) 존재 여부
 * - scoreResumeCompleteness: 5개 축 가중 합산 구조 점수 (0-100)
 * - scoreSpecificity: 숫자/고유명사/기술용어 밀도 기반 구체성 점수
 * - estimateJobLevel: 경력 기간 + 리드 키워드 기반 junior/mid/senior/lead 추정
 * - analyzeActivityChronology: 경력 구간 시간순 일관성 (newest-first / oldest-first / mixed)
 */

import { detectContactInfo } from './pii';
import { estimateExperienceYears } from './experience';
import { analyzeQuantification } from './achievementSignals';
import { detectSkillMentions } from './jdKeywords';

const RESUME_SECTIONS: Array<{ key: string; synonyms: string[] }> = [
  {
    key: '경력',
    synonyms: ['경력 사항', '경력사항', '근무 경력', '회사 경력', '직장 경력', 'Career'],
  },
  { key: '학력', synonyms: ['학력 사항', '학력사항', '교육 사항', '학업', 'Education'] },
  {
    key: '기술',
    synonyms: ['기술 스택', '보유 기술', '스킬', '기술 스킬', 'Skills', 'Tech Stack'],
  },
  { key: '프로젝트', synonyms: ['프로젝트 경험', '주요 프로젝트', 'Projects', 'Portfolio'] },
  { key: '자기소개', synonyms: ['자기 소개', '자기소개서', 'About Me', 'Summary', 'Profile'] },
];

export interface ResumeSectionCoverage {
  present: string[];
  missing: string[];
  coverageRatio: number; // 0~1
  suggestion: string;
}

/**
 * 표준 이력서 섹션 커버리지 — 한국 이력서가 일반적으로 포함해야 할 섹션 존재 여부 체크.
 */
export function detectMissingResumeSections(text: string): ResumeSectionCoverage {
  const t = text ?? '';
  const present: string[] = [];
  const missing: string[] = [];
  for (const section of RESUME_SECTIONS) {
    const variants = [section.key, ...section.synonyms];
    const found = variants.some((v) => {
      const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(escaped, 'i').test(t);
    });
    if (found) present.push(section.key);
    else missing.push(section.key);
  }
  const coverageRatio = Math.round((present.length / RESUME_SECTIONS.length) * 100) / 100;
  let suggestion = '';
  if (coverageRatio === 1) suggestion = '이력서 주요 섹션이 모두 포함되어 있습니다.';
  else if (missing.length === 1)
    suggestion = `"${missing[0]}" 섹션이 누락되었습니다 — 추가를 고려하세요.`;
  else suggestion = `누락된 섹션: ${missing.join(', ')} — 완성도를 위해 추가하세요.`;
  return { present, missing, coverageRatio, suggestion };
}

export interface ResumeCompletenessScore {
  overall: number; // 0-100
  breakdown: Array<{ axis: string; score: number; weight: number }>;
  suggestion: string;
}

/**
 * 이력서 완성도 점수 — 섹션 커버리지 + 연락처 유효성 + 경력 기간 + 스킬 언급 + 정량 지표
 * 5개 축으로 0-100점 산출.
 */
export function scoreResumeCompleteness(text: string): ResumeCompletenessScore {
  const sections = detectMissingResumeSections(text);
  const contact = detectContactInfo(text);
  const exp = estimateExperienceYears(text);
  const skills = detectSkillMentions(text, 50);
  const quant = analyzeQuantification(text);

  const contactScore =
    contact.emails.length + contact.phones.length === 0
      ? 0
      : contact.emails.filter((e) => e.valid).length > 0 &&
          contact.phones.filter((p) => p.valid).length > 0
        ? 100
        : contact.emails.filter((e) => e.valid).length > 0 ||
            contact.phones.filter((p) => p.valid).length > 0
          ? 60
          : 20;
  const experienceScore = exp.ranges.length === 0 ? 0 : Math.min(100, exp.ranges.length * 25 + 40);
  const skillsScore = Math.min(100, skills.length * 20);
  const quantScore =
    quant.level === 'high' ? 100 : quant.level === 'medium' ? 70 : quant.level === 'low' ? 40 : 10;
  const sectionsScore = Math.round(sections.coverageRatio * 100);

  const breakdown = [
    { axis: '섹션 커버리지', score: sectionsScore, weight: 0.3 },
    { axis: '연락처', score: contactScore, weight: 0.15 },
    { axis: '경력 기간', score: experienceScore, weight: 0.25 },
    { axis: '스킬 언급', score: skillsScore, weight: 0.15 },
    { axis: '정량 지표', score: quantScore, weight: 0.15 },
  ];
  const overall = Math.round(breakdown.reduce((a, b) => a + b.score * b.weight, 0));
  const weakest = [...breakdown].sort((a, b) => a.score - b.score)[0];
  const suggestion =
    overall >= 90
      ? '이력서 구조가 매우 완성도 높습니다.'
      : overall >= 70
        ? `구조 양호 (${overall}점). 약한 축: ${weakest.axis} (${weakest.score}).`
        : `완성도가 낮습니다 (${overall}점). ${weakest.axis} (${weakest.score}) 부터 보강하세요.`;
  return { overall, breakdown, suggestion };
}

export interface SpecificityScore {
  overall: number; // 0~100
  numbers: number; // 숫자 등장 수
  properNouns: number; // 대문자로 시작하는 영문/회사 후보
  techTerms: number; // 기술 스킬 언급 총계
  suggestion: string;
}

/**
 * 구체성 점수 — 숫자·고유명사(회사/제품명)·기술 용어 밀도 종합.
 */
export function scoreSpecificity(text: string): SpecificityScore {
  const t = text ?? '';
  const chars = t.length || 1;
  const numbers = (t.match(/\d+/g) ?? []).length;
  const companyPatterns =
    /(네이버|카카오|삼성|LG|SK|현대|쿠팡|토스|배민|당근|라인|우아한형제|야놀자|무신사|NHN|KT)/g;
  const properEn = (t.match(/\b[A-Z][A-Za-z0-9.]+\b/g) ?? []).length;
  const properKr = (t.match(companyPatterns) ?? []).length;
  const properNouns = properEn + properKr;
  const techTerms = detectSkillMentions(t, 50).reduce((a, s) => a + s.count, 0);
  const density = ((numbers + properNouns + techTerms) / chars) * 100;
  let overall = Math.min(100, Math.round(density * 4));
  if (overall < 0) overall = 0;
  const suggestion =
    overall >= 75
      ? '구체성이 우수합니다 — 수치·고유명사·기술 용어가 충분히 드러납니다.'
      : overall >= 45
        ? `구체성 보통 (${overall}점). 회사명·수치·기술 용어를 더 추가하면 신뢰도 상승.`
        : `구체성이 부족합니다 (${overall}점). 추상 표현을 구체 사례·수치로 대체하세요.`;
  return { overall, numbers, properNouns, techTerms, suggestion };
}

const LEAD_KEYWORDS = ['리딩', '팀 리드', '팀 리더', '리더십', 'Tech Lead', '테크 리드', '팀장'];

export interface JobLevelEstimate {
  years: number;
  level: 'junior' | 'mid' | 'senior' | 'lead';
  hasLeadKeyword: boolean;
  suggestion: string;
}

/**
 * 경력 레벨 추정 — 경력 기간 + 리드 키워드 기반 Junior/Mid/Senior/Lead 추정.
 */
export function estimateJobLevel(text: string): JobLevelEstimate {
  const exp = estimateExperienceYears(text);
  const years = exp.totalYears;
  const hasLeadKeyword = LEAD_KEYWORDS.some((k) => text.includes(k));
  let level: JobLevelEstimate['level'];
  if (years >= 10 && hasLeadKeyword) level = 'lead';
  else if (years >= 7) level = 'senior';
  else if (years >= 3) level = 'mid';
  else level = 'junior';
  const suggestion =
    years === 0
      ? '경력 기간이 감지되지 않아 추정 불가.'
      : level === 'lead'
        ? `리드 레벨 (${years}년 + 리딩 경험 키워드 감지).`
        : level === 'senior'
          ? `시니어 레벨 (${years}년). 리딩·멘토링 경험을 강조하면 lead 로 어필 가능.`
          : level === 'mid'
            ? `미드 레벨 (${years}년). 주도 프로젝트·정량 성과로 시니어 발판 마련.`
            : `주니어 레벨 (${years}년). 학습 속도·기여 사례·협업 경험을 부각하세요.`;
  return { years, level, hasLeadKeyword, suggestion };
}

export interface ChronologyCheck {
  order: 'newest-first' | 'oldest-first' | 'mixed' | 'single-or-none';
  isConsistent: boolean;
  ranges: number[]; // 각 구간의 start year 배열 (등장 순서 유지)
  suggestion: string;
}

/**
 * 활동 시간순 검증 — 이력서·경력 섹션은 최신 → 과거 (역순) 또는 과거 → 최신 (순차)
 * 중 하나로 일관돼야 함.
 */
export function analyzeActivityChronology(text: string): ChronologyCheck {
  const exp = estimateExperienceYears(text);
  const ranges = exp.ranges.map((r) => r.start.year);
  if (ranges.length < 2) {
    return {
      order: 'single-or-none',
      isConsistent: true,
      ranges,
      suggestion: '경력 구간이 2개 미만 — 시간순 검증 불가.',
    };
  }
  let newest = true;
  for (let i = 1; i < ranges.length; i++) {
    if (ranges[i] > ranges[i - 1]) {
      newest = false;
      break;
    }
  }
  let oldest = true;
  for (let i = 1; i < ranges.length; i++) {
    if (ranges[i] < ranges[i - 1]) {
      oldest = false;
      break;
    }
  }
  const order: ChronologyCheck['order'] = newest
    ? 'newest-first'
    : oldest
      ? 'oldest-first'
      : 'mixed';
  const isConsistent = order !== 'mixed';
  const suggestion = isConsistent
    ? order === 'newest-first'
      ? '경력이 최신순으로 정렬되어 있습니다 (권장).'
      : '경력이 과거→최신 순. 일반적으로 최신순이 권장됩니다.'
    : `경력 구간(${ranges.join(' → ')})이 일관된 순서가 아닙니다 — 정렬 통일을 권장합니다.`;
  return { order, isConsistent, ranges, suggestion };
}
