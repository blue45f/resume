import { forwardRef } from 'react';
import type { Resume } from '@/types/resume';

interface Props {
  resume: Resume;
}

function formatDate(date: string): string {
  if (!date) return '';
  const parts = date.split('-');
  if (parts.length === 3) return `${parts[0]}.${parts[1]}.${parts[2]}`;
  if (parts.length === 2) return `${parts[0]}.${parts[1]}`;
  return parts[0];
}

function TextBlock({ text, className }: { text: string; className?: string }) {
  const lines = text.split('\n').filter(Boolean);
  if (lines.length <= 1) {
    return <p className={className}>{text}</p>;
  }
  return (
    <ul className={`list-disc list-inside space-y-0.5 ${className || ''}`}>
      {lines.map((line, i) => <li key={i}>{line}</li>)}
    </ul>
  );
}

const ResumePreview = forwardRef<HTMLDivElement, Props>(({ resume }, ref) => {
  const { personalInfo, experiences, educations, skills, projects, certifications, languages, awards, activities } = resume;

  return (
    <div ref={ref} className="bg-white p-8 sm:p-12 max-w-[210mm] mx-auto shadow-lg print:shadow-none print:p-0 font-['-apple-system','Pretendard','Noto_Sans_KR',sans-serif]">
      {/* Header */}
      <div className="mb-10 pb-6 border-b-2 border-slate-800">
        <div className={personalInfo.photo ? 'flex items-start gap-6' : 'text-center'}>
          {personalInfo.photo && (
            <img src={personalInfo.photo} alt={`${personalInfo.name} 증명사진`} className="w-28 h-36 object-cover rounded-lg border border-slate-200 shrink-0 print:w-24 print:h-32" />
          )}
          <div className={personalInfo.photo ? '' : ''}>
            <h1 className={`text-3xl font-extrabold text-slate-900 tracking-tight mb-3 ${!personalInfo.photo ? 'text-center' : ''}`}>{personalInfo.name || '이름'}</h1>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-slate-500">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.address && <span>{personalInfo.address}</span>}
          {personalInfo.birthYear && <span>{personalInfo.birthYear}년생</span>}
          {personalInfo.website && <span className="text-blue-600 break-all">{personalInfo.website}</span>}
        </div>
        {personalInfo.links && personalInfo.links.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm mt-1">
            {personalInfo.links.map((link, i) => (
              <span key={i} className="text-slate-500">
                {link.label}: <span className="text-blue-600 break-all">{link.url}</span>
              </span>
            ))}
          </div>
        )}
        {personalInfo.military && (
          <div className="text-xs text-slate-400 mt-1">{personalInfo.military}</div>
        )}
          </div>
        </div>
      </div>

      {personalInfo.summary && (
        <section className="mb-8">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-1.5 mb-3">자기소개</h2>
          <TextBlock text={personalInfo.summary} className="text-sm text-slate-700 leading-relaxed" />
        </section>
      )}

      {experiences.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-1.5 mb-3">경력</h2>
          <div className="space-y-4">
            {experiences.map(exp => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold text-slate-900">{exp.company}</span>
                    {exp.position && <span className="text-slate-600 ml-2 text-sm">{exp.position}</span>}
                    {exp.department && <span className="text-slate-400 ml-1 text-xs">({exp.department})</span>}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-4 tabular-nums">
                    {formatDate(exp.startDate)}{(exp.endDate || exp.current) && ` — ${exp.current ? '현재' : formatDate(exp.endDate)}`}
                  </span>
                </div>
                {exp.description && <TextBlock text={exp.description} className="text-sm text-slate-700 mt-1 leading-relaxed" />}
                {exp.achievements && (
                  <div className="mt-1.5 pl-3 border-l-2 border-blue-200">
                    <TextBlock text={exp.achievements} className="text-sm text-blue-800 leading-relaxed" />
                  </div>
                )}
                {exp.techStack && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {exp.techStack.split(',').map((t, i) => (
                      <span key={i} className="px-1.5 py-0.5 text-xs bg-slate-100 text-slate-500 rounded">{t.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {educations.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-1.5 mb-3">학력</h2>
          <div className="space-y-4">
            {educations.map(edu => (
              <div key={edu.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold text-slate-900">{edu.school}</span>
                    {edu.degree && <span className="text-slate-600 ml-2 text-sm">{edu.field && `${edu.field} `}{edu.degree}</span>}
                    {edu.gpa && <span className="text-slate-400 ml-2 text-xs">({edu.gpa})</span>}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-4 tabular-nums">
                    {formatDate(edu.startDate)}{edu.endDate && ` — ${formatDate(edu.endDate)}`}
                  </span>
                </div>
                {edu.description && <TextBlock text={edu.description} className="text-sm text-slate-700 mt-1" />}
              </div>
            ))}
          </div>
        </section>
      )}

      {skills.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-1.5 mb-3">기술</h2>
          <div className="space-y-2">
            {skills.map(skill => (
              <div key={skill.id} className="flex text-sm">
                <span className="font-semibold text-slate-900 min-w-[140px]">{skill.category}</span>
                <span className="text-slate-700">{skill.items}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-1.5 mb-3">프로젝트</h2>
          <div className="space-y-4">
            {projects.map(proj => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold text-slate-900">{proj.name}</span>
                    {proj.company && <span className="text-slate-500 ml-1 text-xs">@ {proj.company}</span>}
                    {proj.role && <span className="text-slate-600 ml-2 text-sm">{proj.role}</span>}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-4 tabular-nums">
                    {formatDate(proj.startDate)}{proj.endDate && ` — ${formatDate(proj.endDate)}`}
                  </span>
                </div>
                {proj.description && <TextBlock text={proj.description} className="text-sm text-slate-700 mt-1 leading-relaxed" />}
                {proj.techStack && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {proj.techStack.split(',').map((t, i) => (
                      <span key={i} className="px-1.5 py-0.5 text-xs bg-blue-50 text-blue-600 rounded">{t.trim()}</span>
                    ))}
                  </div>
                )}
                {proj.link && <p className="text-sm text-blue-600 mt-1">{proj.link}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {certifications.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-1.5 mb-3">자격증</h2>
          <div className="space-y-4">
            {certifications.map(cert => (
              <div key={cert.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold text-slate-900">{cert.name}</span>
                    {cert.issuer && <span className="text-slate-600 ml-2 text-sm">{cert.issuer}</span>}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-4 tabular-nums">
                    {formatDate(cert.issueDate)}{cert.expiryDate && ` — ${formatDate(cert.expiryDate)}`}
                  </span>
                </div>
                {cert.credentialId && <p className="text-xs text-slate-400 mt-0.5">자격번호: {cert.credentialId}</p>}
                {cert.description && <TextBlock text={cert.description} className="text-sm text-slate-700 mt-1 leading-relaxed" />}
              </div>
            ))}
          </div>
        </section>
      )}

      {languages.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-1.5 mb-3">어학</h2>
          <div className="space-y-4">
            {languages.map(lang => (
              <div key={lang.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold text-slate-900">{lang.name}</span>
                    {lang.testName && <span className="text-slate-600 ml-2 text-sm">{lang.testName}</span>}
                    {lang.score && <span className="text-slate-800 ml-2 text-sm font-medium">{lang.score}</span>}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-4 tabular-nums">
                    {formatDate(lang.testDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {awards.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-1.5 mb-3">수상 경력</h2>
          <div className="space-y-4">
            {awards.map(award => (
              <div key={award.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold text-slate-900">{award.name}</span>
                    {award.issuer && <span className="text-slate-600 ml-2 text-sm">{award.issuer}</span>}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-4 tabular-nums">
                    {formatDate(award.awardDate)}
                  </span>
                </div>
                {award.description && <TextBlock text={award.description} className="text-sm text-slate-700 mt-1 leading-relaxed" />}
              </div>
            ))}
          </div>
        </section>
      )}

      {activities.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-1.5 mb-3">활동/봉사</h2>
          <div className="space-y-4">
            {activities.map(act => (
              <div key={act.id}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold text-slate-900">{act.name}</span>
                    {act.organization && <span className="text-slate-600 ml-2 text-sm">{act.organization}</span>}
                    {act.role && <span className="text-slate-500 ml-1 text-sm">({act.role})</span>}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-4 tabular-nums">
                    {formatDate(act.startDate)}{act.endDate && ` — ${formatDate(act.endDate)}`}
                  </span>
                </div>
                {act.description && <TextBlock text={act.description} className="text-sm text-slate-700 mt-1 leading-relaxed" />}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';

export default ResumePreview;
