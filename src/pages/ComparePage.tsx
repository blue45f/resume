import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fetchResumes, fetchResume } from '@/lib/api';
import { calculateCompleteness } from '@/lib/completeness';
import type { Resume, ResumeSummary } from '@/types/resume';

export default function ComparePage() {
  const [resumes, setResumes] = useState<ResumeSummary[]>([]);
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');
  const [left, setLeft] = useState<Resume | null>(null);
  const [right, setRight] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(false);

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
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
      <option value="">이력서 선택</option>
      {resumes.filter(r => r.id !== exclude).map(r => (
        <option key={r.id} value={r.id}>{r.title || '제목 없음'}</option>
      ))}
    </select>
  );

  const CompareBar = ({ label, leftVal, rightVal }: { label: string; leftVal: number; rightVal: number }) => {
    const max = Math.max(leftVal, rightVal, 1);
    return (
      <div className="py-2">
        <div className="flex items-center justify-between mb-1 sm:hidden">
          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{label}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{leftVal} vs {rightVal}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 w-16 text-right tabular-nums hidden sm:block">{leftVal}</span>
          <div className="flex-1 flex gap-1 h-5">
            <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-l-full overflow-hidden flex justify-end">
              <div className="bg-blue-500 rounded-l-full transition-all duration-300" style={{ width: `${(leftVal / max) * 100}%` }} />
            </div>
            <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-r-full overflow-hidden">
              <div className="bg-emerald-500 rounded-r-full transition-all duration-300" style={{ width: `${(rightVal / max) * 100}%` }} />
            </div>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 w-16 tabular-nums hidden sm:block">{rightVal}</span>
          <span className="text-xs text-slate-600 dark:text-slate-300 w-16 font-medium hidden sm:block">{label}</span>
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
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">완성도 비교</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <span className="text-3xl font-bold text-blue-600">{calculateCompleteness(left).percentage}%</span>
                  <p className="text-xs text-slate-500 mt-1">{left.title || '제목 없음'}</p>
                </div>
                <div>
                  <span className="text-3xl font-bold text-emerald-600">{calculateCompleteness(right).percentage}%</span>
                  <p className="text-xs text-slate-500 mt-1">{right.title || '제목 없음'}</p>
                </div>
              </div>
            </div>

            {/* Section comparison */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
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
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
                <h4 className="text-sm font-semibold text-blue-600 mb-2">{left.personalInfo.name || '이름 없음'}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-4">
                  {left.personalInfo.summary?.replace(/<[^>]*>/g, '') || '자기소개 없음'}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4">
                <h4 className="text-sm font-semibold text-emerald-600 mb-2">{right.personalInfo.name || '이름 없음'}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-4">
                  {right.personalInfo.summary?.replace(/<[^>]*>/g, '') || '자기소개 없음'}
                </p>
              </div>
            </div>
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
