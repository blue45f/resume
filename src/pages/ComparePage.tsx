import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fetchResumes, fetchResume } from '@/lib/api';
import { calculateCompleteness } from '@/lib/completeness';
import type { Resume, ResumeSummary } from '@/types/resume';

/** Analyze strengths and weaknesses of a resume compared to another */
function analyzeResume(resume: Resume, other: Resume): { strengths: string[]; weaknesses: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const comp = calculateCompleteness(resume);
  const otherComp = calculateCompleteness(other);

  // Personal info
  const pi = resume.personalInfo;
  if (pi.summary && pi.summary.replace(/<[^>]*>/g, '').length > 100) strengths.push('상세한 자기소개');
  else if (!pi.summary || pi.summary.replace(/<[^>]*>/g, '').length < 30) weaknesses.push('자기소개가 부족합니다');
  if (pi.github || pi.website) strengths.push('포트폴리오/깃허브 링크 포함');
  if (pi.photo) strengths.push('프로필 사진 포함');

  // Experiences
  if (resume.experiences.length > other.experiences.length) strengths.push(`경력 사항이 더 풍부 (${resume.experiences.length}개)`);
  else if (resume.experiences.length < other.experiences.length) weaknesses.push(`경력 사항이 상대적으로 적음 (${resume.experiences.length}개 vs ${other.experiences.length}개)`);
  const hasDetailedExp = resume.experiences.some(e => e.description && e.description.length > 80);
  if (hasDetailedExp) strengths.push('경력 업무 내용 상세 기술');
  else if (resume.experiences.length > 0) weaknesses.push('경력 업무 내용을 더 상세히 작성하세요');
  const hasTechInExp = resume.experiences.some(e => e.techStack);
  if (hasTechInExp) strengths.push('경력에 기술 스택 명시');

  // Skills
  const mySkillCount = resume.skills.reduce((s, sk) => s + sk.items.split(',').filter(Boolean).length, 0);
  const otherSkillCount = other.skills.reduce((s, sk) => s + sk.items.split(',').filter(Boolean).length, 0);
  if (mySkillCount > otherSkillCount) strengths.push(`기술 스택이 더 다양 (${mySkillCount}개)`);
  else if (mySkillCount < otherSkillCount) weaknesses.push(`기술 스택이 상대적으로 적음 (${mySkillCount}개 vs ${otherSkillCount}개)`);

  // Projects
  if (resume.projects.length > 0 && other.projects.length === 0) strengths.push('프로젝트 경험 포함');
  else if (resume.projects.length === 0 && other.projects.length > 0) weaknesses.push('프로젝트 경험이 없음');

  // Certifications
  if (resume.certifications.length > 0) strengths.push(`자격증 보유 (${resume.certifications.length}개)`);
  else if (other.certifications.length > 0) weaknesses.push('자격증이 없음');

  // Languages
  if (resume.languages.length > other.languages.length) strengths.push('어학 능력 우수');
  else if (resume.languages.length < other.languages.length) weaknesses.push('어학 점수 추가 권장');

  // Overall completeness
  if (comp.percentage > otherComp.percentage) strengths.push(`전체 완성도가 더 높음 (${comp.percentage}%)`);
  else if (comp.percentage < otherComp.percentage) weaknesses.push(`완성도를 높이세요 (${comp.percentage}% vs ${otherComp.percentage}%)`);

  return { strengths: strengths.slice(0, 6), weaknesses: weaknesses.slice(0, 6) };
}

export default function ComparePage() {
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');
  const [left, setLeft] = useState<Resume | null>(null);
  const [right, setRight] = useState<Resume | null>(null);
  useEffect(() => { fetchResumes().then(setResumes).catch(() => {}); }, []);

  useEffect(() => {
    document.title = '이력서 비교 — 이력서공방';
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  useEffect(() => {
    if (leftId) fetchResume(leftId).then(setLeft).catch(() => setLeft(null));
    else setLeft(null);
  }, [leftId]);

  useEffect(() => {
    if (rightId) fetchResume(rightId).then(setRight).catch(() => setRight(null));
    else setRight(null);
  }, [rightId]);

  const sections = [
    { key: 'experiences', label: '경력', count: (r: Resume) => r.experiences.length },
    { key: 'educations', label: '학력', count: (r: Resume) => r.educations.length },
    { key: 'skills', label: '기술', count: (r: Resume) => r.skills.reduce((s, sk) => s + sk.items.split(',').length, 0) },
    { key: 'projects', label: '프로젝트', count: (r: Resume) => r.projects.length },
    { key: 'certifications', label: '자격증', count: (r: Resume) => r.certifications.length },
    { key: 'languages', label: '어학', count: (r: Resume) => r.languages.length },
    { key: 'awards', label: '수상', count: (r: Resume) => r.awards.length },
    { key: 'activities', label: '활동', count: (r: Resume) => r.activities.length },
  ];

  const Selector = ({ value, onChange, exclude }: { value: string; onChange: (v: string) => void; exclude: string }) => (
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2.5 min-h-[44px] border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
      <option value="">이력서 선택</option>
      {resumes.filter(r => r.id !== exclude).map(r => (
        <option key={r.id} value={r.id}>{r.title || '제목 없음'}</option>
      ))}
    </select>
  );

  const leftAnalysis = useMemo(() => left && right ? analyzeResume(left, right) : null, [left, right]);
  const rightAnalysis = useMemo(() => left && right ? analyzeResume(right, left) : null, [left, right]);

  // Compute skill diff between resumes
  const skillDiff = useMemo(() => {
    if (!left || !right) return { onlyLeft: [] as string[], onlyRight: [] as string[], shared: [] as string[] };
    const leftSkills = new Set(left.skills.flatMap(sk => sk.items.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)));
    const rightSkills = new Set(right.skills.flatMap(sk => sk.items.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)));
    const shared = [...leftSkills].filter(s => rightSkills.has(s));
    const onlyLeft = [...leftSkills].filter(s => !rightSkills.has(s));
    const onlyRight = [...rightSkills].filter(s => !leftSkills.has(s));
    return { shared, onlyLeft, onlyRight };
  }, [left, right]);

  const CompareBar = ({ label, leftVal, rightVal }: { label: string; leftVal: number; rightVal: number }) => {
    const max = Math.max(leftVal, rightVal, 1);
    return (
      <div className="py-2.5 sm:py-2">
        <div className="flex items-center justify-between mb-1.5 sm:hidden">
          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{label}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{leftVal} vs {rightVal}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 w-16 text-right tabular-nums hidden sm:block">{leftVal}</span>
          <div className="flex-1 flex gap-1 h-6 sm:h-5">
            <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-l-full overflow-hidden flex justify-end">
              <div className="bg-blue-500 rounded-l-full transition-all duration-300" style={{ width: `${(leftVal / max) * 100}%` }} />
            </div>
            <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-r-full overflow-hidden">
              <div className="bg-emerald-500 rounded-r-full transition-all duration-300" style={{ width: `${(rightVal / max) * 100}%` }} />
            </div>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 w-16 tabular-nums hidden sm:block">{rightVal}</span>
          <span className="text-xs text-slate-600 dark:text-slate-300 w-16 font-medium hidden sm:block">{label}</span>
          {/* Section match percentage */}
          <span className={`text-[10px] font-bold w-10 text-right hidden sm:block ${
            leftVal === rightVal ? 'text-slate-400' : leftVal > rightVal ? 'text-blue-500' : 'text-emerald-500'
          }`}>
            {leftVal === rightVal ? '=' : leftVal > rightVal ? `A +${leftVal - rightVal}` : `B +${rightVal - leftVal}`}
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">이력서 비교</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">두 이력서를 선택하여 섹션별 내용을 비교합니다</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-blue-600 mb-1.5">이력서 A</label>
            <Selector value={leftId} onChange={setLeftId} exclude={rightId} />
          </div>
          <div>
            <label className="block text-sm font-medium text-emerald-600 mb-1.5">이력서 B</label>
            <Selector value={rightId} onChange={setRightId} exclude={leftId} />
          </div>
        </div>

        {left && right && (
          <div className="animate-fade-in-up space-y-6">
            {/* Completeness comparison */}
            <div className="imp-card p-5">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">완성도 비교</h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
                <div>
                  <span className="text-2xl sm:text-3xl font-bold text-blue-600">{calculateCompleteness(left).percentage}%</span>
                  <p className="text-xs text-slate-500 mt-1 truncate">{left.title || '제목 없음'}</p>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-bold text-emerald-600">{calculateCompleteness(right).percentage}%</span>
                  <p className="text-xs text-slate-500 mt-1 truncate">{right.title || '제목 없음'}</p>
                </div>
              </div>
            </div>

            {/* Section comparison */}
            <div className="imp-card p-5">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">섹션별 비교</h3>
              <div className="space-y-1">
                {sections.map(s => (
                  <CompareBar
                    key={s.key}
                    label={s.label}
                    leftVal={s.count(left)}
                    rightVal={s.count(right)}
                  />
                ))}
              </div>
              <div className="flex justify-center gap-6 mt-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500" /> 이력서 A</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500" /> 이력서 B</span>
              </div>
            </div>

            {/* Summary comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-800 p-3 sm:p-4">
                <h4 className="text-sm font-semibold text-blue-600 mb-2 truncate">{left.personalInfo.name || '이름 없음'}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-4 break-words">
                  {left.personalInfo.summary?.replace(/<[^>]*>/g, '') || '자기소개 없음'}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800 p-3 sm:p-4">
                <h4 className="text-sm font-semibold text-emerald-600 mb-2 truncate">{right.personalInfo.name || '이름 없음'}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-4 break-words">
                  {right.personalInfo.summary?.replace(/<[^>]*>/g, '') || '자기소개 없음'}
                </p>
              </div>
            </div>

            {/* Visual diff: Skill comparison */}
            <div className="imp-card p-5">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">기술 스택 비교</h3>
              {skillDiff.shared.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">공통 보유 기술</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {skillDiff.shared.map(s => (
                      <span key={s} className="px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg capitalize">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                  <h4 className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1.5">A에만 있는 기술</h4>
                  {skillDiff.onlyLeft.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {skillDiff.onlyLeft.map(s => (
                        <span key={s} className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded capitalize ring-1 ring-blue-200 dark:ring-blue-700">{s}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-blue-400 dark:text-blue-500">없음</p>
                  )}
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                  <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">B에만 있는 기술</h4>
                  {skillDiff.onlyRight.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {skillDiff.onlyRight.map(s => (
                        <span key={s} className="px-2 py-0.5 text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded capitalize ring-1 ring-emerald-200 dark:ring-emerald-700">{s}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-400 dark:text-emerald-500">없음</p>
                  )}
                </div>
              </div>
            </div>

            {/* Side-by-side section detail comparison */}
            <div className="imp-card p-5">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">섹션별 상세 비교</h3>

              {/* Experience comparison */}
              <details className="mb-3 group">
                <summary className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">경력</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-600 font-medium">{left.experiences.length}개</span>
                    <span className="text-xs text-slate-400">vs</span>
                    <span className="text-xs text-emerald-600 font-medium">{right.experiences.length}개</span>
                  </div>
                </summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div className="space-y-2">
                    {left.experiences.length > 0 ? left.experiences.map(exp => (
                      <div key={exp.id} className={`p-2.5 rounded-lg text-xs border-l-3 ${
                        right.experiences.some(re => re.company.toLowerCase() === exp.company.toLowerCase())
                          ? 'bg-slate-50 dark:bg-slate-900 border-l-slate-300'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-l-blue-400'
                      }`}>
                        <p className="font-medium text-slate-700 dark:text-slate-300">{exp.company}</p>
                        <p className="text-slate-500 dark:text-slate-400">{exp.position}</p>
                        <p className="text-slate-400 dark:text-slate-500 mt-0.5">{exp.startDate} ~ {exp.current ? '현재' : exp.endDate}</p>
                      </div>
                    )) : <p className="text-xs text-slate-400 p-2">경력 없음</p>}
                  </div>
                  <div className="space-y-2">
                    {right.experiences.length > 0 ? right.experiences.map(exp => (
                      <div key={exp.id} className={`p-2.5 rounded-lg text-xs border-l-3 ${
                        left.experiences.some(le => le.company.toLowerCase() === exp.company.toLowerCase())
                          ? 'bg-slate-50 dark:bg-slate-900 border-l-slate-300'
                          : 'bg-emerald-50 dark:bg-emerald-900/20 border-l-emerald-400'
                      }`}>
                        <p className="font-medium text-slate-700 dark:text-slate-300">{exp.company}</p>
                        <p className="text-slate-500 dark:text-slate-400">{exp.position}</p>
                        <p className="text-slate-400 dark:text-slate-500 mt-0.5">{exp.startDate} ~ {exp.current ? '현재' : exp.endDate}</p>
                      </div>
                    )) : <p className="text-xs text-slate-400 p-2">경력 없음</p>}
                  </div>
                </div>
              </details>

              {/* Education comparison */}
              <details className="mb-3 group">
                <summary className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">학력</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-600 font-medium">{left.educations.length}개</span>
                    <span className="text-xs text-slate-400">vs</span>
                    <span className="text-xs text-emerald-600 font-medium">{right.educations.length}개</span>
                  </div>
                </summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div className="space-y-2">
                    {left.educations.length > 0 ? left.educations.map(edu => (
                      <div key={edu.id} className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs border-l-3 border-l-blue-400">
                        <p className="font-medium text-slate-700 dark:text-slate-300">{edu.school}</p>
                        <p className="text-slate-500 dark:text-slate-400">{edu.degree} {edu.field}</p>
                      </div>
                    )) : <p className="text-xs text-slate-400 p-2">학력 없음</p>}
                  </div>
                  <div className="space-y-2">
                    {right.educations.length > 0 ? right.educations.map(edu => (
                      <div key={edu.id} className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-xs border-l-3 border-l-emerald-400">
                        <p className="font-medium text-slate-700 dark:text-slate-300">{edu.school}</p>
                        <p className="text-slate-500 dark:text-slate-400">{edu.degree} {edu.field}</p>
                      </div>
                    )) : <p className="text-xs text-slate-400 p-2">학력 없음</p>}
                  </div>
                </div>
              </details>

              {/* Projects comparison */}
              <details className="mb-3 group">
                <summary className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">프로젝트</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-600 font-medium">{left.projects.length}개</span>
                    <span className="text-xs text-slate-400">vs</span>
                    <span className="text-xs text-emerald-600 font-medium">{right.projects.length}개</span>
                  </div>
                </summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div className="space-y-2">
                    {left.projects.length > 0 ? left.projects.map(proj => (
                      <div key={proj.id} className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs border-l-3 border-l-blue-400">
                        <p className="font-medium text-slate-700 dark:text-slate-300">{proj.name}</p>
                        <p className="text-slate-500 dark:text-slate-400">{proj.role}</p>
                        {proj.techStack && <p className="text-slate-400 dark:text-slate-500 mt-0.5">{proj.techStack}</p>}
                      </div>
                    )) : <p className="text-xs text-slate-400 p-2">프로젝트 없음</p>}
                  </div>
                  <div className="space-y-2">
                    {right.projects.length > 0 ? right.projects.map(proj => (
                      <div key={proj.id} className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-xs border-l-3 border-l-emerald-400">
                        <p className="font-medium text-slate-700 dark:text-slate-300">{proj.name}</p>
                        <p className="text-slate-500 dark:text-slate-400">{proj.role}</p>
                        {proj.techStack && <p className="text-slate-400 dark:text-slate-500 mt-0.5">{proj.techStack}</p>}
                      </div>
                    )) : <p className="text-xs text-slate-400 p-2">프로젝트 없음</p>}
                  </div>
                </div>
              </details>
            </div>

            {/* Strengths and Weaknesses */}
            {leftAnalysis && rightAnalysis && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Resume A analysis */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
                  <h3 className="text-sm font-bold text-blue-600 mb-3 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    이력서 A 분석
                  </h3>
                  {leftAnalysis.strengths.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">강점</h4>
                      <ul className="space-y-1">
                        {leftAnalysis.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex gap-1.5">
                            <span className="text-emerald-500 shrink-0">+</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {leftAnalysis.weaknesses.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1.5">약점</h4>
                      <ul className="space-y-1">
                        {leftAnalysis.weaknesses.map((w, i) => (
                          <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex gap-1.5">
                            <span className="text-red-500 shrink-0">-</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Resume B analysis */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4">
                  <h3 className="text-sm font-bold text-emerald-600 mb-3 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    이력서 B 분석
                  </h3>
                  {rightAnalysis.strengths.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">강점</h4>
                      <ul className="space-y-1">
                        {rightAnalysis.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex gap-1.5">
                            <span className="text-emerald-500 shrink-0">+</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {rightAnalysis.weaknesses.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1.5">약점</h4>
                      <ul className="space-y-1">
                        {rightAnalysis.weaknesses.map((w, i) => (
                          <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex gap-1.5">
                            <span className="text-red-500 shrink-0">-</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {(!left || !right) && (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500 animate-fade-in">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">두 이력서를 선택하면 비교가 시작됩니다</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
