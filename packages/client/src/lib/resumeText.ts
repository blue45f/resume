import type { Resume } from '@/types/resume';

const stripHtml = (s: string | undefined) =>
  (s ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const formatPeriod = (startDate?: string, endDate?: string, current?: boolean) => {
  if (!startDate && !endDate) return '';
  const start = (startDate ?? '').replace(/-/g, '.');
  const end = current ? '현재' : (endDate ?? '').replace(/-/g, '.');
  return start && end ? `${start} ~ ${end}` : start || end;
};

/**
 * Resume 편집 컨텍스트에서 분석기에 투입할 단일 plain-text 블롭을 생성.
 * 경력/학력/프로젝트 기간은 "2020.01 ~ 2022.12" 형식으로 직렬화하여 estimateExperienceYears 가 파싱 가능.
 */
export function buildResumePlainText(r: Partial<Resume> | null | undefined): string {
  if (!r) return '';
  const parts: string[] = [];

  if (r.title) parts.push(`이력서 제목: ${r.title}`);
  if (r.personalInfo?.summary) parts.push(`자기소개: ${stripHtml(r.personalInfo.summary)}`);

  for (const e of r.experiences ?? []) {
    const period = formatPeriod(e.startDate, e.endDate, e.current);
    const header = [e.company, e.position, period].filter(Boolean).join(' · ');
    parts.push(`경력: ${header}`);
    if (e.description) parts.push(stripHtml(e.description));
    if (e.achievements) parts.push(`성과: ${stripHtml(e.achievements)}`);
    if (e.techStack) parts.push(`기술 스택: ${e.techStack}`);
  }

  for (const ed of r.educations ?? []) {
    const period = formatPeriod(ed.startDate, ed.endDate);
    const header = [ed.school, ed.degree, ed.field, period].filter(Boolean).join(' · ');
    parts.push(`학력: ${header}`);
    if (ed.description) parts.push(stripHtml(ed.description));
  }

  for (const p of r.projects ?? []) {
    const period = formatPeriod(p.startDate, p.endDate);
    const header = [p.name, p.role, period].filter(Boolean).join(' · ');
    parts.push(`프로젝트: ${header}`);
    if (p.description) parts.push(stripHtml(p.description));
    if (p.techStack) parts.push(`기술 스택: ${p.techStack}`);
  }

  for (const s of r.skills ?? []) {
    parts.push(`스킬 (${s.category}): ${s.items}`);
  }

  for (const c of r.certifications ?? []) {
    parts.push(`자격증: ${[c.name, c.issuer].filter(Boolean).join(' · ')}`);
  }

  for (const a of r.awards ?? []) {
    parts.push(`수상: ${[a.name, a.issuer].filter(Boolean).join(' · ')}`);
    if (a.description) parts.push(stripHtml(a.description));
  }

  for (const act of r.activities ?? []) {
    const period = formatPeriod(act.startDate, act.endDate);
    const header = [act.name, act.role, act.organization, period].filter(Boolean).join(' · ');
    parts.push(`활동: ${header}`);
    if (act.description) parts.push(stripHtml(act.description));
  }

  return parts.filter(Boolean).join('\n');
}
