import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType,
  convertInchesToTwip, UnderlineType,
} from 'docx';

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

  async exportAsDocx(resumeId: string): Promise<Buffer> {
    const resume = await this.getResumeData(resumeId);
    const pi = resume.personalInfo;
    const strip = (html: string) => (html || '').replace(/<[^>]*>/g, '').trim();

    const accentColor = '1F4E79';
    const grayColor = '666666';
    const dividerColor = 'BFBFBF';

    const sectionHeading = (title: string) =>
      new Paragraph({
        children: [
          new TextRun({ text: title, bold: true, color: accentColor, size: 22 }),
        ],
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 4, color: dividerColor, space: 4 },
        },
        spacing: { before: 280, after: 120 },
      });

    const subHeading = (text: string) =>
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 20 })],
        spacing: { before: 160, after: 40 },
      });

    const metaLine = (text: string) =>
      new Paragraph({
        children: [new TextRun({ text, color: grayColor, size: 18, italics: true })],
        spacing: { after: 60 },
      });

    const bodyParagraph = (text: string) =>
      new Paragraph({
        children: [new TextRun({ text, size: 18 })],
        spacing: { after: 60 },
      });

    const sections: Paragraph[] = [];

    // ── Header ──
    if (pi) {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: pi.name || '이력서', bold: true, size: 40, color: accentColor })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
        }),
      );

      const contactParts: string[] = [];
      if (pi.email) contactParts.push(pi.email);
      if (pi.phone) contactParts.push(pi.phone);
      if (pi.address) contactParts.push(pi.address);
      if (pi.website) contactParts.push(pi.website);
      if (pi.github) contactParts.push(pi.github);

      if (contactParts.length) {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: contactParts.join('  |  '), color: grayColor, size: 18 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
        );
      }

      if (pi.summary) {
        sections.push(
          sectionHeading('요약'),
          bodyParagraph(strip(pi.summary)),
        );
      }
    }

    // ── Experience ──
    if (resume.experiences?.length) {
      sections.push(sectionHeading('경력'));
      for (const exp of resume.experiences) {
        sections.push(
          subHeading(`${exp.company}  —  ${exp.position}${exp.department ? ` · ${exp.department}` : ''}`),
          metaLine(`${exp.startDate} ~ ${exp.current ? '현재' : exp.endDate}`),
        );
        if (strip(exp.description)) sections.push(bodyParagraph(strip(exp.description)));
        if (exp.achievements && strip(exp.achievements)) sections.push(bodyParagraph(`[성과] ${strip(exp.achievements)}`));
        if (exp.techStack) sections.push(bodyParagraph(`[기술] ${exp.techStack}`));
      }
    }

    // ── Education ──
    if (resume.educations?.length) {
      sections.push(sectionHeading('학력'));
      for (const edu of resume.educations) {
        sections.push(
          subHeading(`${edu.school}  —  ${edu.degree} ${edu.field}`),
          metaLine(`${edu.startDate} ~ ${edu.endDate}${edu.gpa ? `  |  GPA: ${edu.gpa}` : ''}`),
        );
        if (strip(edu.description)) sections.push(bodyParagraph(strip(edu.description)));
      }
    }

    // ── Skills ──
    if (resume.skills?.length) {
      sections.push(sectionHeading('기술'));
      for (const s of resume.skills) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${s.category}: `, bold: true, size: 18 }),
              new TextRun({ text: s.items, size: 18 }),
            ],
            spacing: { after: 60 },
          }),
        );
      }
    }

    // ── Projects ──
    if (resume.projects?.length) {
      sections.push(sectionHeading('프로젝트'));
      for (const p of resume.projects) {
        sections.push(
          subHeading(`${p.name}${p.company ? `  @  ${p.company}` : ''}`),
          metaLine(`${p.startDate} ~ ${p.endDate}${p.role ? `  |  역할: ${p.role}` : ''}`),
        );
        if (strip(p.description)) sections.push(bodyParagraph(strip(p.description)));
        if (p.techStack) sections.push(bodyParagraph(`[기술스택] ${p.techStack}`));
        if (p.link) sections.push(bodyParagraph(`[링크] ${p.link}`));
      }
    }

    // ── Certifications ──
    if (resume.certifications?.length) {
      sections.push(sectionHeading('자격증'));
      for (const c of resume.certifications) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${c.name}`, bold: true, size: 18 }),
              new TextRun({ text: `  —  ${c.issuer}  (${c.issueDate})`, color: grayColor, size: 18 }),
            ],
            spacing: { after: 60 },
          }),
        );
        if (c.credentialId) sections.push(bodyParagraph(`ID: ${c.credentialId}`));
      }
    }

    // ── Languages ──
    if (resume.languages?.length) {
      sections.push(sectionHeading('어학'));
      for (const l of resume.languages) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${l.name}`, bold: true, size: 18 }),
              new TextRun({ text: `${l.testName ? `  (${l.testName})` : ''}:  ${l.score}`, size: 18 }),
            ],
            spacing: { after: 60 },
          }),
        );
      }
    }

    // ── Awards ──
    if ((resume as any).awards?.length) {
      sections.push(sectionHeading('수상'));
      for (const a of (resume as any).awards) {
        sections.push(
          subHeading(`${a.name}  —  ${a.issuer}`),
          metaLine(a.awardDate || ''),
        );
        if (a.description && strip(a.description)) sections.push(bodyParagraph(strip(a.description)));
      }
    }

    // ── Activities ──
    if ((resume as any).activities?.length) {
      sections.push(sectionHeading('활동'));
      for (const a of (resume as any).activities) {
        sections.push(
          subHeading(`${a.name}  —  ${a.organization}${a.role ? ` · ${a.role}` : ''}`),
          metaLine(`${a.startDate} ~ ${a.endDate}`),
        );
        if (a.description && strip(a.description)) sections.push(bodyParagraph(strip(a.description)));
      }
    }

    const doc = new Document({
      creator: 'Resume Platform',
      title: resume.title || '이력서',
      description: `${pi?.name || ''} 이력서`,
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(0.9),
                right: convertInchesToTwip(1.0),
                bottom: convertInchesToTwip(0.9),
                left: convertInchesToTwip(1.0),
              },
            },
          },
          children: sections,
        },
      ],
    });

    return await Packer.toBuffer(doc);
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
