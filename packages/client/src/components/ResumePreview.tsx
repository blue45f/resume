import { forwardRef, memo } from 'react';
import type { Resume, Skill as SkillType, SectionId } from '@/types/resume';
import { DEFAULT_SECTION_ORDER } from '@/types/resume';
import SafeHtml from '@/components/SafeHtml';
import { resumeThemes, type ResumeTheme } from '@/lib/resumeThemes';
import { t } from '@/lib/i18n';

interface Props {
  resume: Resume;
  themeId?: string;
  customAccentHex?: string; // e.g. "#6366f1"
  customFont?: string; // e.g. "'Noto Sans KR', sans-serif"
}

const MONTH_NAMES_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const ENGLISH_THEMES = new Set(['executive', 'corporate', 'portfolio']);

function formatDate(date: string, locale: 'ko' | 'en' = 'ko'): string {
  if (!date) return '';
  const parts = date.split('-');
  const year = parts[0];
  const month = parts.length >= 2 ? parts[1] : '';

  if (locale === 'en') {
    if (month) {
      const monthIdx = parseInt(month, 10) - 1;
      const monthName = MONTH_NAMES_EN[monthIdx] || month;
      return `${monthName} ${year}`;
    }
    return year;
  }

  // Korean format: 2024.03
  if (month) return `${year}.${month}`;
  return year;
}

/** Format a date range with proper locale-aware "현재"/"Present" handling */
function formatDateRange(
  startDate: string,
  endDate: string,
  current: boolean | undefined,
  locale: 'ko' | 'en' = 'ko',
): string {
  const start = formatDate(startDate, locale);
  if (!start) return '';

  if (current) {
    const presentLabel = locale === 'en' ? 'Present' : '현재';
    return `${start} — ${presentLabel}`;
  }

  if (endDate) {
    return `${start} — ${formatDate(endDate, locale)}`;
  }

  return start;
}

function getDateLocale(themeId: string): 'ko' | 'en' {
  return ENGLISH_THEMES.has(themeId) ? 'en' : 'ko';
}

/* ------------------------------------------------------------------ */
/*  Theme-specific section separators                                  */
/* ------------------------------------------------------------------ */
function ThemeSeparator({ themeId }: { themeId: string }) {
  switch (themeId) {
    case 'classic':
    case 'corporate':
    case 'academic':
      return <hr className="border-t border-slate-300 my-5" />;
    case 'modern':
    case 'dark':
      return <div className="border-l-4 border-blue-400 my-5 ml-1" style={{ height: 2 }} />;
    case 'minimal':
    case 'pastel':
      return <div className="my-8" />;
    case 'creative':
    case 'startup':
      return (
        <div className="h-1 my-6 rounded-full bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-300 opacity-60" />
      );
    case 'tech':
      return (
        <div className="my-5 font-mono text-[10px] text-slate-500 dark:text-slate-400 tracking-widest text-center select-none">
          /* ─────────────────────────────── */
        </div>
      );
    case 'elegant':
      return (
        <div className="my-6 text-center text-amber-400 tracking-[1em] text-xs select-none">
          &bull; &bull; &bull;
        </div>
      );
    case 'newspaper':
      return (
        <div className="my-5">
          <div className="border-t-[3px] border-slate-900" />
          <div className="border-t border-slate-400 mt-[2px]" />
        </div>
      );
    case 'executive':
      return (
        <div className="my-7 flex items-center gap-4">
          <div className="flex-1 border-t border-slate-300" />
          <span className="text-slate-300 text-xs select-none">&loz;</span>
          <div className="flex-1 border-t border-slate-300" />
        </div>
      );
    case 'portfolio':
      return (
        <div className="h-1.5 my-7 rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 opacity-50" />
      );
    case 'professional':
      return <div className="border-t-2 border-slate-200 my-6" />;
    default:
      return <hr className="border-t border-slate-200 my-5" />;
  }
}

/* ------------------------------------------------------------------ */
/*  Theme-specific skill rendering                                     */
/* ------------------------------------------------------------------ */
function SkillsDisplay({
  skills,
  themeId,
  accentColor,
}: {
  skills: SkillType[];
  themeId: string;
  accentColor: string;
}) {
  // Comma-separated text
  if (['classic', 'professional', 'corporate', 'academic'].includes(themeId)) {
    return (
      <div className="space-y-2">
        {skills.map((skill) => (
          <div key={skill.id} className="text-sm">
            <span className="font-semibold text-slate-800">{skill.category}: </span>
            <span className="text-slate-600">{skill.items}</span>
          </div>
        ))}
      </div>
    );
  }

  // Pill badges
  if (['modern', 'startup', 'dark', 'pastel'].includes(themeId)) {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      indigo: 'bg-sky-100 text-sky-700 border-sky-200',
      slate: 'bg-sky-100 text-sky-700 border-sky-200',
      purple: 'bg-cyan-100 text-pink-700 border-cyan-200',
    };
    const pillColor = colorMap[accentColor] || colorMap.blue;
    return (
      <div className="space-y-3">
        {skills.map((skill) => (
          <div key={skill.id}>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              {skill.category}
            </div>
            <div className="flex flex-wrap gap-2">
              {skill.items.split(',').map((item, i) => (
                <span
                  key={i}
                  className={`px-2.5 py-1 text-xs font-medium rounded-full border ${pillColor}`}
                >
                  {item.trim()}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Inline code blocks
  if (themeId === 'tech') {
    return (
      <div className="space-y-3">
        {skills.map((skill) => (
          <div key={skill.id}>
            <div className="text-xs font-bold text-[#7ee787] font-mono mb-1.5">
              <span className="text-[#484f58]">const </span>
              {skill.category.replace(/\s+/g, '_').toLowerCase()}
              <span className="text-[#484f58]"> = </span>[
            </div>
            <div className="flex flex-wrap gap-2 ml-4">
              {skill.items.split(',').map((item, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs font-mono bg-[#161b22] text-[#79c0ff] border border-[#30363d] rounded"
                >{`"${item.trim()}"`}</span>
              ))}
            </div>
            <div className="text-xs font-mono text-[#484f58]">];</div>
          </div>
        ))}
      </div>
    );
  }

  // Colored cards with level bar
  if (['creative', 'portfolio'].includes(themeId)) {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-blue-500 to-cyan-400',
      'from-orange-400 to-red-500',
      'from-green-400 to-emerald-500',
      'from-blue-500 to-sky-400',
    ];
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {skills.map((skill, si) => (
          <div key={skill.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="text-xs font-bold text-slate-700 mb-2">{skill.category}</div>
            <div className="space-y-1.5">
              {skill.items.split(',').map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 min-w-[80px]">{item.trim()}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${gradients[si % gradients.length]}`}
                      style={{ width: `${70 + Math.random() * 30}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Bullet list with serif (elegant, executive)
  if (['elegant', 'executive'].includes(themeId)) {
    return (
      <div className="space-y-3">
        {skills.map((skill) => (
          <div key={skill.id}>
            <div
              className="text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1.5"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              {skill.category}
            </div>
            <ul className="list-none space-y-0.5 ml-1">
              {skill.items.split(',').map((item, i) => (
                <li
                  key={i}
                  className="text-sm text-slate-600 flex items-start gap-2"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  <span className="text-amber-500 mt-0.5 text-xs select-none">&bull;</span>
                  {item.trim()}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  // Newspaper: dense two-column
  if (themeId === 'newspaper') {
    return (
      <div className="columns-2 gap-6 text-sm" style={{ fontFamily: "'Georgia', serif" }}>
        {skills.map((skill) => (
          <div key={skill.id} className="break-inside-avoid mb-2">
            <span className="font-bold text-slate-900">{skill.category}: </span>
            <span className="text-slate-700">{skill.items}</span>
          </div>
        ))}
      </div>
    );
  }

  // Minimal: spaced text
  if (themeId === 'minimal') {
    return (
      <div className="space-y-4">
        {skills.map((skill) => (
          <div key={skill.id}>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] mb-1">
              {skill.category}
            </div>
            <div className="text-sm text-slate-500 tracking-wide">{skill.items}</div>
          </div>
        ))}
      </div>
    );
  }

  // Default fallback
  return (
    <div className="space-y-1.5">
      {skills.map((skill) => (
        <div key={skill.id} className="flex text-sm gap-2">
          <span className="font-semibold text-slate-800 min-w-[120px] shrink-0">
            {skill.category}
          </span>
          <span className="text-slate-600 break-words">{skill.items}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TechTags (shared helper)                                           */
/* ------------------------------------------------------------------ */
function TechTags({
  text,
  color = 'slate',
  themeId,
}: {
  text: string;
  color?: 'slate' | 'blue';
  themeId?: string;
}) {
  if (themeId === 'tech') {
    return (
      <div className="flex flex-wrap gap-1 mt-1.5">
        {text.split(',').map((tag, i) => (
          <span
            key={i}
            className="px-1.5 py-1 text-xs font-mono bg-[#161b22] text-[#79c0ff] border border-[#30363d] rounded"
          >
            {tag.trim()}
          </span>
        ))}
      </div>
    );
  }
  const bg = color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500';
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {text.split(',').map((tag, i) => (
        <span key={i} className={`px-1.5 py-1 text-xs rounded ${bg}`}>
          {tag.trim()}
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section wrapper with theme separator                               */
/* ------------------------------------------------------------------ */
function Section({
  title,
  children,
  theme,
  isFirst,
}: {
  title: string;
  children: React.ReactNode;
  theme: ResumeTheme;
  isFirst?: boolean;
}) {
  const defaultStyle =
    'text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-1.5 mb-3';
  return (
    <>
      {!isFirst && <ThemeSeparator themeId={theme.id} />}
      <section className="mb-2">
        <h2 className={theme.sectionTitleStyle || defaultStyle}>{title}</h2>
        {children}
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Contact row (reusable)                                             */
/* ------------------------------------------------------------------ */
function ContactInfo({ pi, theme }: { pi: Resume['personalInfo']; theme: ResumeTheme }) {
  const isDarkHeader = [
    'professional',
    'startup',
    'tech',
    'creative',
    'dark',
    'portfolio',
  ].includes(theme.id);
  return (
    <div className="space-y-1 text-sm">
      <div
        className={`flex flex-wrap items-center gap-x-1 gap-y-0.5 ${isDarkHeader ? 'text-white/80' : 'text-slate-600'}`}
      >
        {[
          pi.email && { icon: '✉', text: pi.email },
          pi.phone && { icon: '☎', text: pi.phone },
          pi.address && { icon: '📍', text: pi.address },
          pi.birthYear && { icon: '📅', text: `${pi.birthYear}년생` },
        ]
          .filter(Boolean)
          .map((item, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-slate-300 mx-1">|</span>}
              <span className="text-xs print:hidden" aria-hidden="true">
                {(item as any).icon}
              </span>
              <span>{(item as any).text}</span>
            </span>
          ))}
      </div>
      {(pi.website || pi.github || (pi.links && pi.links.length > 0)) && (
        <div
          className={`flex flex-wrap items-center gap-x-1 gap-y-0.5 ${isDarkHeader ? 'text-white/70' : ''}`}
        >
          {pi.website && (
            <span className="flex items-center gap-1 text-blue-600">
              <span className="text-xs print:hidden" aria-hidden="true">
                🔗
              </span>
              <span className="break-all">{pi.website}</span>
            </span>
          )}
          {pi.github && (
            <span className="flex items-center gap-1">
              {pi.website && <span className="text-slate-300 mx-1">|</span>}
              <span className="text-xs print:hidden" aria-hidden="true">
                💻
              </span>
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
        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="print:hidden" aria-hidden="true">
            🎖
          </span>
          <span>{pi.military}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Experience block (reusable)                                        */
/* ------------------------------------------------------------------ */
function ExperienceBlock({ exp, themeId }: { exp: Resume['experiences'][0]; themeId: string }) {
  return (
    <div className="resume-item">
      <div className="flex flex-wrap justify-between items-baseline gap-2">
        <div className="min-w-0">
          <span className="font-semibold text-slate-900">{exp.company}</span>
          {exp.position && <span className="text-slate-600 ml-2 text-sm">{exp.position}</span>}
          {exp.department && (
            <span className="text-slate-400 ml-1 text-xs">| {exp.department}</span>
          )}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums shrink-0">
          {formatDateRange(exp.startDate, exp.endDate, exp.current, getDateLocale(themeId))}
        </span>
      </div>
      {exp.description && (
        <SafeHtml
          html={exp.description}
          className="text-sm text-slate-600 mt-1.5 leading-relaxed break-words"
        />
      )}
      {exp.achievements && (
        <div
          className={`mt-2 pl-3 border-l-2 py-1.5 pr-2 rounded-r ${
            themeId === 'tech'
              ? 'border-[#238636] bg-[#0d1117]/5'
              : themeId === 'creative'
                ? 'border-sky-300 bg-sky-50/50'
                : 'border-blue-300 bg-blue-50/50'
          }`}
        >
          <SafeHtml
            html={exp.achievements}
            className={`text-sm leading-relaxed break-words ${
              themeId === 'tech' ? 'text-[#7ee787]' : 'text-blue-800'
            }`}
          />
        </div>
      )}
      {exp.techStack && <TechTags text={exp.techStack} themeId={themeId} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Education block (reusable)                                         */
/* ------------------------------------------------------------------ */
function EducationBlock({ edu, themeId }: { edu: Resume['educations'][0]; themeId: string }) {
  const locale = getDateLocale(themeId);
  return (
    <div className="resume-item">
      <div className="flex flex-wrap justify-between items-baseline gap-2">
        <div>
          <span className="font-semibold text-slate-900">{edu.school}</span>
          {edu.degree && (
            <span className="text-slate-600 ml-2 text-sm">
              {edu.field && `${edu.field} `}
              {edu.degree}
            </span>
          )}
          {edu.gpa && (
            <span className="text-slate-400 ml-2 text-xs">
              {locale === 'en' ? 'GPA' : '학점'} {edu.gpa}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums shrink-0">
          {formatDateRange(edu.startDate, edu.endDate, undefined, locale)}
        </span>
      </div>
      {edu.description && (
        <SafeHtml html={edu.description} className="text-sm text-slate-600 mt-1" />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Remaining content sections (certs, langs, awards, activities)      */
/* ------------------------------------------------------------------ */
function RemainingContent({
  resume,
  theme,
  sectionIndex,
}: {
  resume: Resume;
  theme: ResumeTheme;
  sectionIndex: number;
}) {
  const { certifications, languages, awards, activities } = resume;
  let idx = sectionIndex;

  return (
    <>
      {certifications.length > 0 && (
        <Section title={t('resume.certifications')} theme={theme} isFirst={idx++ === 0}>
          <div className="space-y-2">
            {certifications.map((cert) => (
              <div key={cert.id}>
                <div className="flex flex-wrap justify-between items-baseline gap-2">
                  <div>
                    <span className="font-semibold text-slate-900">{cert.name}</span>
                    {cert.issuer && (
                      <span className="text-slate-600 ml-2 text-sm">{cert.issuer}</span>
                    )}
                    {cert.credentialId && (
                      <span className="text-slate-400 ml-2 text-xs">({cert.credentialId})</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums shrink-0">
                    {formatDateRange(
                      cert.issueDate,
                      cert.expiryDate,
                      undefined,
                      getDateLocale(theme.id),
                    )}
                  </span>
                </div>
                {cert.description && (
                  <SafeHtml html={cert.description} className="text-sm text-slate-600 mt-1" />
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
      {languages.length > 0 && (
        <Section title={t('resume.languages')} theme={theme} isFirst={idx++ === 0}>
          <div className="space-y-1">
            {languages.map((lang) => (
              <div key={lang.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-semibold text-slate-900">{lang.name}</span>
                  {lang.testName && (
                    <span className="text-slate-600 ml-2 text-sm">{lang.testName}</span>
                  )}
                  {lang.score && (
                    <span className="text-blue-600 ml-2 text-sm font-medium">{lang.score}</span>
                  )}
                </div>
                {lang.testDate && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {formatDate(lang.testDate, getDateLocale(theme.id))}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
      {awards.length > 0 && (
        <Section title={t('resume.awards')} theme={theme} isFirst={idx++ === 0}>
          <div className="space-y-2">
            {awards.map((award) => (
              <div key={award.id}>
                <div className="flex flex-wrap justify-between items-baseline gap-2">
                  <div>
                    <span className="font-semibold text-slate-900">{award.name}</span>
                    {award.issuer && (
                      <span className="text-slate-600 ml-2 text-sm">{award.issuer}</span>
                    )}
                  </div>
                  {award.awardDate && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {formatDate(award.awardDate, getDateLocale(theme.id))}
                    </span>
                  )}
                </div>
                {award.description && (
                  <SafeHtml html={award.description} className="text-sm text-slate-600 mt-1" />
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
      {activities.length > 0 && (
        <Section title={t('resume.activities')} theme={theme} isFirst={idx++ === 0}>
          <div className="space-y-2">
            {activities.map((act) => (
              <div key={act.id}>
                <div className="flex flex-wrap justify-between items-baseline gap-2">
                  <div>
                    <span className="font-semibold text-slate-900">{act.name}</span>
                    {act.organization && (
                      <span className="text-slate-600 ml-2 text-sm">{act.organization}</span>
                    )}
                    {act.role && <span className="text-slate-400 ml-1 text-xs">| {act.role}</span>}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums shrink-0">
                    {formatDateRange(
                      act.startDate,
                      act.endDate,
                      undefined,
                      getDateLocale(theme.id),
                    )}
                  </span>
                </div>
                {act.description && (
                  <SafeHtml html={act.description} className="text-sm text-slate-600 mt-1" />
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Project block (reusable)                                           */
/* ------------------------------------------------------------------ */
function ProjectBlock({ proj, themeId }: { proj: Resume['projects'][0]; themeId: string }) {
  return (
    <div className="resume-item">
      <div className="flex flex-wrap justify-between items-baseline gap-2">
        <div className="min-w-0">
          <span className="font-semibold text-slate-900">{proj.name}</span>
          {proj.company && <span className="text-slate-400 ml-1 text-xs">@ {proj.company}</span>}
          {proj.role && <span className="text-slate-600 ml-2 text-sm">| {proj.role}</span>}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums shrink-0">
          {formatDateRange(proj.startDate, proj.endDate, undefined, getDateLocale(themeId))}
        </span>
      </div>
      {proj.description && (
        <SafeHtml
          html={proj.description}
          className="text-sm text-slate-600 mt-1.5 leading-relaxed break-words"
        />
      )}
      {proj.techStack && <TechTags text={proj.techStack} color="blue" themeId={themeId} />}
      {proj.link && <p className="text-xs text-blue-600 mt-1 break-all">{proj.link}</p>}
    </div>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
const ResumePreview = forwardRef<HTMLDivElement, Props>(
  ({ resume, themeId, customAccentHex, customFont }, ref) => {
    const theme = resumeThemes.find((t) => t.id === themeId) || resumeThemes[0];
    const { personalInfo: pi, experiences, educations, skills, projects } = resume;
    const hasPhoto = !!pi.photo;
    const isDarkHeader = [
      'professional',
      'startup',
      'tech',
      'creative',
      'dark',
      'portfolio',
    ].includes(theme.id);

    /* Count leading content sections for separator logic */
    let sectionCount = 0;
    if (pi.summary) sectionCount++;
    if (experiences.length) sectionCount++;
    if (educations.length) sectionCount++;
    if (skills.length) sectionCount++;
    if (projects.length) sectionCount++;

    /* ---- Default header content ---- */
    const headerContent = (
      <div className={hasPhoto ? 'flex gap-5' : ''}>
        {hasPhoto && (
          <img
            src={pi.photo}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-[100px] h-[130px] object-cover rounded border border-slate-200 shrink-0 print:w-[90px] print:h-[117px]"
          />
        )}
        <div className="flex-1 min-w-0">
          <h1
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDarkHeader ? 'text-white' : 'text-slate-900'}`}
          >
            {pi.name || '이름'}
          </h1>
          <div className="mt-2.5">
            <ContactInfo pi={pi} theme={theme} />
          </div>
        </div>
      </div>
    );

    /* ---- Section order & visibility ---- */
    const sectionOrder = resume.sectionOrder?.length
      ? resume.sectionOrder
      : [...DEFAULT_SECTION_ORDER];
    const hiddenSections = new Set(resume.hiddenSections || []);

    /** Render a single section by ID */
    function renderSection(sectionId: SectionId, isFirst: boolean) {
      if (hiddenSections.has(sectionId)) return null;
      switch (sectionId) {
        case 'experience':
          return experiences.length > 0 ? (
            <Section
              key="experience"
              title={t('resume.experience')}
              theme={theme}
              isFirst={isFirst}
            >
              <div className="space-y-5">
                {experiences.map((exp) => (
                  <ExperienceBlock key={exp.id} exp={exp} themeId={theme.id} />
                ))}
              </div>
            </Section>
          ) : null;
        case 'education':
          return educations.length > 0 ? (
            <Section key="education" title={t('resume.education')} theme={theme} isFirst={isFirst}>
              <div className="space-y-3">
                {educations.map((edu) => (
                  <EducationBlock key={edu.id} edu={edu} themeId={theme.id} />
                ))}
              </div>
            </Section>
          ) : null;
        case 'skills':
          return skills.length > 0 ? (
            <Section key="skills" title={t('resume.skills')} theme={theme} isFirst={isFirst}>
              <SkillsDisplay skills={skills} themeId={theme.id} accentColor={theme.accentColor} />
            </Section>
          ) : null;
        case 'projects':
          return projects.length > 0 ? (
            <Section key="projects" title={t('resume.projects')} theme={theme} isFirst={isFirst}>
              <div className="space-y-5">
                {projects.map((proj) => (
                  <ProjectBlock key={proj.id} proj={proj} themeId={theme.id} />
                ))}
              </div>
            </Section>
          ) : null;
        case 'certifications':
          return resume.certifications.length > 0 ? (
            <Section
              key="certifications"
              title={t('resume.certifications')}
              theme={theme}
              isFirst={isFirst}
            >
              <div className="space-y-2">
                {resume.certifications.map((cert) => (
                  <div key={cert.id}>
                    <div className="flex flex-wrap justify-between items-baseline gap-2">
                      <div>
                        <span className="font-semibold text-slate-900">{cert.name}</span>
                        {cert.issuer && (
                          <span className="text-slate-600 ml-2 text-sm">{cert.issuer}</span>
                        )}
                        {cert.credentialId && (
                          <span className="text-slate-400 ml-2 text-xs">({cert.credentialId})</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums shrink-0">
                        {formatDateRange(
                          cert.issueDate,
                          cert.expiryDate,
                          undefined,
                          getDateLocale(theme.id),
                        )}
                      </span>
                    </div>
                    {cert.description && (
                      <SafeHtml html={cert.description} className="text-sm text-slate-600 mt-1" />
                    )}
                  </div>
                ))}
              </div>
            </Section>
          ) : null;
        case 'languages':
          return resume.languages.length > 0 ? (
            <Section key="languages" title={t('resume.languages')} theme={theme} isFirst={isFirst}>
              <div className="space-y-1">
                {resume.languages.map((lang) => (
                  <div key={lang.id} className="flex justify-between items-baseline">
                    <div>
                      <span className="font-semibold text-slate-900">{lang.name}</span>
                      {lang.testName && (
                        <span className="text-slate-600 ml-2 text-sm">{lang.testName}</span>
                      )}
                      {lang.score && (
                        <span className="text-blue-600 ml-2 text-sm font-medium">{lang.score}</span>
                      )}
                    </div>
                    {lang.testDate && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {formatDate(lang.testDate, getDateLocale(theme.id))}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          ) : null;
        case 'awards':
          return resume.awards.length > 0 ? (
            <Section key="awards" title={t('resume.awards')} theme={theme} isFirst={isFirst}>
              <div className="space-y-2">
                {resume.awards.map((award) => (
                  <div key={award.id}>
                    <div className="flex flex-wrap justify-between items-baseline gap-2">
                      <div>
                        <span className="font-semibold text-slate-900">{award.name}</span>
                        {award.issuer && (
                          <span className="text-slate-600 ml-2 text-sm">{award.issuer}</span>
                        )}
                      </div>
                      {award.awardDate && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          {formatDate(award.awardDate, getDateLocale(theme.id))}
                        </span>
                      )}
                    </div>
                    {award.description && (
                      <SafeHtml html={award.description} className="text-sm text-slate-600 mt-1" />
                    )}
                  </div>
                ))}
              </div>
            </Section>
          ) : null;
        case 'activities':
          return resume.activities.length > 0 ? (
            <Section
              key="activities"
              title={t('resume.activities')}
              theme={theme}
              isFirst={isFirst}
            >
              <div className="space-y-3">
                {resume.activities.map((act) => (
                  <div key={act.id}>
                    <div className="flex flex-wrap justify-between items-baseline gap-2">
                      <div>
                        <span className="font-semibold text-slate-900">{act.name}</span>
                        {act.organization && (
                          <span className="text-slate-600 ml-2 text-sm">{act.organization}</span>
                        )}
                        {act.role && (
                          <span className="text-slate-500 ml-2 text-xs">({act.role})</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums shrink-0">
                        {formatDateRange(
                          act.startDate,
                          act.endDate,
                          undefined,
                          getDateLocale(theme.id),
                        )}
                      </span>
                    </div>
                    {act.description && (
                      <SafeHtml html={act.description} className="text-sm text-slate-600 mt-1" />
                    )}
                  </div>
                ))}
              </div>
            </Section>
          ) : null;
        default:
          return null;
      }
    }

    /* ---- Standard sections content (respects sectionOrder & hiddenSections) ---- */
    const standardContent = (
      <>
        {pi.summary && (
          <Section title={t('resume.summary')} theme={theme} isFirst>
            <SafeHtml
              html={pi.summary}
              className="text-sm text-slate-700 leading-relaxed break-words"
            />
          </Section>
        )}
        {sectionOrder.map((sectionId, idx) => {
          const isFirst = !pi.summary && idx === 0;
          return renderSection(sectionId, isFirst);
        })}
      </>
    );

    /* ================================================================ */
    /*  THEME-SPECIFIC LAYOUTS                                           */
    /* ================================================================ */

    /* ---- MODERN: Sidebar layout ---- */
    if (theme.id === 'modern') {
      return (
        <div
          ref={ref}
          className="resume-preview bg-white max-w-[210mm] mx-auto shadow-lg print:shadow-none overflow-hidden"
          style={{ fontFamily: theme.fontFamily }}
        >
          {/* Full-width header */}
          <header className={theme.headerStyle}>{headerContent}</header>
          {/* Two-column body */}
          <div className="flex min-h-0">
            {/* Left sidebar */}
            <aside className="w-[200px] shrink-0 bg-blue-50 border-r border-blue-100 p-5 space-y-5 print:w-[180px]">
              {skills.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2 border-b border-blue-200 pb-1">
                    {t('resume.skills')}
                  </h3>
                  <SkillsDisplay
                    skills={skills}
                    themeId={theme.id}
                    accentColor={theme.accentColor}
                  />
                </div>
              )}
              {resume.languages.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2 border-b border-blue-200 pb-1">
                    {t('resume.languages')}
                  </h3>
                  <div className="space-y-1">
                    {resume.languages.map((lang) => (
                      <div key={lang.id} className="text-xs text-slate-600">
                        <span className="font-medium">{lang.name}</span>
                        {lang.score && <span className="text-blue-600 ml-1">{lang.score}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {resume.certifications.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2 border-b border-blue-200 pb-1">
                    {t('resume.certifications')}
                  </h3>
                  <div className="space-y-1">
                    {resume.certifications.map((cert) => (
                      <div key={cert.id} className="text-xs text-slate-600">
                        <div className="font-medium">{cert.name}</div>
                        {cert.issuer && <div className="text-slate-400">{cert.issuer}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
            {/* Main content */}
            <div className={`flex-1 p-6 sm:p-8 ${theme.bodyStyle}`}>
              {pi.summary && (
                <Section title={t('resume.summary')} theme={theme} isFirst>
                  <SafeHtml
                    html={pi.summary}
                    className="text-sm text-slate-700 leading-relaxed break-words"
                  />
                </Section>
              )}
              {experiences.length > 0 && (
                <Section title={t('resume.experience')} theme={theme} isFirst={!pi.summary}>
                  <div className="space-y-5">
                    {experiences.map((exp) => (
                      <ExperienceBlock key={exp.id} exp={exp} themeId={theme.id} />
                    ))}
                  </div>
                </Section>
              )}
              {educations.length > 0 && (
                <Section title={t('resume.education')} theme={theme}>
                  <div className="space-y-3">
                    {educations.map((edu) => (
                      <EducationBlock key={edu.id} edu={edu} themeId={theme.id} />
                    ))}
                  </div>
                </Section>
              )}
              {projects.length > 0 && (
                <Section title={t('resume.projects')} theme={theme}>
                  <div className="space-y-5">
                    {projects.map((proj) => (
                      <ProjectBlock key={proj.id} proj={proj} themeId={theme.id} />
                    ))}
                  </div>
                </Section>
              )}
              {/* Awards & Activities still in main col */}
              {resume.awards.length > 0 && (
                <Section title={t('resume.awards')} theme={theme}>
                  <div className="space-y-2">
                    {resume.awards.map((award) => (
                      <div key={award.id}>
                        <span className="font-semibold text-slate-900">{award.name}</span>
                        {award.issuer && (
                          <span className="text-slate-600 ml-2 text-sm">{award.issuer}</span>
                        )}
                        {award.description && (
                          <SafeHtml
                            html={award.description}
                            className="text-sm text-slate-600 mt-1"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}
              {resume.activities.length > 0 && (
                <Section title={t('resume.activities')} theme={theme}>
                  <div className="space-y-2">
                    {resume.activities.map((act) => (
                      <div key={act.id}>
                        <span className="font-semibold text-slate-900">{act.name}</span>
                        {act.organization && (
                          <span className="text-slate-600 ml-2 text-sm">{act.organization}</span>
                        )}
                        {act.description && (
                          <SafeHtml
                            html={act.description}
                            className="text-sm text-slate-600 mt-1"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </div>
        </div>
      );
    }

    /* ---- MINIMAL: Extra-wide margins, lots of white space ---- */
    if (theme.id === 'minimal') {
      return (
        <div
          ref={ref}
          className="resume-preview bg-white px-12 sm:px-20 py-12 sm:py-16 max-w-[210mm] mx-auto shadow-lg print:shadow-none print:p-0 overflow-hidden"
          style={{ fontFamily: theme.fontFamily }}
        >
          <header className={theme.headerStyle}>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-slate-800">
              {pi.name || '이름'}
            </h1>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 tracking-wide">
              {pi.email && <span>{pi.email}</span>}
              {pi.phone && <span>{pi.phone}</span>}
              {pi.address && <span>{pi.address}</span>}
              {pi.website && <span className="text-slate-500">{pi.website}</span>}
              {pi.github && <span className="text-slate-500">{pi.github}</span>}
            </div>
            <div className="mt-3 w-8 h-px bg-slate-300" />
          </header>
          <div className={`${theme.bodyStyle} mt-8 space-y-0`}>
            {pi.summary && (
              <Section title={t('resume.summary')} theme={theme} isFirst>
                <SafeHtml
                  html={pi.summary}
                  className="text-sm text-slate-500 leading-loose break-words"
                />
              </Section>
            )}
            {experiences.length > 0 && (
              <Section title={t('resume.experience')} theme={theme}>
                <div className="space-y-8">
                  {experiences.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex flex-wrap justify-between items-baseline gap-2">
                        <span className="font-medium text-slate-700">
                          {exp.company}
                          {exp.position && ` — ${exp.position}`}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                          {formatDateRange(
                            exp.startDate,
                            exp.endDate,
                            exp.current,
                            getDateLocale(theme.id),
                          )}
                        </span>
                      </div>
                      {exp.description && (
                        <SafeHtml
                          html={exp.description}
                          className="text-sm text-slate-500 mt-2 leading-loose break-words"
                        />
                      )}
                      {exp.techStack && (
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 tracking-wide">
                          {exp.techStack}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}
            {educations.length > 0 && (
              <Section title={t('resume.education')} theme={theme}>
                <div className="space-y-6">
                  {educations.map((edu) => (
                    <EducationBlock key={edu.id} edu={edu} themeId={theme.id} />
                  ))}
                </div>
              </Section>
            )}
            {skills.length > 0 && (
              <Section title={t('resume.skills')} theme={theme}>
                <SkillsDisplay skills={skills} themeId={theme.id} accentColor={theme.accentColor} />
              </Section>
            )}
            {projects.length > 0 && (
              <Section title={t('resume.projects')} theme={theme}>
                <div className="space-y-8">
                  {projects.map((proj) => (
                    <ProjectBlock key={proj.id} proj={proj} themeId={theme.id} />
                  ))}
                </div>
              </Section>
            )}
            <RemainingContent resume={resume} theme={theme} sectionIndex={sectionCount} />
          </div>
        </div>
      );
    }

    /* ---- CREATIVE: Rounded cards for each section ---- */
    if (theme.id === 'creative') {
      return (
        <div
          ref={ref}
          className="resume-preview bg-gradient-to-b from-slate-50 to-white max-w-[210mm] mx-auto shadow-lg print:shadow-none overflow-hidden"
          style={{ fontFamily: theme.fontFamily }}
        >
          <header className={theme.headerStyle}>
            <div className={hasPhoto ? 'flex gap-5 items-center' : ''}>
              {hasPhoto && (
                <img
                  src={pi.photo}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-[100px] h-[100px] object-cover rounded-full border-4 border-white/30 shrink-0 shadow-lg"
                />
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {pi.name || '이름'}
                </h1>
                <div className="mt-2.5">
                  <ContactInfo pi={pi} theme={theme} />
                </div>
              </div>
            </div>
          </header>
          <div className="p-6 sm:p-8 space-y-5">
            {pi.summary && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h2 className={theme.sectionTitleStyle}>{t('resume.summary')}</h2>
                <SafeHtml
                  html={pi.summary}
                  className="text-sm text-slate-700 leading-relaxed break-words"
                />
              </div>
            )}
            {experiences.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h2 className={theme.sectionTitleStyle}>{t('resume.experience')}</h2>
                <div className="space-y-4">
                  {experiences.map((exp) => (
                    <ExperienceBlock key={exp.id} exp={exp} themeId={theme.id} />
                  ))}
                </div>
              </div>
            )}
            {educations.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h2 className={theme.sectionTitleStyle}>{t('resume.education')}</h2>
                <div className="space-y-3">
                  {educations.map((edu) => (
                    <EducationBlock key={edu.id} edu={edu} themeId={theme.id} />
                  ))}
                </div>
              </div>
            )}
            {skills.length > 0 && (
              <div className="bg-sky-50 rounded-2xl p-5 shadow-sm border border-blue-100">
                <h2 className={theme.sectionTitleStyle}>{t('resume.skills')}</h2>
                <SkillsDisplay skills={skills} themeId={theme.id} accentColor={theme.accentColor} />
              </div>
            )}
            {projects.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h2 className={theme.sectionTitleStyle}>{t('resume.projects')}</h2>
                <div className="space-y-4">
                  {projects.map((proj) => (
                    <ProjectBlock key={proj.id} proj={proj} themeId={theme.id} />
                  ))}
                </div>
              </div>
            )}
            {resume.certifications.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h2 className={theme.sectionTitleStyle}>{t('resume.certifications')}</h2>
                <div className="space-y-2">
                  {resume.certifications.map((cert) => (
                    <div key={cert.id}>
                      <span className="font-semibold text-slate-900">{cert.name}</span>
                      {cert.issuer && (
                        <span className="text-slate-600 ml-2 text-sm">{cert.issuer}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(resume.languages.length > 0 || resume.awards.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resume.languages.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h2 className={theme.sectionTitleStyle}>{t('resume.languages')}</h2>
                    <div className="space-y-1">
                      {resume.languages.map((lang) => (
                        <div key={lang.id} className="text-sm">
                          <span className="font-medium text-slate-900">{lang.name}</span>
                          {lang.score && (
                            <span className="text-sky-600 ml-2 font-medium">{lang.score}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {resume.awards.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h2 className={theme.sectionTitleStyle}>{t('resume.awards')}</h2>
                    <div className="space-y-1">
                      {resume.awards.map((award) => (
                        <div key={award.id} className="text-sm">
                          <span className="font-medium text-slate-900">{award.name}</span>
                          {award.issuer && (
                            <span className="text-slate-500 ml-2">{award.issuer}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {resume.activities.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h2 className={theme.sectionTitleStyle}>{t('resume.activities')}</h2>
                <div className="space-y-2">
                  {resume.activities.map((act) => (
                    <div key={act.id}>
                      <span className="font-semibold text-slate-900">{act.name}</span>
                      {act.organization && (
                        <span className="text-slate-600 ml-2 text-sm">{act.organization}</span>
                      )}
                      {act.description && (
                        <SafeHtml html={act.description} className="text-sm text-slate-600 mt-1" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    /* ---- TECH: Terminal-style layout ---- */
    if (theme.id === 'tech') {
      return (
        <div
          ref={ref}
          className="resume-preview bg-[#f6f8fa] max-w-[210mm] mx-auto shadow-lg print:shadow-none overflow-hidden"
          style={{ fontFamily: theme.fontFamily }}
        >
          <header className={theme.headerStyle}>
            <div className="flex items-center gap-2 mb-3 opacity-60">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
              <span className="text-xs text-[#484f58] ml-2 font-mono">resume.json</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#58a6ff] font-mono">
              <span className="text-[#484f58]">$ whoami </span>
              {pi.name || '이름'}
            </h1>
            <div className="mt-3 font-mono text-xs text-[#8b949e] space-y-0.5">
              {pi.email && (
                <div>
                  <span className="text-[#484f58]">email:</span> {pi.email}
                </div>
              )}
              {pi.phone && (
                <div>
                  <span className="text-[#484f58]">phone:</span> {pi.phone}
                </div>
              )}
              {pi.github && (
                <div>
                  <span className="text-[#484f58]">github:</span>{' '}
                  <span className="text-[#58a6ff]">{pi.github}</span>
                </div>
              )}
              {pi.website && (
                <div>
                  <span className="text-[#484f58]">web:</span>{' '}
                  <span className="text-[#58a6ff]">{pi.website}</span>
                </div>
              )}
              {pi.address && (
                <div>
                  <span className="text-[#484f58]">loc:</span> {pi.address}
                </div>
              )}
            </div>
          </header>
          <div className={`p-6 sm:p-8 ${theme.bodyStyle}`}>
            {pi.summary && (
              <Section title={t('resume.summary')} theme={theme} isFirst>
                <div className="bg-[#0d1117] rounded-lg p-4 font-mono text-xs text-[#c9d1d9] border border-[#30363d]">
                  <SafeHtml html={pi.summary} className="leading-relaxed break-words" />
                </div>
              </Section>
            )}
            {experiences.length > 0 && (
              <Section title={t('resume.experience')} theme={theme} isFirst={!pi.summary}>
                <div className="space-y-4">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="border border-[#30363d] rounded-lg bg-white p-4">
                      <ExperienceBlock exp={exp} themeId={theme.id} />
                    </div>
                  ))}
                </div>
              </Section>
            )}
            {educations.length > 0 && (
              <Section title={t('resume.education')} theme={theme}>
                <div className="space-y-3">
                  {educations.map((edu) => (
                    <div key={edu.id} className="border border-[#30363d] rounded-lg bg-white p-4">
                      <EducationBlock edu={edu} themeId={theme.id} />
                    </div>
                  ))}
                </div>
              </Section>
            )}
            {skills.length > 0 && (
              <Section title={t('resume.skills')} theme={theme}>
                <div className="bg-[#0d1117] rounded-lg p-4 border border-[#30363d]">
                  <SkillsDisplay
                    skills={skills}
                    themeId={theme.id}
                    accentColor={theme.accentColor}
                  />
                </div>
              </Section>
            )}
            {projects.length > 0 && (
              <Section title={t('resume.projects')} theme={theme}>
                <div className="space-y-4">
                  {projects.map((proj) => (
                    <div key={proj.id} className="border border-[#30363d] rounded-lg bg-white p-4">
                      <ProjectBlock proj={proj} themeId={theme.id} />
                    </div>
                  ))}
                </div>
              </Section>
            )}
            <RemainingContent resume={resume} theme={theme} sectionIndex={sectionCount} />
          </div>
        </div>
      );
    }

    /* ---- ELEGANT: Centered headers, ornamental dividers ---- */
    if (theme.id === 'elegant') {
      return (
        <div
          ref={ref}
          className="resume-preview bg-white max-w-[210mm] mx-auto shadow-lg print:shadow-none overflow-hidden"
          style={{ fontFamily: theme.fontFamily }}
        >
          <header className={theme.headerStyle}>
            {hasPhoto && (
              <div className="flex justify-center mb-4">
                <img
                  src={pi.photo}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-[90px] h-[90px] object-cover rounded-full border-2 border-amber-300 shadow-md"
                />
              </div>
            )}
            <h1
              className="text-3xl sm:text-4xl font-light text-slate-900 tracking-wide"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif KR', serif" }}
            >
              {pi.name || '이름'}
            </h1>
            <div className="mt-2 text-amber-700 text-xs tracking-[0.2em]">
              {[pi.email, pi.phone, pi.address].filter(Boolean).join('  ·  ')}
            </div>
            {(pi.website || pi.github) && (
              <div className="mt-1 text-amber-600 text-xs">
                {[pi.website, pi.github].filter(Boolean).join('  ·  ')}
              </div>
            )}
          </header>
          <div className={`px-8 sm:px-14 pb-10 ${theme.bodyStyle}`}>
            {pi.summary && (
              <Section title={t('resume.summary')} theme={theme} isFirst>
                <SafeHtml
                  html={pi.summary}
                  className="text-sm text-slate-600 leading-relaxed break-words text-center italic"
                />
              </Section>
            )}
            {experiences.length > 0 && (
              <Section title={t('resume.experience')} theme={theme} isFirst={!pi.summary}>
                <div className="space-y-5">
                  {experiences.map((exp) => (
                    <ExperienceBlock key={exp.id} exp={exp} themeId={theme.id} />
                  ))}
                </div>
              </Section>
            )}
            {educations.length > 0 && (
              <Section title={t('resume.education')} theme={theme}>
                <div className="space-y-3">
                  {educations.map((edu) => (
                    <EducationBlock key={edu.id} edu={edu} themeId={theme.id} />
                  ))}
                </div>
              </Section>
            )}
            {skills.length > 0 && (
              <Section title={t('resume.skills')} theme={theme}>
                <SkillsDisplay skills={skills} themeId={theme.id} accentColor={theme.accentColor} />
              </Section>
            )}
            {projects.length > 0 && (
              <Section title={t('resume.projects')} theme={theme}>
                <div className="space-y-5">
                  {projects.map((proj) => (
                    <ProjectBlock key={proj.id} proj={proj} themeId={theme.id} />
                  ))}
                </div>
              </Section>
            )}
            <RemainingContent resume={resume} theme={theme} sectionIndex={sectionCount} />
          </div>
        </div>
      );
    }

    /* ---- NEWSPAPER: Two-column layout ---- */
    if (theme.id === 'newspaper') {
      return (
        <div
          ref={ref}
          className="resume-preview bg-white max-w-[210mm] mx-auto shadow-lg print:shadow-none overflow-hidden"
          style={{ fontFamily: theme.fontFamily }}
        >
          <header className={theme.headerStyle}>
            <h1
              className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight"
              style={{ fontFamily: "'Georgia', 'Noto Serif KR', serif" }}
            >
              {pi.name || '이름'}
            </h1>
            <div className="mt-2 text-xs text-slate-600 tracking-wider flex flex-wrap justify-center gap-x-3">
              {pi.email && <span>{pi.email}</span>}
              {pi.phone && <span>{pi.phone}</span>}
              {pi.address && <span>{pi.address}</span>}
            </div>
            {(pi.website || pi.github) && (
              <div className="mt-1 text-xs text-slate-500 flex flex-wrap justify-center gap-x-3">
                {pi.website && <span>{pi.website}</span>}
                {pi.github && <span>{pi.github}</span>}
              </div>
            )}
          </header>
          <div className={`px-6 sm:px-8 pb-8 ${theme.bodyStyle}`} style={{ textAlign: 'justify' }}>
            {pi.summary && (
              <Section title={t('resume.summary')} theme={theme} isFirst>
                <SafeHtml
                  html={pi.summary}
                  className="text-sm text-slate-700 leading-relaxed break-words"
                />
              </Section>
            )}
            {/* Two-column: experience left, education+skills right */}
            <ThemeSeparator themeId="newspaper" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                {experiences.length > 0 && (
                  <section className="mb-4">
                    <h2 className={theme.sectionTitleStyle}>{t('resume.experience')}</h2>
                    <div className="space-y-4">
                      {experiences.map((exp) => (
                        <ExperienceBlock key={exp.id} exp={exp} themeId={theme.id} />
                      ))}
                    </div>
                  </section>
                )}
                {projects.length > 0 && (
                  <section className="mb-4">
                    <h2 className={theme.sectionTitleStyle}>{t('resume.projects')}</h2>
                    <div className="space-y-4">
                      {projects.map((proj) => (
                        <ProjectBlock key={proj.id} proj={proj} themeId={theme.id} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
              <div>
                {educations.length > 0 && (
                  <section className="mb-4">
                    <h2 className={theme.sectionTitleStyle}>{t('resume.education')}</h2>
                    <div className="space-y-3">
                      {educations.map((edu) => (
                        <EducationBlock key={edu.id} edu={edu} themeId={theme.id} />
                      ))}
                    </div>
                  </section>
                )}
                {skills.length > 0 && (
                  <section className="mb-4">
                    <h2 className={theme.sectionTitleStyle}>{t('resume.skills')}</h2>
                    <SkillsDisplay
                      skills={skills}
                      themeId={theme.id}
                      accentColor={theme.accentColor}
                    />
                  </section>
                )}
                {resume.certifications.length > 0 && (
                  <section className="mb-4">
                    <h2 className={theme.sectionTitleStyle}>{t('resume.certifications')}</h2>
                    <div className="space-y-1 text-sm">
                      {resume.certifications.map((cert) => (
                        <div key={cert.id}>
                          <span className="font-semibold">{cert.name}</span>
                          {cert.issuer && (
                            <span className="text-slate-500 ml-1">({cert.issuer})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                {resume.languages.length > 0 && (
                  <section className="mb-4">
                    <h2 className={theme.sectionTitleStyle}>{t('resume.languages')}</h2>
                    <div className="space-y-1 text-sm">
                      {resume.languages.map((lang) => (
                        <div key={lang.id}>
                          <span className="font-semibold">{lang.name}</span>
                          {lang.score && <span className="text-slate-600 ml-1">{lang.score}</span>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
            {/* Bottom full-width for awards/activities */}
            {(resume.awards.length > 0 || resume.activities.length > 0) && (
              <>
                <ThemeSeparator themeId="newspaper" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  {resume.awards.length > 0 && (
                    <section>
                      <h2 className={theme.sectionTitleStyle}>{t('resume.awards')}</h2>
                      <div className="space-y-1 text-sm">
                        {resume.awards.map((award) => (
                          <div key={award.id}>
                            <span className="font-semibold">{award.name}</span>
                            {award.issuer && (
                              <span className="text-slate-500 ml-1">({award.issuer})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                  {resume.activities.length > 0 && (
                    <section>
                      <h2 className={theme.sectionTitleStyle}>{t('resume.activities')}</h2>
                      <div className="space-y-1 text-sm">
                        {resume.activities.map((act) => (
                          <div key={act.id}>
                            <span className="font-semibold">{act.name}</span>
                            {act.organization && (
                              <span className="text-slate-500 ml-1">({act.organization})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    /* ---- EXECUTIVE: Large serif headings, generous spacing ---- */
    if (theme.id === 'executive') {
      return (
        <div
          ref={ref}
          className="resume-preview bg-white px-8 sm:px-14 py-10 sm:py-14 max-w-[210mm] mx-auto shadow-lg print:shadow-none print:p-0 overflow-hidden"
          style={{ fontFamily: theme.fontFamily }}
        >
          <header className={theme.headerStyle}>
            <h1
              className="text-4xl sm:text-5xl font-light text-slate-900 tracking-wide"
              style={{ fontFamily: "'Georgia', 'Noto Serif KR', serif" }}
            >
              {pi.name || '이름'}
            </h1>
            <div className="mt-4 text-sm text-slate-500 tracking-wider">
              {[pi.email, pi.phone, pi.address].filter(Boolean).join('  |  ')}
            </div>
            {(pi.website || pi.github) && (
              <div className="mt-1 text-sm text-slate-400">
                {[pi.website, pi.github].filter(Boolean).join('  |  ')}
              </div>
            )}
          </header>
          <div className={`${theme.bodyStyle} space-y-0`}>
            {pi.summary && (
              <Section title={t('resume.summary')} theme={theme} isFirst>
                <SafeHtml
                  html={pi.summary}
                  className="text-base text-slate-600 leading-[1.9] break-words"
                />
              </Section>
            )}
            {experiences.length > 0 && (
              <Section title={t('resume.experience')} theme={theme} isFirst={!pi.summary}>
                <div className="space-y-7">
                  {experiences.map((exp) => (
                    <ExperienceBlock key={exp.id} exp={exp} themeId={theme.id} />
                  ))}
                </div>
              </Section>
            )}
            {educations.length > 0 && (
              <Section title={t('resume.education')} theme={theme}>
                <div className="space-y-4">
                  {educations.map((edu) => (
                    <EducationBlock key={edu.id} edu={edu} themeId={theme.id} />
                  ))}
                </div>
              </Section>
            )}
            {skills.length > 0 && (
              <Section title={t('resume.skills')} theme={theme}>
                <SkillsDisplay skills={skills} themeId={theme.id} accentColor={theme.accentColor} />
              </Section>
            )}
            {projects.length > 0 && (
              <Section title={t('resume.projects')} theme={theme}>
                <div className="space-y-7">
                  {projects.map((proj) => (
                    <ProjectBlock key={proj.id} proj={proj} themeId={theme.id} />
                  ))}
                </div>
              </Section>
            )}
            <RemainingContent resume={resume} theme={theme} sectionIndex={sectionCount} />
          </div>
        </div>
      );
    }

    /* ---- PORTFOLIO: Large visual header, grid skills, project cards ---- */
    if (theme.id === 'portfolio') {
      return (
        <div
          ref={ref}
          className="resume-preview bg-white max-w-[210mm] mx-auto shadow-lg print:shadow-none overflow-hidden"
          style={{ fontFamily: theme.fontFamily }}
        >
          <header className={theme.headerStyle}>
            <div className="text-center">
              {hasPhoto && (
                <div className="flex justify-center mb-5">
                  <img
                    src={pi.photo}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-[120px] h-[120px] object-cover rounded-full border-4 border-white/30 shadow-xl"
                  />
                </div>
              )}
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                {pi.name || '이름'}
              </h1>
              <div className="mt-3 text-white/70 text-sm space-y-1">
                <div className="flex flex-wrap justify-center gap-x-4">
                  {pi.email && <span>{pi.email}</span>}
                  {pi.phone && <span>{pi.phone}</span>}
                </div>
                <div className="flex flex-wrap justify-center gap-x-4">
                  {pi.website && <span>{pi.website}</span>}
                  {pi.github && <span>{pi.github}</span>}
                </div>
              </div>
            </div>
          </header>
          <div className="p-6 sm:p-10">
            {pi.summary && (
              <Section title={t('resume.summary')} theme={theme} isFirst>
                <SafeHtml
                  html={pi.summary}
                  className="text-sm text-slate-700 leading-relaxed break-words"
                />
              </Section>
            )}
            {experiences.length > 0 && (
              <Section title={t('resume.experience')} theme={theme} isFirst={!pi.summary}>
                <div className="space-y-5">
                  {experiences.map((exp) => (
                    <ExperienceBlock key={exp.id} exp={exp} themeId={theme.id} />
                  ))}
                </div>
              </Section>
            )}
            {/* Projects as grid cards */}
            {projects.length > 0 && (
              <Section title={t('resume.projects')} theme={theme}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-slate-50 to-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="h-20 bg-gradient-to-br from-blue-100 via-sky-50 to-cyan-100 rounded-lg mb-3 flex items-center justify-center">
                        <span className="text-2xl text-sky-300 select-none">&#9998;</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">{proj.name}</h3>
                      {proj.role && <div className="text-xs text-sky-600 mt-0.5">{proj.role}</div>}
                      {proj.description && (
                        <SafeHtml
                          html={proj.description}
                          className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3 break-words"
                        />
                      )}
                      {proj.techStack && (
                        <TechTags text={proj.techStack} color="blue" themeId={theme.id} />
                      )}
                      {proj.link && (
                        <p className="text-xs text-sky-700 mt-2 break-all">{proj.link}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}
            {skills.length > 0 && (
              <Section title={t('resume.skills')} theme={theme}>
                <SkillsDisplay skills={skills} themeId={theme.id} accentColor={theme.accentColor} />
              </Section>
            )}
            {educations.length > 0 && (
              <Section title={t('resume.education')} theme={theme}>
                <div className="space-y-3">
                  {educations.map((edu) => (
                    <EducationBlock key={edu.id} edu={edu} themeId={theme.id} />
                  ))}
                </div>
              </Section>
            )}
            <RemainingContent resume={resume} theme={theme} sectionIndex={sectionCount} />
          </div>
        </div>
      );
    }

    /* ---- DEFAULT: Classic / Professional / all other themes ---- */
    const wrapperStyle: React.CSSProperties = {
      fontFamily: customFont || theme.fontFamily,
      ...(customAccentHex ? ({ '--resume-accent': customAccentHex } as any) : {}),
    };

    return (
      <div
        ref={ref}
        className={`resume-preview bg-white p-6 sm:p-10 max-w-[210mm] mx-auto shadow-lg print:shadow-none print:p-0 ${theme.bodyStyle} overflow-hidden`}
        style={wrapperStyle}
        data-custom-accent={customAccentHex ? 'true' : undefined}
      >
        {customAccentHex && (
          <style>{`
          [data-custom-accent="true"] .section-title-accent,
          [data-custom-accent="true"] .accent-border,
          [data-custom-accent="true"] .accent-text {
            border-color: ${customAccentHex} !important;
            color: ${customAccentHex} !important;
          }
          [data-custom-accent="true"] .accent-bg {
            background-color: ${customAccentHex} !important;
          }
          [data-custom-accent="true"] .accent-bg-light {
            background-color: ${customAccentHex}18 !important;
          }
        `}</style>
        )}
        <header className={theme.headerStyle}>{headerContent}</header>
        {standardContent}
      </div>
    );
  },
);

ResumePreview.displayName = 'ResumePreview';

export default memo(ResumePreview);
