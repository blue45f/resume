import { Injectable } from '@nestjs/common'

/**
 * LLM 없이 이력서 데이터를 구조적으로 변환하는 서비스.
 * 레이아웃 설정에 따라 섹션 순서 변경, 필터링, 마크다운/텍스트 변환을 수행.
 */

export interface LayoutConfig {
  sections: string[] // 표시할 섹션 순서
  dateFormat?: 'dot' | 'dash' | 'text' // 2024.03 / 2024-03 / 2024년 3월
  nameFirst?: boolean // 이름을 먼저 표시
  includePhoto?: boolean
  style?: 'formal' | 'modern' | 'minimal' | 'creative'
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
  'activities',
]

type PersonalInfoSection = {
  name?: string
  email?: string
  phone?: string
  address?: string
  website?: string
  summary?: string
}

type ExperienceSection = {
  company?: string
  position?: string
  startDate?: string
  endDate?: string
  current?: boolean
  description?: string
}

type EducationSection = {
  school?: string
  field?: string
  degree?: string
  startDate?: string
  endDate?: string
  description?: string
}

type SkillSection = { category?: string; items?: string }
type ProjectSection = {
  name?: string
  role?: string
  startDate?: string
  endDate?: string
  description?: string
  link?: string
}
type CertificationSection = {
  name?: string
  issuer?: string
  issueDate?: string
  expiryDate?: string
  credentialId?: string
  description?: string
}
type LanguageSection = { name?: string; testName?: string; score?: string; testDate?: string }
type AwardSection = { name?: string; issuer?: string; awardDate?: string; description?: string }
type ActivitySection = {
  name?: string
  organization?: string
  role?: string
  startDate?: string
  endDate?: string
  description?: string
}

type TransformResume = {
  personalInfo?: PersonalInfoSection | null
  experiences?: ExperienceSection[]
  educations?: EducationSection[]
  skills?: SkillSection[]
  projects?: ProjectSection[]
  certifications?: CertificationSection[]
  languages?: LanguageSection[]
  awards?: AwardSection[]
  activities?: ActivitySection[]
}

@Injectable()
export class LocalTransformService {
  /**
   * 이력서 데이터를 레이아웃에 따라 마크다운으로 변환 (LLM 불필요)
   */
  transform(resume: TransformResume, layout: LayoutConfig): string {
    const sections = layout.sections?.length ? layout.sections : DEFAULT_SECTIONS
    const fmt = layout.dateFormat || 'dot'
    const lines: string[] = []

    for (const section of sections) {
      const content = this.renderSection(resume, section, fmt)
      if (content) lines.push(content)
    }

    return lines.join('\n\n')
  }

  /**
   * 미리 정의된 형식으로 빠르게 변환
   */
  transformByPreset(resume: TransformResume, preset: string): string {
    const presets: Record<string, LayoutConfig> = {
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
          'activities',
        ],
        dateFormat: 'dot',
        style: 'formal',
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
          'languages',
        ],
        dateFormat: 'dot',
        style: 'modern',
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
          'awards',
        ],
        dateFormat: 'dot',
        style: 'formal',
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
          'activities',
        ],
        dateFormat: 'text',
        style: 'formal',
      },
      minimal: {
        sections: ['personalInfo', 'summary', 'experiences', 'skills', 'educations'],
        dateFormat: 'dash',
        style: 'minimal',
      },
    }

    const config = presets[preset] || presets['standard']
    return this.transform(resume, config)
  }

  private renderSection(resume: TransformResume, section: string, fmt: string): string {
    switch (section) {
      case 'personalInfo':
        return this.renderPersonalInfo(resume.personalInfo)
      case 'summary':
        return resume.personalInfo?.summary ? `## 자기소개\n\n${resume.personalInfo.summary}` : ''
      case 'experiences':
        return this.renderList(
          '경력',
          resume.experiences,
          (e) =>
            `**${e.company}** | ${e.position}\n${this.fmtDate(e.startDate, fmt)} — ${e.current ? '현재' : this.fmtDate(e.endDate, fmt)}${e.description ? '\n' + e.description : ''}`
        )
      case 'educations':
        return this.renderList(
          '학력',
          resume.educations,
          (e) =>
            `**${e.school}** | ${e.field ? e.field + ' ' : ''}${e.degree}\n${this.fmtDate(e.startDate, fmt)} — ${this.fmtDate(e.endDate, fmt)}${e.description ? '\n' + e.description : ''}`
        )
      case 'skills':
        return this.renderList('기술', resume.skills, (s) => `**${s.category}**: ${s.items}`)
      case 'projects':
        return this.renderList(
          '프로젝트',
          resume.projects,
          (p) =>
            `**${p.name}**${p.role ? ' | ' + p.role : ''}\n${this.fmtDate(p.startDate, fmt)} — ${this.fmtDate(p.endDate, fmt)}${p.description ? '\n' + p.description : ''}${p.link ? '\n' + p.link : ''}`
        )
      case 'certifications':
        return this.renderList(
          '자격증',
          resume.certifications,
          (c) =>
            `**${c.name}** | ${c.issuer}\n${this.fmtDate(c.issueDate, fmt)}${c.expiryDate ? ' — ' + this.fmtDate(c.expiryDate, fmt) : ''}${c.credentialId ? ' (자격번호: ' + c.credentialId + ')' : ''}${c.description ? '\n' + c.description : ''}`
        )
      case 'languages':
        return this.renderList(
          '어학',
          resume.languages,
          (l) =>
            `**${l.name}**${l.testName ? ' | ' + l.testName : ''}${l.score ? ' — ' + l.score : ''}${l.testDate ? ' (' + this.fmtDate(l.testDate, fmt) + ')' : ''}`
        )
      case 'awards':
        return this.renderList(
          '수상 경력',
          resume.awards,
          (a) =>
            `**${a.name}** | ${a.issuer}\n${this.fmtDate(a.awardDate, fmt)}${a.description ? '\n' + a.description : ''}`
        )
      case 'activities':
        return this.renderList(
          '활동/봉사',
          resume.activities,
          (a) =>
            `**${a.name}**${a.organization ? ' | ' + a.organization : ''}${a.role ? ' (' + a.role + ')' : ''}\n${this.fmtDate(a.startDate, fmt)} — ${this.fmtDate(a.endDate, fmt)}${a.description ? '\n' + a.description : ''}`
        )
      default:
        return ''
    }
  }

  private renderPersonalInfo(pi?: PersonalInfoSection | null): string {
    if (!pi) return ''
    const parts = [pi.name && `# ${pi.name}`]
    const contacts = [pi.email, pi.phone, pi.address, pi.website].filter(Boolean)
    if (contacts.length) parts.push(contacts.join(' | '))
    return parts.filter(Boolean).join('\n\n')
  }

  private renderList<TItem>(
    title: string,
    items: TItem[] | undefined,
    render: (item: TItem) => string
  ): string {
    if (!items?.length) return ''
    return `## ${title}\n\n${items.map(render).join('\n\n')}`
  }

  private fmtDate(date: Date | string | null | undefined, fmt: string): string {
    if (!date) return ''
    const dateText = date instanceof Date ? date.toISOString().slice(0, 10) : date
    const parts = dateText.split('-')
    const [year, month, day] = parts
    if (!year) return dateText
    if (!month) return year
    switch (fmt) {
      case 'dot':
        return `${year}.${month}`
      case 'dash':
        return `${year}-${month}`
      case 'text':
        return `${year}년 ${parseInt(month)}월`
      case 'dot-day':
        return day ? `${year}.${month}.${day}` : `${year}.${month}`
      case 'dash-day':
        return day ? `${year}-${month}-${day}` : `${year}-${month}`
      case 'text-day':
        return day
          ? `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`
          : `${year}년 ${parseInt(month)}월`
      default:
        return `${year}.${month}`
    }
  }
}
