import { forwardRef, memo } from 'react';
import type { Resume } from '@/types/resume';
import SafeHtml from '@/components/SafeHtml';
import { resumeThemes, type ResumeTheme } from '@/lib/resumeThemes';
import { t } from '@/lib/i18n';

interface Props {
  resume: Resume;
  themeId?: string;
}

function formatDate(date: string): string {
  if (!date) return '';
  const parts = date.split('-');
  if (parts.length === 3) return `${parts[0]}.${parts[1]}`;
  if (parts.length === 2) return `${parts[0]}.${parts[1]}`;
  return parts[0];
}


function TechTags({ text, color = 'slate' }: { text: string; color?: 'slate' | 'blue' }) {
  const bg = color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500';
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {text.split(',').map((tag, i) => (
        <span key={i} className={`px-1.5 py-0.5 text-xs rounded ${bg}`}>{tag.trim()}</span>
      ))}
    </div>
  );
}

const ResumePreview = forwardRef<HTMLDivElement, Props>(({ resume, themeId }, ref) => {
  const theme = resumeThemes.find(t => t.id === themeId) || resumeThemes[0];
  const { personalInfo: pi, experiences, educations, skills, projects, certifications, languages, awards, activities } = resume;
  const hasPhoto = !!pi.photo;

  return (
    <div ref={ref} className={`bg-white p-6 sm:p-10 max-w-[210mm] mx-auto shadow-lg print:shadow-none print:p-0 ${theme.bodyStyle} overflow-hidden`} style={{ fontFamily: theme.fontFamily }}>

      {/* ===== Header ===== */}
      <header className={theme.headerStyle}>
        <div className={hasPhoto ? 'flex gap-5' : ''}>
          {hasPhoto && (
            <img src={pi.photo} alt="" loading="lazy" decoding="async" className="w-[100px] h-[130px] object-cover rounded border border-slate-200 shrink-0 print:w-[90px] print:h-[117px]" />
          )}
          <div className="flex-1 min-w-0">
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              ['professional', 'startup', 'tech', 'creative', 'dark', 'portfolio'].includes(theme.id) ? 'text-white' : 'text-slate-900'
            }`}>{pi.name || '이름'}</h1>

            {/* 연락처 - 구분자로 명확히 분리 */}
            <div className="mt-2.5 space-y-1 text-sm">
              <div className={`flex flex-wrap items-center gap-x-1 gap-y-0.5 ${
                ['professional', 'startup', 'tech', 'creative', 'dark', 'portfolio'].includes(theme.id) ? 'text-white/80' : 'text-slate-600'
              }`}>
                {[
                  pi.email && { icon: '✉', text: pi.email },
                  pi.phone && { icon: '☎', text: pi.phone },
                  pi.address && { icon: '📍', text: pi.address },
                  pi.birthYear && { icon: '📅', text: `${pi.birthYear}년생` },
                ].filter(Boolean).map((item, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-slate-300 mx-1">|</span>}
                    <span className="text-xs print:hidden" aria-hidden="true">{(item as any).icon}</span>
                    <span>{(item as any).text}</span>
                  </span>
                ))}
              </div>

              {/* 웹사이트 / GitHub / 링크 */}
              {(pi.website || pi.github || (pi.links && pi.links.length > 0)) && (
                <div className={`flex flex-wrap items-center gap-x-1 gap-y-0.5 ${
                  ['professional', 'startup', 'tech', 'creative', 'dark', 'portfolio'].includes(theme.id) ? 'text-white/70' : ''
                }`}>
                  {pi.website && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <span className="text-xs print:hidden" aria-hidden="true">🔗</span>
                      <span className="break-all">{pi.website}</span>
                    </span>
                  )}
                  {pi.github && (
                    <span className="flex items-center gap-1">
                      {pi.website && <span className="text-slate-300 mx-1">|</span>}
                      <span className="text-xs print:hidden" aria-hidden="true">💻</span>
                      <span className="text-blue-600 break-all">{pi.github}</span>
                    </span>
                  )}
                  {pi.links?.map((link, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="text-slate-300 mx-1">|</span>
                      <span className="text-slate-500">{link.label}:</span>
                      <span className="text-blue-600 break-all">{link.url}</span>
                    </span>
                  ))}
                </div>
              )}

              {pi.military && (
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <span className="print:hidden" aria-hidden="true">🎖</span>
                  <span>{pi.military}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== Summary ===== */}
      {pi.summary && (
        <Section title={t('resume.summary')} theme={theme}>
          <SafeHtml html={pi.summary} className="text-sm text-slate-700 leading-relaxed break-words" />
        </Section>
      )}

      {/* ===== Experience ===== */}
      {experiences.length > 0 && (
        <Section title={t('resume.experience')} theme={theme}>
          <div className="space-y-5">
            {experiences.map(exp => (
              <div key={exp.id}>
                <div className="flex flex-wrap justify-between items-baseline gap-2">
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900">{exp.company}</span>
                    {exp.position && <span className="text-slate-600 ml-2 text-sm">{exp.position}</span>}
                    {exp.department && <span className="text-slate-400 ml-1 text-xs">| {exp.department}</span>}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums shrink-0">
                    {formatDate(exp.startDate)}{(exp.endDate || exp.current) && ` — ${exp.current ? '현재' : formatDate(exp.endDate)}`}
                  </span>
                </div>
                {exp.description && <SafeHtml html={exp.description} className="text-sm text-slate-600 mt-1.5 leading-relaxed break-words" />}
                {exp.achievements && (
                  <div className="mt-2 pl-3 border-l-2 border-blue-300 bg-blue-50/50 py-1.5 pr-2 rounded-r">
                    <SafeHtml html={exp.achievements} className="text-sm text-blue-800 leading-relaxed break-words" />
                  </div>
                )}
                {exp.techStack && <TechTags text={exp.techStack} />}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ===== Education ===== */}
      {educations.length > 0 && (
        <Section title={t('resume.education')} theme={theme}>
          <div className="space-y-3">
            {educations.map(edu => (
              <div key={edu.id}>
                <div className="flex flex-wrap justify-between items-baseline gap-2">
                  <div>
                    <span className="font-semibold text-slate-900">{edu.school}</span>
                    {edu.degree && <span className="text-slate-600 ml-2 text-sm">{edu.field && `${edu.field} `}{edu.degree}</span>}
                    {edu.gpa && <span className="text-slate-400 ml-2 text-xs">학점 {edu.gpa}</span>}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums shrink-0">
                    {formatDate(edu.startDate)}{edu.endDate && ` — ${formatDate(edu.endDate)}`}
                  </span>
                </div>
                {edu.description && <SafeHtml html={edu.description} className="text-sm text-slate-600 mt-1" />}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ===== Skills ===== */}
      {skills.length > 0 && (
        <Section title={t('resume.skills')} theme={theme}>
          <div className="space-y-1.5">
            {skills.map(skill => (
              <div key={skill.id} className="flex text-sm gap-2">
                <span className="font-semibold text-slate-800 min-w-[120px] shrink-0">{skill.category}</span>
                <span className="text-slate-600 break-words">{skill.items}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ===== Projects ===== */}
      {projects.length > 0 && (
        <Section title={t('resume.projects')} theme={theme}>
          <div className="space-y-5">
            {projects.map(proj => (
              <div key={proj.id}>
                <div className="flex flex-wrap justify-between items-baseline gap-2">
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900">{proj.name}</span>
                    {proj.company && <span className="text-slate-400 ml-1 text-xs">@ {proj.company}</span>}
                    {proj.role && <span className="text-slate-600 ml-2 text-sm">| {proj.role}</span>}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums shrink-0">
                    {formatDate(proj.startDate)}{proj.endDate && ` — ${formatDate(proj.endDate)}`}
                  </span>
                </div>
                {proj.description && <SafeHtml html={proj.description} className="text-sm text-slate-600 mt-1.5 leading-relaxed break-words" />}
                {proj.techStack && <TechTags text={proj.techStack} color="blue" />}
                {proj.link && <p className="text-xs text-blue-600 mt-1 break-all">{proj.link}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ===== Certifications ===== */}
      {certifications.length > 0 && (
        <Section title={t('resume.certifications')} theme={theme}>
          <div className="space-y-2">
            {certifications.map(cert => (
              <div key={cert.id}>
                <div className="flex flex-wrap justify-between items-baseline gap-2">
                  <div>
                    <span className="font-semibold text-slate-900">{cert.name}</span>
                    {cert.issuer && <span className="text-slate-600 ml-2 text-sm">{cert.issuer}</span>}
                    {cert.credentialId && <span className="text-slate-400 ml-2 text-xs">({cert.credentialId})</span>}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums shrink-0">
                    {formatDate(cert.issueDate)}{cert.expiryDate && ` — ${formatDate(cert.expiryDate)}`}
                  </span>
                </div>
                {cert.description && <SafeHtml html={cert.description} className="text-sm text-slate-600 mt-1" />}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ===== Languages ===== */}
      {languages.length > 0 && (
        <Section title={t('resume.languages')} theme={theme}>
          <div className="space-y-1">
            {languages.map(lang => (
              <div key={lang.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-semibold text-slate-900">{lang.name}</span>
                  {lang.testName && <span className="text-slate-600 ml-2 text-sm">{lang.testName}</span>}
                  {lang.score && <span className="text-blue-600 ml-2 text-sm font-medium">{lang.score}</span>}
                </div>
                {lang.testDate && <span className="text-xs text-slate-400 tabular-nums">{formatDate(lang.testDate)}</span>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ===== Awards ===== */}
      {awards.length > 0 && (
        <Section title={t('resume.awards')} theme={theme}>
          <div className="space-y-2">
            {awards.map(award => (
              <div key={award.id}>
                <div className="flex flex-wrap justify-between items-baseline gap-2">
                  <div>
                    <span className="font-semibold text-slate-900">{award.name}</span>
                    {award.issuer && <span className="text-slate-600 ml-2 text-sm">{award.issuer}</span>}
                  </div>
                  {award.awardDate && <span className="text-xs text-slate-400 tabular-nums">{formatDate(award.awardDate)}</span>}
                </div>
                {award.description && <SafeHtml html={award.description} className="text-sm text-slate-600 mt-1" />}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ===== Activities ===== */}
      {activities.length > 0 && (
        <Section title={t('resume.activities')} theme={theme}>
          <div className="space-y-2">
            {activities.map(act => (
              <div key={act.id}>
                <div className="flex flex-wrap justify-between items-baseline gap-2">
                  <div>
                    <span className="font-semibold text-slate-900">{act.name}</span>
                    {act.organization && <span className="text-slate-600 ml-2 text-sm">{act.organization}</span>}
                    {act.role && <span className="text-slate-400 ml-1 text-xs">| {act.role}</span>}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums shrink-0">
                    {formatDate(act.startDate)}{act.endDate && ` — ${formatDate(act.endDate)}`}
                  </span>
                </div>
                {act.description && <SafeHtml html={act.description} className="text-sm text-slate-600 mt-1" />}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
});

function Section({ title, children, theme }: { title: string; children: React.ReactNode; theme?: ResumeTheme }) {
  const defaultStyle = 'text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-1.5 mb-3';
  return (
    <section className="mb-7">
      <h2 className={theme?.sectionTitleStyle || defaultStyle}>{title}</h2>
      {children}
    </section>
  );
}

ResumePreview.displayName = 'ResumePreview';

export default memo(ResumePreview);
