import type { Resume } from '@/types/resume';

interface Props {
  resume: Resume;
}

export default function ResumeStats({ resume }: Props) {
  const getText = (obj: any): string => {
    if (typeof obj === 'string') return obj.replace(/<[^>]*>/g, '');
    if (Array.isArray(obj)) return obj.map(getText).join(' ');
    if (obj && typeof obj === 'object') return Object.values(obj).map(getText).join(' ');
    return '';
  };

  const text = getText(resume);
  const words = text.split(/\s+/).filter(Boolean).length;
  const chars = text.replace(/\s/g, '').length;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  const sectionCount = [
    resume.experiences.length,
    resume.educations.length,
    resume.skills.length,
    resume.projects.length,
    resume.certifications.length,
    resume.languages.length,
    resume.awards.length,
    resume.activities.length,
  ].filter((n) => n > 0).length;

  return (
    <div className="flex flex-wrap gap-4 text-xs text-slate-400 dark:text-slate-500 no-print">
      <span>{chars.toLocaleString()}자</span>
      <span>{words.toLocaleString()}단어</span>
      <span>읽기 약 {readingTime}분</span>
      <span>{sectionCount}/8 섹션</span>
    </div>
  );
}
