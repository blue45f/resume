"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const docx_1 = require("docx");
let ExportService = class ExportService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async exportAsText(resumeId) {
        const resume = await this.getResumeData(resumeId);
        const lines = [];
        const pi = resume.personalInfo;
        if (pi) {
            lines.push(pi.name || '');
            const contacts = [pi.email, pi.phone, pi.address].filter(Boolean);
            if (contacts.length)
                lines.push(contacts.join(' | '));
            if (pi.website)
                lines.push(pi.website);
            if (pi.github)
                lines.push(pi.github);
            lines.push('');
            if (pi.summary)
                lines.push(pi.summary.replace(/<[^>]*>/g, ''), '');
        }
        if (resume.experiences?.length) {
            lines.push('=== 경력 ===');
            for (const exp of resume.experiences) {
                lines.push(`${exp.company} | ${exp.position} (${exp.startDate} ~ ${exp.current ? '현재' : exp.endDate})`);
                if (exp.description)
                    lines.push(exp.description.replace(/<[^>]*>/g, ''));
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
            for (const s of resume.skills)
                lines.push(`${s.category}: ${s.items}`);
            lines.push('');
        }
        if (resume.projects?.length) {
            lines.push('=== 프로젝트 ===');
            for (const p of resume.projects) {
                lines.push(`${p.name}${p.company ? ` @ ${p.company}` : ''} (${p.startDate} ~ ${p.endDate})`);
                if (p.description)
                    lines.push(p.description.replace(/<[^>]*>/g, ''));
                lines.push('');
            }
        }
        if (resume.certifications?.length) {
            lines.push('=== 자격증 ===');
            for (const c of resume.certifications)
                lines.push(`${c.name} - ${c.issuer} (${c.issueDate})`);
            lines.push('');
        }
        if (resume.languages?.length) {
            lines.push('=== 어학 ===');
            for (const l of resume.languages)
                lines.push(`${l.name}${l.testName ? ` (${l.testName})` : ''}: ${l.score}`);
            lines.push('');
        }
        return lines.join('\n');
    }
    async exportAsMarkdown(resumeId) {
        const resume = await this.getResumeData(resumeId);
        const lines = [];
        const pi = resume.personalInfo;
        if (pi) {
            lines.push(`# ${pi.name || '이력서'}`);
            const contacts = [pi.email, pi.phone, pi.address].filter(Boolean);
            if (contacts.length)
                lines.push(contacts.join(' | '));
            if (pi.website)
                lines.push(`[Website](${pi.website})`);
            lines.push('');
            if (pi.summary)
                lines.push(pi.summary.replace(/<[^>]*>/g, ''), '');
        }
        if (resume.experiences?.length) {
            lines.push('## 경력\n');
            for (const exp of resume.experiences) {
                lines.push(`### ${exp.company} — ${exp.position}`);
                lines.push(`*${exp.startDate} ~ ${exp.current ? '현재' : exp.endDate}*\n`);
                if (exp.description)
                    lines.push(exp.description.replace(/<[^>]*>/g, ''), '');
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
            for (const s of resume.skills)
                lines.push(`- **${s.category}**: ${s.items}`);
            lines.push('');
        }
        if (resume.projects?.length) {
            lines.push('## 프로젝트\n');
            for (const p of resume.projects) {
                lines.push(`### ${p.name}`);
                lines.push(`*${p.startDate} ~ ${p.endDate}*\n`);
                if (p.description)
                    lines.push(p.description.replace(/<[^>]*>/g, ''), '');
            }
        }
        if (resume.certifications?.length) {
            lines.push('## 자격증\n');
            for (const c of resume.certifications)
                lines.push(`- **${c.name}** — ${c.issuer} (${c.issueDate})`);
            lines.push('');
        }
        return lines.join('\n');
    }
    async exportAsJson(resumeId) {
        const resume = await this.getResumeData(resumeId);
        return JSON.stringify(resume, null, 2);
    }
    async exportAsDocx(resumeId) {
        const resume = await this.getResumeData(resumeId);
        const pi = resume.personalInfo;
        const strip = (html) => (html || '').replace(/<[^>]*>/g, '').trim();
        const accentColor = '1F4E79';
        const grayColor = '666666';
        const dividerColor = 'BFBFBF';
        const sectionHeading = (title) => new docx_1.Paragraph({
            children: [
                new docx_1.TextRun({ text: title, bold: true, color: accentColor, size: 22 }),
            ],
            border: {
                bottom: { style: docx_1.BorderStyle.SINGLE, size: 4, color: dividerColor, space: 4 },
            },
            spacing: { before: 280, after: 120 },
        });
        const subHeading = (text) => new docx_1.Paragraph({
            children: [new docx_1.TextRun({ text, bold: true, size: 20 })],
            spacing: { before: 160, after: 40 },
        });
        const metaLine = (text) => new docx_1.Paragraph({
            children: [new docx_1.TextRun({ text, color: grayColor, size: 18, italics: true })],
            spacing: { after: 60 },
        });
        const bodyParagraph = (text) => new docx_1.Paragraph({
            children: [new docx_1.TextRun({ text, size: 18 })],
            spacing: { after: 60 },
        });
        const sections = [];
        if (pi) {
            sections.push(new docx_1.Paragraph({
                children: [new docx_1.TextRun({ text: pi.name || '이력서', bold: true, size: 40, color: accentColor })],
                alignment: docx_1.AlignmentType.CENTER,
                spacing: { after: 80 },
            }));
            const contactParts = [];
            if (pi.email)
                contactParts.push(pi.email);
            if (pi.phone)
                contactParts.push(pi.phone);
            if (pi.address)
                contactParts.push(pi.address);
            if (pi.website)
                contactParts.push(pi.website);
            if (pi.github)
                contactParts.push(pi.github);
            if (contactParts.length) {
                sections.push(new docx_1.Paragraph({
                    children: [new docx_1.TextRun({ text: contactParts.join('  |  '), color: grayColor, size: 18 })],
                    alignment: docx_1.AlignmentType.CENTER,
                    spacing: { after: 200 },
                }));
            }
            if (pi.summary) {
                sections.push(sectionHeading('요약'), bodyParagraph(strip(pi.summary)));
            }
        }
        if (resume.experiences?.length) {
            sections.push(sectionHeading('경력'));
            for (const exp of resume.experiences) {
                sections.push(subHeading(`${exp.company}  —  ${exp.position}${exp.department ? ` · ${exp.department}` : ''}`), metaLine(`${exp.startDate} ~ ${exp.current ? '현재' : exp.endDate}`));
                if (strip(exp.description))
                    sections.push(bodyParagraph(strip(exp.description)));
                if (exp.achievements && strip(exp.achievements))
                    sections.push(bodyParagraph(`[성과] ${strip(exp.achievements)}`));
                if (exp.techStack)
                    sections.push(bodyParagraph(`[기술] ${exp.techStack}`));
            }
        }
        if (resume.educations?.length) {
            sections.push(sectionHeading('학력'));
            for (const edu of resume.educations) {
                sections.push(subHeading(`${edu.school}  —  ${edu.degree} ${edu.field}`), metaLine(`${edu.startDate} ~ ${edu.endDate}${edu.gpa ? `  |  GPA: ${edu.gpa}` : ''}`));
                if (strip(edu.description))
                    sections.push(bodyParagraph(strip(edu.description)));
            }
        }
        if (resume.skills?.length) {
            sections.push(sectionHeading('기술'));
            for (const s of resume.skills) {
                sections.push(new docx_1.Paragraph({
                    children: [
                        new docx_1.TextRun({ text: `${s.category}: `, bold: true, size: 18 }),
                        new docx_1.TextRun({ text: s.items, size: 18 }),
                    ],
                    spacing: { after: 60 },
                }));
            }
        }
        if (resume.projects?.length) {
            sections.push(sectionHeading('프로젝트'));
            for (const p of resume.projects) {
                sections.push(subHeading(`${p.name}${p.company ? `  @  ${p.company}` : ''}`), metaLine(`${p.startDate} ~ ${p.endDate}${p.role ? `  |  역할: ${p.role}` : ''}`));
                if (strip(p.description))
                    sections.push(bodyParagraph(strip(p.description)));
                if (p.techStack)
                    sections.push(bodyParagraph(`[기술스택] ${p.techStack}`));
                if (p.link)
                    sections.push(bodyParagraph(`[링크] ${p.link}`));
            }
        }
        if (resume.certifications?.length) {
            sections.push(sectionHeading('자격증'));
            for (const c of resume.certifications) {
                sections.push(new docx_1.Paragraph({
                    children: [
                        new docx_1.TextRun({ text: `${c.name}`, bold: true, size: 18 }),
                        new docx_1.TextRun({ text: `  —  ${c.issuer}  (${c.issueDate})`, color: grayColor, size: 18 }),
                    ],
                    spacing: { after: 60 },
                }));
                if (c.credentialId)
                    sections.push(bodyParagraph(`ID: ${c.credentialId}`));
            }
        }
        if (resume.languages?.length) {
            sections.push(sectionHeading('어학'));
            for (const l of resume.languages) {
                sections.push(new docx_1.Paragraph({
                    children: [
                        new docx_1.TextRun({ text: `${l.name}`, bold: true, size: 18 }),
                        new docx_1.TextRun({ text: `${l.testName ? `  (${l.testName})` : ''}:  ${l.score}`, size: 18 }),
                    ],
                    spacing: { after: 60 },
                }));
            }
        }
        if (resume.awards?.length) {
            sections.push(sectionHeading('수상'));
            for (const a of resume.awards) {
                sections.push(subHeading(`${a.name}  —  ${a.issuer}`), metaLine(a.awardDate || ''));
                if (a.description && strip(a.description))
                    sections.push(bodyParagraph(strip(a.description)));
            }
        }
        if (resume.activities?.length) {
            sections.push(sectionHeading('활동'));
            for (const a of resume.activities) {
                sections.push(subHeading(`${a.name}  —  ${a.organization}${a.role ? ` · ${a.role}` : ''}`), metaLine(`${a.startDate} ~ ${a.endDate}`));
                if (a.description && strip(a.description))
                    sections.push(bodyParagraph(strip(a.description)));
            }
        }
        const doc = new docx_1.Document({
            creator: 'Resume Platform',
            title: resume.title || '이력서',
            description: `${pi?.name || ''} 이력서`,
            sections: [
                {
                    properties: {
                        page: {
                            margin: {
                                top: (0, docx_1.convertInchesToTwip)(0.9),
                                right: (0, docx_1.convertInchesToTwip)(1.0),
                                bottom: (0, docx_1.convertInchesToTwip)(0.9),
                                left: (0, docx_1.convertInchesToTwip)(1.0),
                            },
                        },
                    },
                    children: sections,
                },
            ],
        });
        return await docx_1.Packer.toBuffer(doc);
    }
    async getResumeData(resumeId) {
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
        if (!resume)
            throw new common_1.NotFoundException('이력서를 찾을 수 없습니다');
        return resume;
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExportService);
