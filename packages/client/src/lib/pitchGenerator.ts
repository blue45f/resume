import type { Resume } from '@/types/resume';

/**
 * 이력서 데이터로 LinkedIn summary / 소개글 / slack intro 등에 활용할 수 있는
 * 한국어 2-3문장 자기 PR 자동 생성. LLM 호출 없음 — 템플릿+룰 기반.
 *
 * 3가지 톤 제공:
 * - professional: 공식적·안정적 (대기업/면접 제출용)
 * - casual: 친근·자연스러움 (slack intro, Notion about)
 * - networking: 적극적·연결 지향 (LinkedIn, 커피챗)
 */
export type PitchTone = 'professional' | 'casual' | 'networking';

export interface PitchOptions {
  tone?: PitchTone;
  /** 최대 문장 수 */
  maxSentences?: number;
}

export function generatePitch(resume: Resume, options: PitchOptions = {}): string {
  const tone = options.tone || 'professional';
  const maxSentences = options.maxSentences || 3;

  const p = resume.personalInfo;
  const current = resume.experiences.find((e) => e.current) || resume.experiences[0];
  const totalYears = computeYears(resume);
  const topSkills = computeTopSkills(resume, 5);
  const companyCount = new Set(resume.experiences.map((e) => e.company).filter(Boolean)).size;
  const projectCount = resume.projects.length;
  const cert = resume.certifications?.length ?? 0;
  const education = resume.educations[0];

  // ── 1. 도입 — 정체성 (직무 + 경력) ─────────────────────────
  const role = inferRole(resume);
  const yrs = totalYears >= 0.5 ? ` ${Math.round(totalYears)}년차` : '';

  const sent1 = (() => {
    if (tone === 'casual') {
      return `안녕하세요, ${yrs} ${role}${role.endsWith('자') ? '' : '자'} ${p.name || ''}입니다.`.trim();
    }
    if (tone === 'networking') {
      return `${role}${yrs} · ${p.name || '새 멤버'} — 성장·협업 기회에 열려 있습니다.`;
    }
    return `${yrs}${yrs ? ' ' : ''}${role}${p.name ? ` ${p.name}` : ''}입니다.`.trim();
  })();

  // ── 2. 강점 — 기술 스택 + 최근 경험 ─────────────────────────
  const sent2Parts: string[] = [];
  if (topSkills.length > 0) {
    const skillsStr = topSkills.slice(0, 3).join(' · ');
    if (tone === 'casual') sent2Parts.push(`주로 ${skillsStr} 쓰면서 일하고 있어요`);
    else sent2Parts.push(`${skillsStr} 기반의 개발·실행 경험 보유`);
  }
  if (current?.company) {
    const posStr = current.position ? ` ${current.position}으로` : '';
    if (tone === 'casual') sent2Parts.push(`현재 ${current.company}에서${posStr} 근무 중`);
    else sent2Parts.push(`현재 ${current.company}에서${posStr} 재직 중`);
  } else if (companyCount > 0) {
    sent2Parts.push(`${companyCount}개 조직에서 다양한 도메인 경험`);
  }

  const sent2 =
    sent2Parts.length > 0 ? sent2Parts.join(', ') + (tone === 'casual' ? '.' : '.') : '';

  // ── 3. 차별화 — 프로젝트·수상·자격증 중 가장 강한 한 건 ─────
  const sent3Parts: string[] = [];
  if (projectCount >= 3) {
    sent3Parts.push(`${projectCount}개 프로젝트를 리딩/기여하며 결과 중심의 실행력 쌓음`);
  } else if (projectCount >= 1) {
    sent3Parts.push(`대표 프로젝트로 제품 기여 경험`);
  }
  if (cert >= 1) sent3Parts.push(`관련 자격증 ${cert}개 취득`);
  if (resume.awards && resume.awards.length > 0) {
    sent3Parts.push(`수상 경력 ${resume.awards.length}회`);
  }
  if (education?.school && tone === 'professional') {
    sent3Parts.push(`${education.school} ${education.field || ''} 전공`.trim());
  }

  const sent3 = sent3Parts.length > 0 ? sent3Parts[0] + (tone === 'casual' ? '이에요.' : '.') : '';

  // ── 4. 클로징 — 톤별 ─────────────────────────────────────
  const closing = (() => {
    if (tone === 'casual') return '';
    if (tone === 'networking') {
      return projectCount + companyCount > 0 ? '같이 일할 기회 언제든 환영해요.' : '';
    }
    return '';
  })();

  const sentences = [sent1, sent2, sent3, closing].filter(Boolean).slice(0, maxSentences);
  return sentences.join(' ');
}

/** 가장 많이 등장하는 직무 키워드로 역할 추정 */
function inferRole(resume: Resume): string {
  const positions = resume.experiences.map((e) => e.position).filter(Boolean);
  if (positions.length === 0) return '지원자';

  // 한국어 직무 카테고리 매핑
  const categories: Array<[RegExp, string]> = [
    [/(프론트|frontend|front-end|front end)/i, '프론트엔드 개발자'],
    [/(백엔드|backend|back-end|back end|서버)/i, '백엔드 개발자'],
    [/(풀스택|fullstack|full-stack|full stack)/i, '풀스택 개발자'],
    [/(데이터|data|analyst|분석)/i, '데이터 분석가/엔지니어'],
    [/(머신|ml|ai|인공지능)/i, 'ML 엔지니어'],
    [/(디자인|designer|ux|ui)/i, '디자이너'],
    [/(pm|product manager|프로덕트)/i, '프로덕트 매니저'],
    [/(기획|planner|전략)/i, '기획자'],
    [/(마케팅|marketing|growth)/i, '마케터'],
    [/(devops|sre|인프라|infra)/i, 'DevOps 엔지니어'],
    [/(모바일|mobile|ios|android)/i, '모바일 개발자'],
    [/개발자|엔지니어|engineer|developer/i, '개발자'],
  ];

  const firstPos = positions[0];
  for (const [pattern, role] of categories) {
    if (positions.some((p) => pattern.test(p))) return role;
  }
  return firstPos;
}

function computeYears(resume: Resume): number {
  return resume.experiences.reduce((sum, e) => {
    if (!e.startDate) return sum;
    const start = new Date(e.startDate + '-01').getTime();
    const end = e.current ? Date.now() : new Date((e.endDate || e.startDate) + '-01').getTime();
    return sum + Math.max(0, (end - start) / (1000 * 60 * 60 * 24 * 365));
  }, 0);
}

function computeTopSkills(resume: Resume, n: number): string[] {
  return resume.skills
    .flatMap((s) => s.items.split(',').map((x) => x.trim()))
    .filter(Boolean)
    .slice(0, n);
}
