import type { Resume } from '@/types/resume';

/**
 * JSON Resume 표준 스키마 (https://jsonresume.org/schema/) 변환기.
 *
 * jsonresume.org 은 수십 개 오픈소스 테마 + 깃허브 액션 + API 서비스들이
 * 지원하는 이력서 데이터 표준. 이 형식으로 내보내면 사용자는 본 서비스와
 * 관계없이 자유롭게 다른 도구에 임포트할 수 있음 — 데이터 락인 방지.
 */
export interface JsonResumeSchema {
  basics: {
    name: string;
    label?: string;
    image?: string;
    email?: string;
    phone?: string;
    url?: string;
    summary?: string;
    location?: {
      address?: string;
      postalCode?: string;
      city?: string;
      countryCode?: string;
      region?: string;
    };
    profiles?: Array<{ network: string; username?: string; url: string }>;
  };
  work?: Array<{
    name: string;
    position?: string;
    url?: string;
    startDate?: string;
    endDate?: string;
    summary?: string;
    highlights?: string[];
  }>;
  education?: Array<{
    institution: string;
    url?: string;
    area?: string;
    studyType?: string;
    startDate?: string;
    endDate?: string;
    score?: string;
  }>;
  skills?: Array<{ name: string; level?: string; keywords?: string[] }>;
  projects?: Array<{
    name: string;
    description?: string;
    highlights?: string[];
    keywords?: string[];
    startDate?: string;
    endDate?: string;
    url?: string;
    roles?: string[];
    entity?: string;
    type?: string;
  }>;
  awards?: Array<{ title: string; date?: string; awarder?: string; summary?: string }>;
  certificates?: Array<{ name: string; date?: string; issuer?: string; url?: string }>;
  languages?: Array<{ language: string; fluency?: string }>;
  meta?: {
    canonical?: string;
    version?: string;
    lastModified?: string;
  };
}

export function buildJsonResume(
  resume: Resume,
  options: { canonical?: string } = {},
): JsonResumeSchema {
  const p = resume.personalInfo;

  // basics.profiles — GitHub + 커스텀 links
  const profiles: JsonResumeSchema['basics']['profiles'] = [];
  if (p.github) {
    profiles.push({
      network: 'GitHub',
      username: p.github,
      url: `https://github.com/${p.github}`,
    });
  }
  if (p.links && Array.isArray(p.links)) {
    for (const l of p.links) {
      if (l.url) {
        profiles.push({
          network: inferNetworkFromUrl(l.url) || l.label || 'Website',
          url: l.url,
        });
      }
    }
  }

  const schema: JsonResumeSchema = {
    basics: {
      name: p.name || '',
      label: resume.experiences.find((e) => e.current)?.position || undefined,
      image: p.photo || undefined,
      email: p.email || undefined,
      phone: p.phone || undefined,
      url: p.website || undefined,
      summary: stripHtml(p.summary) || undefined,
      location: p.address ? { address: p.address } : undefined,
      profiles: profiles.length ? profiles : undefined,
    },
    work: resume.experiences.map((e) => ({
      name: e.company,
      position: e.position || undefined,
      startDate: normalizeDate(e.startDate),
      endDate: e.current ? undefined : normalizeDate(e.endDate),
      summary: stripHtml(e.description) || undefined,
      highlights: e.achievements ? splitBullets(e.achievements) : undefined,
    })),
    education: resume.educations.map((edu) => ({
      institution: edu.school,
      area: edu.field || undefined,
      studyType: edu.degree || undefined,
      startDate: normalizeDate(edu.startDate),
      endDate: normalizeDate(edu.endDate),
      score: edu.gpa || undefined,
    })),
    skills: resume.skills.map((s) => ({
      name: s.category || 'Skills',
      keywords: s.items
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    })),
    projects: resume.projects.map((proj) => ({
      name: proj.name,
      description: stripHtml(proj.description) || undefined,
      keywords: proj.techStack
        ? proj.techStack
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
        : undefined,
      entity: proj.company || undefined,
    })),
    awards:
      resume.awards && resume.awards.length > 0
        ? resume.awards.map((a) => ({
            title: a.name || '',
            date: normalizeDate(a.awardDate),
            awarder: a.issuer || undefined,
            summary: stripHtml(a.description) || undefined,
          }))
        : undefined,
    certificates:
      resume.certifications && resume.certifications.length > 0
        ? resume.certifications.map((c) => ({
            name: c.name || '',
            date: normalizeDate(c.issueDate),
            issuer: c.issuer || undefined,
          }))
        : undefined,
    languages:
      resume.languages && resume.languages.length > 0
        ? resume.languages.map((l) => ({
            language: l.name || '',
            fluency: l.score || l.testName || undefined,
          }))
        : undefined,
    meta: {
      canonical: options.canonical,
      version: 'v1.0.0',
      lastModified: new Date().toISOString(),
    },
  };

  // 빈 배열은 omit (JSON Resume 표준은 optional)
  if (!schema.work?.length) delete schema.work;
  if (!schema.education?.length) delete schema.education;
  if (!schema.skills?.length) delete schema.skills;
  if (!schema.projects?.length) delete schema.projects;

  return schema;
}

export function downloadJsonResume(resume: Resume, options: { canonical?: string } = {}): void {
  const schema = buildJsonResume(resume, options);
  const json = JSON.stringify(schema, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (resume.personalInfo.name || resume.title || 'resume').replace(
    /[^a-zA-Z0-9가-힣_-]/g,
    '_',
  );
  a.href = url;
  a.download = `${safeName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function normalizeDate(date: string | undefined): string | undefined {
  if (!date) return undefined;
  // 'YYYY' | 'YYYY-MM' | 'YYYY-MM-DD' 모두 유효
  return date.trim() || undefined;
}

function stripHtml(html: string | undefined): string | undefined {
  if (!html) return undefined;
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
  return text || undefined;
}

function splitBullets(text: string): string[] {
  return text
    .split(/[\n•·\-—]\s*/)
    .map((s) => stripHtml(s) || '')
    .filter((s) => s.length > 3);
}

function inferNetworkFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    if (host.includes('github.com')) return 'GitHub';
    if (host.includes('linkedin.com')) return 'LinkedIn';
    if (host.includes('twitter.com') || host.includes('x.com')) return 'Twitter';
    if (host.includes('medium.com')) return 'Medium';
    if (host.includes('velog.io')) return 'Velog';
    if (host.includes('tistory.com')) return 'Tistory';
    if (host.includes('notion.')) return 'Notion';
    if (host.includes('dev.to')) return 'DEV';
    if (host.includes('behance.net')) return 'Behance';
    if (host.includes('dribbble.com')) return 'Dribbble';
    return host.split('.')[0];
  } catch {
    return null;
  }
}
