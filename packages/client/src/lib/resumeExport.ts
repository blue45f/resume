import type { Resume } from '@/types/resume';

/**
 * 이력서를 ATS 파서가 잘 읽는 plain text 로 직렬화.
 * - 모든 HTML 태그 제거
 * - 섹션 구분을 명확히 (=== ===)
 * - 특수문자·이모지 최소화
 * - 날짜 형식 통일 YYYY-MM
 */
export function buildPlainText(resume: Resume): string {
  const p = resume.personalInfo;
  const lines: string[] = [];

  // Header
  if (p.name) lines.push(p.name);
  if (p.email) lines.push(p.email);
  if (p.phone) lines.push(p.phone);
  if (p.address) lines.push(p.address);
  if (p.website) lines.push(p.website);
  if (p.github) lines.push(`GitHub: https://github.com/${p.github}`);
  lines.push('');

  // Summary
  if (p.summary) {
    lines.push('=== SUMMARY ===');
    lines.push(stripHtml(p.summary));
    lines.push('');
  }

  // Experience
  if (resume.experiences.length > 0) {
    lines.push('=== EXPERIENCE ===');
    for (const e of resume.experiences) {
      const range = formatRange(e.startDate, e.endDate, e.current);
      const header = [range, e.company, e.position, e.department].filter(Boolean).join(' | ');
      if (header) lines.push(header);
      if (e.description) {
        lines.push(stripHtml(e.description));
      }
      if (e.achievements) {
        for (const b of splitBullets(e.achievements)) {
          lines.push(`- ${b}`);
        }
      }
      if (e.techStack) lines.push(`Tech: ${e.techStack}`);
      lines.push('');
    }
  }

  // Education
  if (resume.educations.length > 0) {
    lines.push('=== EDUCATION ===');
    for (const ed of resume.educations) {
      const range = formatRange(ed.startDate, ed.endDate, false);
      const header = [range, ed.school, ed.degree, ed.field].filter(Boolean).join(' | ');
      if (header) lines.push(header);
      if (ed.gpa) lines.push(`GPA: ${ed.gpa}`);
      if (ed.description) lines.push(stripHtml(ed.description));
      lines.push('');
    }
  }

  // Skills
  if (resume.skills.length > 0) {
    lines.push('=== SKILLS ===');
    for (const s of resume.skills) {
      lines.push(`${s.category || 'Skills'}: ${s.items}`);
    }
    lines.push('');
  }

  // Projects
  if (resume.projects.length > 0) {
    lines.push('=== PROJECTS ===');
    for (const proj of resume.projects) {
      const header = [proj.name, proj.company].filter(Boolean).join(' | ');
      if (header) lines.push(header);
      if (proj.description) lines.push(stripHtml(proj.description));
      if (proj.techStack) lines.push(`Tech: ${proj.techStack}`);
      lines.push('');
    }
  }

  // Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    lines.push('=== CERTIFICATIONS ===');
    for (const c of resume.certifications) {
      lines.push([c.issueDate, c.name, c.issuer].filter(Boolean).join(' | '));
    }
    lines.push('');
  }

  // Awards
  if (resume.awards && resume.awards.length > 0) {
    lines.push('=== AWARDS ===');
    for (const a of resume.awards) {
      lines.push([a.awardDate, a.name, a.issuer].filter(Boolean).join(' | '));
      if (a.description) lines.push(stripHtml(a.description));
    }
    lines.push('');
  }

  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * GitHub README / dev.to / Notion 등에 붙여넣을 수 있는 Markdown 으로 변환.
 */
export function buildMarkdown(resume: Resume): string {
  const p = resume.personalInfo;
  const lines: string[] = [];

  // H1 이름
  if (p.name) lines.push(`# ${p.name}`);
  lines.push('');

  // 연락처 · 링크 인라인
  const contact: string[] = [];
  if (p.email) contact.push(`📧 [${p.email}](mailto:${p.email})`);
  if (p.phone) contact.push(`📱 ${p.phone}`);
  if (p.website) contact.push(`🌐 [웹사이트](${p.website})`);
  if (p.github) contact.push(`💻 [GitHub](https://github.com/${p.github})`);
  if (contact.length) {
    lines.push(contact.join(' · '));
    lines.push('');
  }

  if (p.summary) {
    lines.push(`> ${stripHtml(p.summary).replace(/\n/g, ' ')}`);
    lines.push('');
  }

  if (resume.experiences.length > 0) {
    lines.push('## 경력');
    lines.push('');
    for (const e of resume.experiences) {
      const range = formatRange(e.startDate, e.endDate, e.current);
      lines.push(`### ${e.company || ''} — ${e.position || ''}`);
      lines.push(`_${range}${e.department ? ` · ${e.department}` : ''}_`);
      lines.push('');
      if (e.description) {
        lines.push(stripHtml(e.description));
        lines.push('');
      }
      if (e.achievements) {
        for (const b of splitBullets(e.achievements)) {
          lines.push(`- ${b}`);
        }
        lines.push('');
      }
      if (e.techStack) {
        const stack = e.techStack
          .split(',')
          .map((t) => `\`${t.trim()}\``)
          .filter(Boolean)
          .join(' ');
        lines.push(`**Tech:** ${stack}`);
        lines.push('');
      }
    }
  }

  if (resume.educations.length > 0) {
    lines.push('## 학력');
    lines.push('');
    for (const ed of resume.educations) {
      const range = formatRange(ed.startDate, ed.endDate, false);
      const header = [ed.school, ed.degree, ed.field].filter(Boolean).join(' · ');
      lines.push(`- **${header}** _(${range})_${ed.gpa ? ` · GPA ${ed.gpa}` : ''}`);
    }
    lines.push('');
  }

  if (resume.skills.length > 0) {
    lines.push('## 기술 스택');
    lines.push('');
    for (const s of resume.skills) {
      const items = s.items
        .split(',')
        .map((x) => `\`${x.trim()}\``)
        .filter((v) => v.length > 2)
        .join(' ');
      lines.push(`- **${s.category || 'Skills'}:** ${items}`);
    }
    lines.push('');
  }

  if (resume.projects.length > 0) {
    lines.push('## 프로젝트');
    lines.push('');
    for (const proj of resume.projects) {
      lines.push(`### ${proj.name || ''}`);
      if (proj.company) lines.push(`_${proj.company}_`);
      if (proj.description) lines.push(stripHtml(proj.description));
      if (proj.techStack) {
        const stack = proj.techStack
          .split(',')
          .map((t) => `\`${t.trim()}\``)
          .join(' ');
        lines.push(`**Tech:** ${stack}`);
      }
      lines.push('');
    }
  }

  if (resume.certifications && resume.certifications.length > 0) {
    lines.push('## 자격증');
    lines.push('');
    for (const c of resume.certifications) {
      lines.push(`- **${c.name}** _(${c.issuer}, ${c.issueDate})_`);
    }
    lines.push('');
  }

  if (resume.awards && resume.awards.length > 0) {
    lines.push('## 수상');
    lines.push('');
    for (const a of resume.awards) {
      lines.push(`- **${a.name}** _(${a.issuer}, ${a.awardDate})_`);
    }
    lines.push('');
  }

  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function copyPlainText(resume: Resume): Promise<void> {
  await navigator.clipboard.writeText(buildPlainText(resume));
}

export async function copyMarkdown(resume: Resume): Promise<void> {
  await navigator.clipboard.writeText(buildMarkdown(resume));
}

function stripHtml(html: string | undefined): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

function formatRange(start: string, end: string, current: boolean): string {
  if (!start) return '';
  if (current) return `${start} ~ 현재`;
  if (!end) return start;
  return `${start} ~ ${end}`;
}

function splitBullets(text: string): string[] {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .split(/\n|[•·\-—]\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}
