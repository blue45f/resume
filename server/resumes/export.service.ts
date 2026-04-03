import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  async exportAsText(resumeId: string): Promise<string> {
    const resume = await this.getResumeData(resumeId);
    const lines: string[] = [];
    const pi = resume.personalInfo;

    if (pi) {
      lines.push(pi.name || '');
      const contacts = [pi.email, pi.phone, pi.address].filter(Boolean);
      if (contacts.length) lines.push(contacts.join(' | '));
      if (pi.website) lines.push(pi.website);
      if (pi.github) lines.push(pi.github);
      lines.push('');
      if (pi.summary) lines.push(pi.summary.replace(/<[^>]*>/g, ''), '');
    }

    if (resume.experiences?.length) {
      lines.push('=== 경력 ===');
      for (const exp of resume.experiences) {
        lines.push(`${exp.company} | ${exp.position} (${exp.startDate} ~ ${exp.current ? '현재' : exp.endDate})`);
        if (exp.description) lines.push(exp.description.replace(/<[^>]*>/g, ''));
        lines.push('');
      }
    }

    if (resume.educations?.length) {
      lines.push('=== 학력 ===');
      for (const edu of resume.educations) {
        lines.push(`${edu.school} | ${edu.degree} ${edu.field} (${edu.startDate} ~ ${edu.endDate})`);
        lines.push('');
      }
    }

    if (resume.skills?.length) {
      lines.push('=== 기술 ===');
      for (const s of resume.skills) lines.push(`${s.category}: ${s.items}`);
      lines.push('');
    }

    if (resume.projects?.length) {
      lines.push('=== 프로젝트 ===');
      for (const p of resume.projects) {
        lines.push(`${p.name}${p.company ? ` @ ${p.company}` : ''} (${p.startDate} ~ ${p.endDate})`);
        if (p.description) lines.push(p.description.replace(/<[^>]*>/g, ''));
        lines.push('');
      }
    }

    if (resume.certifications?.length) {
      lines.push('=== 자격증 ===');
      for (const c of resume.certifications) lines.push(`${c.name} - ${c.issuer} (${c.issueDate})`);
      lines.push('');
    }

    if (resume.languages?.length) {
      lines.push('=== 어학 ===');
      for (const l of resume.languages) lines.push(`${l.name}${l.testName ? ` (${l.testName})` : ''}: ${l.score}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  async exportAsMarkdown(resumeId: string): Promise<string> {
    const resume = await this.getResumeData(resumeId);
    const lines: string[] = [];
    const pi = resume.personalInfo;

    if (pi) {
      lines.push(`# ${pi.name || '이력서'}`);
      const contacts = [pi.email, pi.phone, pi.address].filter(Boolean);
      if (contacts.length) lines.push(contacts.join(' | '));
      if (pi.website) lines.push(`[Website](${pi.website})`);
      lines.push('');
      if (pi.summary) lines.push(pi.summary.replace(/<[^>]*>/g, ''), '');
    }

    if (resume.experiences?.length) {
      lines.push('## 경력\n');
      for (const exp of resume.experiences) {
        lines.push(`### ${exp.company} — ${exp.position}`);
        lines.push(`*${exp.startDate} ~ ${exp.current ? '현재' : exp.endDate}*\n`);
        if (exp.description) lines.push(exp.description.replace(/<[^>]*>/g, ''), '');
      }
    }

    if (resume.educations?.length) {
      lines.push('## 학력\n');
      for (const edu of resume.educations) {
        lines.push(`### ${edu.school}`);
        lines.push(`*${edu.degree} ${edu.field} (${edu.startDate} ~ ${edu.endDate})*\n`);
      }
    }

    if (resume.skills?.length) {
      lines.push('## 기술\n');
      for (const s of resume.skills) lines.push(`- **${s.category}**: ${s.items}`);
      lines.push('');
    }

    if (resume.projects?.length) {
      lines.push('## 프로젝트\n');
      for (const p of resume.projects) {
        lines.push(`### ${p.name}`);
        lines.push(`*${p.startDate} ~ ${p.endDate}*\n`);
        if (p.description) lines.push(p.description.replace(/<[^>]*>/g, ''), '');
      }
    }

    if (resume.certifications?.length) {
      lines.push('## 자격증\n');
      for (const c of resume.certifications) lines.push(`- **${c.name}** — ${c.issuer} (${c.issueDate})`);
      lines.push('');
    }

    return lines.join('\n');
  }

  async exportAsJson(resumeId: string): Promise<string> {
    const resume = await this.getResumeData(resumeId);
    return JSON.stringify(resume, null, 2);
  }

  private async getResumeData(resumeId: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        personalInfo: true,
        experiences: { orderBy: { sortOrder: 'asc' } },
        educations: { orderBy: { sortOrder: 'asc' } },
        skills: { orderBy: { sortOrder: 'asc' } },
        projects: { orderBy: { sortOrder: 'asc' } },
        certifications: { orderBy: { sortOrder: 'asc' } },
        languages: { orderBy: { sortOrder: 'asc' } },
        awards: { orderBy: { sortOrder: 'asc' } },
        activities: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!resume) throw new NotFoundException('이력서를 찾을 수 없습니다');
    return resume;
  }
}
