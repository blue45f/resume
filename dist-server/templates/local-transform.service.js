"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LocalTransformService", {
    enumerable: true,
    get: function() {
        return LocalTransformService;
    }
});
const _common = require("@nestjs/common");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
const DEFAULT_SECTIONS = [
    'personalInfo',
    'summary',
    'experiences',
    'educations',
    'skills',
    'projects',
    'certifications',
    'languages',
    'awards',
    'activities'
];
let LocalTransformService = class LocalTransformService {
    /**
   * 이력서 데이터를 레이아웃에 따라 마크다운으로 변환 (LLM 불필요)
   */ transform(resume, layout) {
        const sections = layout.sections?.length ? layout.sections : DEFAULT_SECTIONS;
        const fmt = layout.dateFormat || 'dot';
        const lines = [];
        for (const section of sections){
            const content = this.renderSection(resume, section, fmt);
            if (content) lines.push(content);
        }
        return lines.join('\n\n');
    }
    /**
   * 미리 정의된 형식으로 빠르게 변환
   */ transformByPreset(resume, preset) {
        const presets = {
            standard: {
                sections: [
                    'personalInfo',
                    'summary',
                    'experiences',
                    'educations',
                    'skills',
                    'certifications',
                    'languages',
                    'awards',
                    'projects',
                    'activities'
                ],
                dateFormat: 'dot',
                style: 'formal'
            },
            developer: {
                sections: [
                    'personalInfo',
                    'summary',
                    'skills',
                    'experiences',
                    'projects',
                    'certifications',
                    'educations',
                    'languages'
                ],
                dateFormat: 'dot',
                style: 'modern'
            },
            'career-focused': {
                sections: [
                    'personalInfo',
                    'summary',
                    'experiences',
                    'projects',
                    'skills',
                    'certifications',
                    'educations',
                    'awards'
                ],
                dateFormat: 'dot',
                style: 'formal'
            },
            academic: {
                sections: [
                    'personalInfo',
                    'summary',
                    'educations',
                    'awards',
                    'projects',
                    'certifications',
                    'experiences',
                    'languages',
                    'activities'
                ],
                dateFormat: 'text',
                style: 'formal'
            },
            minimal: {
                sections: [
                    'personalInfo',
                    'summary',
                    'experiences',
                    'skills',
                    'educations'
                ],
                dateFormat: 'dash',
                style: 'minimal'
            }
        };
        const config = presets[preset] || presets['standard'];
        return this.transform(resume, config);
    }
    renderSection(resume, section, fmt) {
        switch(section){
            case 'personalInfo':
                return this.renderPersonalInfo(resume.personalInfo);
            case 'summary':
                return resume.personalInfo?.summary ? `## 자기소개\n\n${resume.personalInfo.summary}` : '';
            case 'experiences':
                return this.renderList('경력', resume.experiences, (e)=>`**${e.company}** | ${e.position}\n${this.fmtDate(e.startDate, fmt)} — ${e.current ? '현재' : this.fmtDate(e.endDate, fmt)}${e.description ? '\n' + e.description : ''}`);
            case 'educations':
                return this.renderList('학력', resume.educations, (e)=>`**${e.school}** | ${e.field ? e.field + ' ' : ''}${e.degree}\n${this.fmtDate(e.startDate, fmt)} — ${this.fmtDate(e.endDate, fmt)}${e.description ? '\n' + e.description : ''}`);
            case 'skills':
                return this.renderList('기술', resume.skills, (s)=>`**${s.category}**: ${s.items}`);
            case 'projects':
                return this.renderList('프로젝트', resume.projects, (p)=>`**${p.name}**${p.role ? ' | ' + p.role : ''}\n${this.fmtDate(p.startDate, fmt)} — ${this.fmtDate(p.endDate, fmt)}${p.description ? '\n' + p.description : ''}${p.link ? '\n' + p.link : ''}`);
            case 'certifications':
                return this.renderList('자격증', resume.certifications, (c)=>`**${c.name}** | ${c.issuer}\n${this.fmtDate(c.issueDate, fmt)}${c.expiryDate ? ' — ' + this.fmtDate(c.expiryDate, fmt) : ''}${c.credentialId ? ' (자격번호: ' + c.credentialId + ')' : ''}${c.description ? '\n' + c.description : ''}`);
            case 'languages':
                return this.renderList('어학', resume.languages, (l)=>`**${l.name}**${l.testName ? ' | ' + l.testName : ''}${l.score ? ' — ' + l.score : ''}${l.testDate ? ' (' + this.fmtDate(l.testDate, fmt) + ')' : ''}`);
            case 'awards':
                return this.renderList('수상 경력', resume.awards, (a)=>`**${a.name}** | ${a.issuer}\n${this.fmtDate(a.awardDate, fmt)}${a.description ? '\n' + a.description : ''}`);
            case 'activities':
                return this.renderList('활동/봉사', resume.activities, (a)=>`**${a.name}**${a.organization ? ' | ' + a.organization : ''}${a.role ? ' (' + a.role + ')' : ''}\n${this.fmtDate(a.startDate, fmt)} — ${this.fmtDate(a.endDate, fmt)}${a.description ? '\n' + a.description : ''}`);
            default:
                return '';
        }
    }
    renderPersonalInfo(pi) {
        if (!pi) return '';
        const parts = [
            pi.name && `# ${pi.name}`
        ];
        const contacts = [
            pi.email,
            pi.phone,
            pi.address,
            pi.website
        ].filter(Boolean);
        if (contacts.length) parts.push(contacts.join(' | '));
        return parts.filter(Boolean).join('\n\n');
    }
    renderList(title, items, render) {
        if (!items?.length) return '';
        return `## ${title}\n\n${items.map(render).join('\n\n')}`;
    }
    fmtDate(date, fmt) {
        if (!date) return '';
        const parts = date.split('-');
        const [year, month, day] = parts;
        if (!year) return date;
        if (!month) return year;
        switch(fmt){
            case 'dot':
                return `${year}.${month}`;
            case 'dash':
                return `${year}-${month}`;
            case 'text':
                return `${year}년 ${parseInt(month)}월`;
            case 'dot-day':
                return day ? `${year}.${month}.${day}` : `${year}.${month}`;
            case 'dash-day':
                return day ? `${year}-${month}-${day}` : `${year}-${month}`;
            case 'text-day':
                return day ? `${year}년 ${parseInt(month)}월 ${parseInt(day)}일` : `${year}년 ${parseInt(month)}월`;
            default:
                return `${year}.${month}`;
        }
    }
};
LocalTransformService = _ts_decorate([
    (0, _common.Injectable)()
], LocalTransformService);
