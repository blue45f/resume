import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ErrorRetry from '@/components/ErrorRetry';
import CompanyInfoCard from '@/components/CompanyInfoCard';
import JobAlert from '@/components/JobAlert';
import { getUser } from '@/lib/auth';
import { timeAgo } from '@/lib/time';
import { API_URL } from '@/lib/config';
import { fetchResumes, createApplication } from '@/lib/api';
import { toast } from '@/components/Toast';
import type { ResumeSummary } from '@/types/resume';

/* ------------------------------------------------------------------ */
/*  One-Click Apply: localStorage tracking for applied jobs            */
/* ------------------------------------------------------------------ */
const APPLIED_STORAGE_KEY = 'applied-jobs';
const SAVED_JOBS_KEY = 'saved-jobs';

function getAppliedJobs(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(APPLIED_STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function addAppliedJob(jobId: string) {
  const applied = getAppliedJobs();
  applied.add(jobId);
  localStorage.setItem(APPLIED_STORAGE_KEY, JSON.stringify(Array.from(applied)));
}

function getSavedJobs(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SAVED_JOBS_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function toggleSavedJob(jobId: string): boolean {
  const saved = getSavedJobs();
  if (saved.has(jobId)) {
    saved.delete(jobId);
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(Array.from(saved)));
    return false;
  } else {
    saved.add(jobId);
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(Array.from(saved)));
    return true;
  }
}

/* ------------------------------------------------------------------ */
/*  Salary utilities                                                    */
/* ------------------------------------------------------------------ */
const MARKET_AVG_SALARY: Record<string, number> = {
  fulltime: 5000, contract: 4200, parttime: 2500, intern: 2400,
};

function parseSalaryRange(salary: string): { min: number; max: number } | null {
  if (!salary) return null;
  const nums = salary.match(/\d[\d,]*/g);
  if (!nums || nums.length === 0) return null;
  const values = nums.map(n => parseInt(n.replace(/,/g, ''), 10));
  // Normalize: if values are < 100 they are in 만원 units already, otherwise convert
  const normalized = values.map(v => (v > 10000 ? Math.round(v / 10000) : v > 100 ? Math.round(v / 100) : v));
  if (normalized.length === 1) return { min: normalized[0], max: normalized[0] };
  return { min: Math.min(...normalized), max: Math.max(...normalized) };
}

function getSalaryComparisonBadge(salary: string, jobType: string): { text: string; color: string } | null {
  const range = parseSalaryRange(salary);
  if (!range) return null;
  const avg = MARKET_AVG_SALARY[jobType] || 4500;
  const midSalary = (range.min + range.max) / 2;
  // Treat midSalary in 만원 units; avg is also in 만원
  const diffPct = Math.round(((midSalary - avg) / avg) * 100);
  if (Math.abs(diffPct) < 3) return null;
  if (diffPct > 0) {
    return {
      text: `시장 평균 대비 +${diffPct}%`,
      color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    };
  }
  return {
    text: `시장 평균 대비 ${diffPct}%`,
    color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  };
}

/* Salary contribution modal */
function SalaryContributeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ company: '', position: '', salary: '', experience: '3', anonymous: true });
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/salary-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(form),
    }).catch(() => {});
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-md mx-4 p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">급여 정보 제공하기</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {submitted ? (
          <div className="text-center py-8">
            <span className="text-4xl">🙏</span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-3">감사합니다!</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">익명으로 안전하게 반영됩니다.</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700">닫기</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">모든 정보는 익명으로 처리되며, 급여 통계에만 활용됩니다.</p>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">회사명</label>
              <input required value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="예: 네이버" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">포지션</label>
              <input required value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="예: 프론트엔드 개발자" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">연봉 (만원)</label>
                <input required type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="5000" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">경력 (년)</label>
                <input type="number" min={0} max={30} value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.anonymous} onChange={e => setForm(f => ({ ...f, anonymous: e.target.checked }))} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              익명으로 제출
            </label>
            <button type="submit" className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
              제출하기
            </button>
          </form>
        )}
      </div>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/*  External Job Site Links (API-backed, multi-filter)                 */
/* ------------------------------------------------------------------ */
interface ExternalLink {
  id: string; name: string; url: string; logoEmoji: string; badgeText: string;
  description: string; gradientFrom: string; gradientTo: string;
  category: string; companySize: string; careerLevel: string;
  location: string; jobCategory: string; jobTypes: string; clickCount: number;
  matchKeywords: string;
}

/** 외부 링크의 matchKeywords와 내부 공고 company가 매칭되면 해당 공고 목록 반환 */
function findMatchedJobs(link: ExternalLink, internalJobs: JobPost[]): JobPost[] {
  if (!link.matchKeywords) return [];
  const keywords = link.matchKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
  return internalJobs.filter(job => {
    const company = (job.company || job.user?.companyName || '').toLowerCase();
    return keywords.some(kw => company.includes(kw) || kw.includes(company.split(' ')[0]));
  });
}

const COMPANY_SIZE_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: 'conglomerate', label: '대기업' },
  { key: 'public', label: '공기업' },
  { key: 'government', label: '공무원' },
  { key: 'medium', label: '중소기업' },
  { key: 'startup', label: '스타트업' },
  { key: 'small', label: '소규모(10인 미만)' },
];

const CAREER_LEVEL_EXT_OPTIONS = [
  { key: 'all', label: '전 경력' },
  { key: 'junior', label: '신입/인턴' },
  { key: 'mid', label: '경력 3~7년' },
  { key: 'senior', label: '시니어 7년+' },
];

const JOB_CATEGORY_OPTIONS = [
  { key: 'all', label: '전 직종' },
  { key: 'it', label: 'IT/개발' },
  { key: 'planning', label: '기획/PM' },
  { key: 'design', label: '디자인' },
  { key: 'marketing', label: '마케팅/광고' },
  { key: 'finance', label: '금융/회계' },
  { key: 'sales', label: '영업/판매' },
  { key: 'hr', label: '인사/총무' },
  { key: 'manufacturing', label: '생산/제조' },
  { key: 'education', label: '교육' },
  { key: 'medical', label: '의료/보건' },
  { key: 'legal', label: '법무/법조' },
  { key: 'service', label: '서비스/유통' },
  { key: 'research', label: '연구/R&D' },
];

const JOB_TYPE_EXT_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: 'fulltime', label: '정규직' },
  { key: 'contract', label: '계약직' },
  { key: 'parttime', label: '파트타임' },
  { key: 'intern', label: '인턴' },
  { key: 'freelance', label: '프리랜서' },
];

const LOCATION_EXT_OPTIONS = [
  { key: 'all', label: '전국' },
  { key: 'seoul', label: '서울' },
  { key: 'gyeonggi', label: '경기' },
  { key: 'busan', label: '부산' },
  { key: 'daegu', label: '대구' },
  { key: 'remote', label: '재택/원격' },
  { key: 'nationwide', label: '전국 가능' },
  { key: 'global', label: '해외/글로벌' },
];

function ExternalJobLinks({ internalJobs, onDirectApply }: { internalJobs: JobPost[]; onDirectApply: (job: JobPost) => void }) {
  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [companySize, setCompanySize] = useState('all');
  const [careerLevel, setCareerLevel] = useState('all');
  const [jobCategory, setJobCategory] = useState('all');
  const [jobType, setJobType] = useState('all');
  const [location, setLocation] = useState('all');
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [matchModal, setMatchModal] = useState<{ link: ExternalLink; jobs: JobPost[] } | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (companySize !== 'all') params.set('companySize', companySize);
    if (careerLevel !== 'all') params.set('careerLevel', careerLevel);
    if (jobCategory !== 'all') params.set('jobCategory', jobCategory);
    if (jobType !== 'all') params.set('jobType', jobType);
    if (location !== 'all') params.set('location', location);
    if (q) params.set('q', q);
    fetch(`${API_URL}/api/jobs/external-links/list?${params}`)
      .then(r => r.json())
      .then(data => { setLinks(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [companySize, careerLevel, jobCategory, jobType, location, q]);

  const handleClick = async (link: ExternalLink) => {
    fetch(`${API_URL}/api/jobs/external-links/${link.id}/click`, { method: 'POST' }).catch(() => {});
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const handleCardClick = (link: ExternalLink) => {
    const matched = findMatchedJobs(link, internalJobs);
    if (matched.length > 0) {
      setMatchModal({ link, jobs: matched });
    } else {
      handleClick(link);
    }
  };

  const visible = expanded ? links : links.slice(0, 8);

  const filterBtnClass = (active: boolean) =>
    `px-2.5 py-1 text-[11px] font-medium rounded-full whitespace-nowrap transition-colors ${
      active ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`;

  return (
    <div className="mb-6 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/60 dark:to-blue-900/20 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
      {/* Match Modal */}
      {matchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setMatchModal(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm" style={{ background: `linear-gradient(135deg, ${matchModal.link.gradientFrom}, ${matchModal.link.gradientTo})` }}>
                  {matchModal.link.logoEmoji}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{matchModal.link.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{matchModal.link.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span className="text-emerald-600 dark:text-emerald-400 text-sm">✅</span>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  이력서공방에 <span className="font-bold">{matchModal.jobs.length}개</span>의 직접 지원 가능한 공고가 있습니다!
                </p>
              </div>
            </div>

            {/* Internal Jobs */}
            <div className="p-5 space-y-3 max-h-64 overflow-y-auto">
              {matchModal.jobs.map(job => (
                <div key={job.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{job.position}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{job.company} · {JOB_TYPES[job.type] || job.type}</p>
                    {job.salary && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{job.salary}</p>}
                  </div>
                  <button
                    onClick={() => { setMatchModal(null); onDirectApply(job); }}
                    className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    지원하기
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
              <button
                onClick={() => { handleClick(matchModal.link); setMatchModal(null); }}
                className="flex-1 py-2 text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                외부 사이트로 이동 →
              </button>
              <button onClick={() => setMatchModal(null)} className="px-4 py-2 text-xs bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🔗</span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">주요 채용 사이트 바로가기</span>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full">{links.length}개</span>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors">
          {expanded ? '접기' : '전체보기'}
          <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <form onSubmit={e => { e.preventDefault(); setQ(searchInput); }} className="flex gap-2 mb-3">
        <input
          type="search" value={searchInput} onChange={e => setSearchInput(e.target.value)}
          placeholder="사이트명, 직종 검색..."
          className="flex-1 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">검색</button>
        {q && <button type="button" onClick={() => { setQ(''); setSearchInput(''); }} className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors">✕</button>}
      </form>

      {/* Filters */}
      <div className="space-y-2 mb-4">
        {/* 기업 규모 */}
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center w-12 shrink-0">기업규모</span>
          {COMPANY_SIZE_OPTIONS.map(o => (
            <button key={o.key} onClick={() => setCompanySize(o.key)} className={filterBtnClass(companySize === o.key)}>{o.label}</button>
          ))}
        </div>
        {/* 직종 */}
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center w-12 shrink-0">직종</span>
          {JOB_CATEGORY_OPTIONS.map(o => (
            <button key={o.key} onClick={() => setJobCategory(o.key)} className={filterBtnClass(jobCategory === o.key)}>{o.label}</button>
          ))}
        </div>
        {/* 경력 + 고용형태 */}
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center w-12 shrink-0">경력</span>
          {CAREER_LEVEL_EXT_OPTIONS.map(o => (
            <button key={o.key} onClick={() => setCareerLevel(o.key)} className={filterBtnClass(careerLevel === o.key)}>{o.label}</button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center w-12 shrink-0">고용</span>
          {JOB_TYPE_EXT_OPTIONS.map(o => (
            <button key={o.key} onClick={() => setJobType(o.key)} className={filterBtnClass(jobType === o.key)}>{o.label}</button>
          ))}
        </div>
        {/* 지역 */}
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center w-12 shrink-0">지역</span>
          {LOCATION_EXT_OPTIONS.map(o => (
            <button key={o.key} onClick={() => setLocation(o.key)} className={filterBtnClass(location === o.key)}>{o.label}</button>
          ))}
        </div>
      </div>

      {/* Links grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-6 text-sm text-slate-400 dark:text-slate-500">조건에 맞는 채용 사이트가 없습니다</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {visible.map(link => {
            const matched = findMatchedJobs(link, internalJobs);
            const hasMatch = matched.length > 0;
            return (
              <button
                key={link.id}
                onClick={() => handleCardClick(link)}
                className={`group relative flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border transition-all duration-200 text-left ${
                  hasMatch
                    ? 'border-emerald-300 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md ring-1 ring-emerald-200 dark:ring-emerald-800'
                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                }`}
              >
                {/* 직접 지원 가능 배지 */}
                {hasMatch && (
                  <span className="absolute -top-1.5 -right-1.5 z-10 px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full shadow-sm">
                    직접지원 {matched.length}
                  </span>
                )}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${link.gradientFrom}, ${link.gradientTo})` }}
                >
                  {link.logoEmoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-xs font-bold leading-tight transition-colors ${hasMatch ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                      {link.name}
                    </span>
                    {link.badgeText && <span className="px-1 py-0.5 text-[9px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded">{link.badgeText}</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{link.description}</p>
                  {hasMatch && (
                    <p className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">✅ 이력서공방에서 직접 지원 가능</p>
                  )}
                </div>
                {!hasMatch && (
                  <svg className="w-3 h-3 text-slate-300 group-hover:text-blue-400 transition-colors ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
      {links.length > 8 && (
        <button onClick={() => setExpanded(e => !e)} className="w-full mt-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          {expanded ? `▲ 접기` : `▼ ${links.length - 8}개 더 보기`}
        </button>
      )}
    </div>
  );
}

interface JobPost {
  id: string;
  company: string;
  position: string;
  location: string;
  salary: string;
  type: string;
  skills: string;
  description: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; companyName?: string };
}

const JOB_TYPES: Record<string, string> = {
  fulltime: '정규직', contract: '계약직', parttime: '파트타임', intern: '인턴',
};

const SKILL_COLORS = [
  { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
  { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
  { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
  { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400' },
  { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400' },
];

function getSkillColor(index: number) {
  return SKILL_COLORS[index % SKILL_COLORS.length];
}

/** Calculate match score between user skills and job required skills */
function calculateMatchScore(userSkills: Set<string>, jobSkills: string): number {
  if (!jobSkills || userSkills.size === 0) return 0;
  const required = jobSkills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (required.length === 0) return 0;
  const matched = required.filter(s => userSkills.has(s));
  return Math.round((matched.length / required.length) * 100);
}

function MatchBadge({ score }: { score: number }) {
  if (score <= 0) return null;
  let colorClass = '';
  if (score >= 80) colorClass = 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
  else if (score >= 60) colorClass = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
  else if (score >= 30) colorClass = 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
  else colorClass = 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';

  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-md border ${colorClass}`} title="매칭률">
      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
      {score}%
    </span>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [userResumes, setUserResumes] = useState<ResumeSummary[]>([]);
  const [salaryMin, setSalaryMin] = useState(0);
  const [salaryMax, setSalaryMax] = useState(20000);
  const [salaryFilterEnabled, setSalaryFilterEnabled] = useState(false);
  const [showSalaryContribute, setShowSalaryContribute] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(getAppliedJobs);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(getSavedJobs);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [levelFilter, setLevelFilter] = useState<'all' | 'junior' | 'mid' | 'senior'>('all');
  const [applyModalJob, setApplyModalJob] = useState<JobPost | null>(null);
  const user = getUser();
  const isRecruiter = user?.userType === 'recruiter' || user?.userType === 'company';
  const isPersonal = user?.userType === 'personal';

  const handleQuickApply = useCallback((job: JobPost) => {
    setApplyModalJob(job);
  }, []);

  const handleApplySuccess = useCallback((jobId: string) => {
    addAppliedJob(jobId);
    setAppliedJobs(prev => new Set(prev).add(jobId));
    setApplyModalJob(null);
  }, []);

  // Load user's resume skills for match scoring
  useEffect(() => {
    if (user) {
      fetchResumes().then(setUserResumes).catch(() => {});
    }
  }, []);

  const userSkills = useMemo((): Set<string> => {
    const skills = new Set<string>();
    userResumes.forEach(r => {
      r.skills?.forEach(sk => {
        sk.items.split(',').forEach(item => {
          const trimmed = item.trim().toLowerCase();
          if (trimmed) skills.add(trimmed);
        });
      });
    });
    return skills;
  }, [userResumes]);

  useEffect(() => {
    document.title = '채용 공고 — 이력서공방';
    loadJobs();
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  const loadJobs = (query?: string) => {
    setError(false);
    setLoading(true);
    const qs = query ? `?q=${encodeURIComponent(query)}` : '';
    fetch(`${API_URL}/api/jobs${qs}`)
      .then(r => r.ok ? r.json() : [])
      .then(setJobs)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobs(search);
  };

  const handleSelectJob = (id: string) => {
    setSelectedId(id);
    setMobileDetailOpen(true);
  };

  const handleToggleSave = useCallback((jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nowSaved = toggleSavedJob(jobId);
    setSavedJobs(getSavedJobs());
    toast(nowSaved ? '공고를 저장했습니다' : '저장을 취소했습니다', 'success');
  }, []);

  const filteredJobs = useMemo(() => {
    let result = typeFilter === 'all' ? jobs : jobs.filter(j => j.type === typeFilter);
    if (showSavedOnly) result = result.filter(j => savedJobs.has(j.id));
    if (levelFilter !== 'all') {
      const JUNIOR_KW = ['신입', '주니어', 'junior', '1~3', '0~3', '1년', '2년', '3년'];
      const SENIOR_KW = ['시니어', '선임', '수석', '책임', 'senior', '리드', 'lead', '7년', '8년', '9년', '10년'];
      result = result.filter(j => {
        const text = `${j.position} ${j.description}`.toLowerCase();
        if (levelFilter === 'junior') return JUNIOR_KW.some(kw => text.includes(kw));
        if (levelFilter === 'senior') return SENIOR_KW.some(kw => text.includes(kw));
        // mid: not junior and not senior
        return !JUNIOR_KW.some(kw => text.includes(kw)) && !SENIOR_KW.some(kw => text.includes(kw));
      });
    }
    if (salaryFilterEnabled) {
      result = result.filter(j => {
        const range = parseSalaryRange(j.salary);
        if (!range) return true; // Keep jobs without salary info
        return range.max >= salaryMin && range.min <= salaryMax;
      });
    }
    return result;
  }, [jobs, typeFilter, showSavedOnly, savedJobs, salaryFilterEnabled, salaryMin, salaryMax]);
  const selected = filteredJobs.find(j => j.id === selectedId);

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">채용 공고</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{filteredJobs.length}개의 공고</p>
          </div>
          <div className="flex items-center gap-2">
            <JobAlert jobs={jobs} />
            {isRecruiter && (
              <Link to="/jobs/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
                + 공고 등록
              </Link>
            )}
          </div>
        </div>

        {/* External Job Sites Quick Links */}
        <ExternalJobLinks internalJobs={jobs} onDirectApply={handleQuickApply} />

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="포지션, 회사, 기술로 검색..." className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500" />
          <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">검색</button>
        </form>

        {/* Job type filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[{ key: 'all', label: '전체' }, { key: 'fulltime', label: '정규직' }, { key: 'contract', label: '계약직' }, { key: 'parttime', label: '파트타임' }, { key: 'intern', label: '인턴' }].map(opt => (
            <button
              key={opt.key}
              onClick={() => { setTypeFilter(opt.key); setShowSavedOnly(false); setSelectedId(null); setMobileDetailOpen(false); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                !showSavedOnly && typeFilter === opt.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => { setShowSavedOnly(!showSavedOnly); setSelectedId(null); setMobileDetailOpen(false); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${
              showSavedOnly
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <svg className="w-3 h-3" fill={showSavedOnly ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            저장한 공고
            {savedJobs.size > 0 && <span className="ml-0.5 font-bold">{savedJobs.size}</span>}
          </button>
        </div>


        {/* Experience level filter */}
        <div className="flex gap-2 mb-4">
          {([
            { key: 'all', label: '전 경력' },
            { key: 'junior', label: '신입/주니어' },
            { key: 'mid', label: '미드급' },
            { key: 'senior', label: '시니어/선임' },
          ] as const).map(opt => (
            <button
              key={opt.key}
              onClick={() => { setLevelFilter(opt.key); setSelectedId(null); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                levelFilter === opt.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Salary filter & contribute */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={salaryFilterEnabled}
                  onChange={e => setSalaryFilterEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                급여 필터
              </label>
              {salaryFilterEnabled && (
                <span className="text-[10px] text-slate-400">{salaryMin.toLocaleString()} ~ {salaryMax.toLocaleString()}만원</span>
              )}
            </div>
            {salaryFilterEnabled && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 w-8">최소</span>
                  <input
                    type="range" min={0} max={15000} step={500} value={salaryMin}
                    onChange={e => { const v = Number(e.target.value); setSalaryMin(Math.min(v, salaryMax)); }}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 w-16 text-right">{salaryMin.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 w-8">최대</span>
                  <input
                    type="range" min={1000} max={20000} step={500} value={salaryMax}
                    onChange={e => { const v = Number(e.target.value); setSalaryMax(Math.max(v, salaryMin)); }}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 w-16 text-right">{salaryMax.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowSalaryContribute(true)}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium rounded-xl border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            급여 정보 제공하기
          </button>
        </div>

        <SalaryContributeModal open={showSalaryContribute} onClose={() => setShowSalaryContribute(false)} />

        {/* 🎯 내 이력서 기반 추천 공고 */}
        {user && isPersonal && userSkills.size > 0 && !loading && !error && (() => {
          const topMatches = [...filteredJobs]
            .map(j => ({ job: j, score: calculateMatchScore(userSkills, j.skills || '') }))
            .filter(m => m.score >= 30)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
          if (topMatches.length === 0) return null;
          return (
            <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🎯</span>
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">내 이력서 스킬 기반 추천 공고</h3>
                <span className="ml-auto text-xs text-blue-600 dark:text-blue-400">{userSkills.size}개 스킬 분석</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {topMatches.map(({ job: j, score }) => (
                  <button
                    key={j.id}
                    onClick={() => handleSelectJob(j.id)}
                    className={`text-left p-3 rounded-xl border bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 ${
                      selectedId === j.id ? 'border-blue-500 ring-1 ring-blue-400' : 'border-blue-100 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 flex-1">{j.position}</span>
                      <span className="flex-shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-md">{score}%</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{j.company}</p>
                    {j.salary && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium truncate">{j.salary}</p>}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {error ? (
          <ErrorRetry onRetry={() => loadJobs(search)} />
        ) : loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3" />
                  <div className="flex gap-2">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-12" />
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-2 hidden lg:block">
              <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 animate-pulse">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-3" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/6" />
                </div>
              </div>
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.64-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">채용공고가 없습니다</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
              {search ? `"${search}"에 대한 검색 결과가 없습니다.` : typeFilter !== 'all' ? `${JOB_TYPES[typeFilter]} 공고가 아직 없습니다.` : '등록된 채용 공고가 없습니다.'}
            </p>
            {(search || typeFilter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setTypeFilter('all'); loadJobs(); }}
                className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                필터 초기화
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile: full-screen detail overlay */}
            {mobileDetailOpen && selected && (
              <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 overflow-y-auto lg:hidden">
                <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setMobileDetailOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{selected.position}</h2>
                </div>
                <div className="p-4">
                  <JobDetailPanel job={selected} isPersonal={isPersonal} userSkills={userSkills} allJobs={jobs} onSelectJob={handleSelectJob} appliedJobs={appliedJobs} savedJobs={savedJobs} onToggleSave={handleToggleSave} onQuickApply={handleQuickApply} userResumes={userResumes} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Job list */}
              <div className="lg:col-span-1 space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto lg:pr-1">
                {filteredJobs.map(j => (
                  <button
                    key={j.id}
                    onClick={() => handleSelectJob(j.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      selectedId === j.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-sm hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{j.position}</h3>
                        {appliedJobs.has(j.id) && (
                          <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md border border-green-200 dark:border-green-800">
                            지원 완료
                          </span>
                        )}
                        {user && userSkills.size > 0 && j.skills && (
                          <MatchBadge score={calculateMatchScore(userSkills, j.skills)} />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={e => handleToggleSave(j.id, e)}
                          className={`p-1 rounded-lg transition-colors ${
                            savedJobs.has(j.id)
                              ? 'text-amber-500 hover:text-amber-600'
                              : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                          }`}
                          aria-label={savedJobs.has(j.id) ? '저장 취소' : '공고 저장'}
                        >
                          <svg className="w-4 h-4" fill={savedJobs.has(j.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{timeAgo(j.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-slate-600 dark:text-slate-400">{j.company}</p>
                      <Link
                        to={`/company/${encodeURIComponent(j.company)}`}
                        onClick={e => e.stopPropagation()}
                        className="text-[10px] text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline shrink-0"
                      >
                        회사 정보
                      </Link>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
                      {j.location && (
                        <span className="flex items-center gap-0.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {j.location}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">{JOB_TYPES[j.type] || j.type}</span>
                      {j.salary && <span className="text-emerald-600 dark:text-emerald-400 font-medium">{j.salary}</span>}
                      {j.salary && (() => {
                        const badge = getSalaryComparisonBadge(j.salary, j.type);
                        return badge ? <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${badge.color}`}>{badge.text}</span> : null;
                      })()}
                    </div>
                    {j.skills && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {j.skills.split(',').slice(0, 4).map((s, i) => {
                          const c = getSkillColor(i);
                          return (
                            <span key={i} className={`px-1.5 py-0.5 text-xs ${c.bg} ${c.text} rounded`}>{s.trim()}</span>
                          );
                        })}
                        {j.skills.split(',').length > 4 && (
                          <span className="px-1.5 py-0.5 text-xs text-slate-400">+{j.skills.split(',').length - 4}</span>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Desktop detail panel */}
              <div className="lg:col-span-2 hidden lg:block">
                {selected ? (
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 sticky top-20">
                    <JobDetailPanel job={selected} isPersonal={isPersonal} userSkills={userSkills} allJobs={jobs} onSelectJob={handleSelectJob} appliedJobs={appliedJobs} savedJobs={savedJobs} onToggleSave={handleToggleSave} onQuickApply={handleQuickApply} userResumes={userResumes} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <svg className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.64-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">채용 공고를 선택하세요</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        {/* Quick Apply Modal */}
        {applyModalJob && (
          <QuickApplyModal
            job={applyModalJob}
            resumes={userResumes}
            onClose={() => setApplyModalJob(null)}
            onSuccess={handleApplySuccess}
          />
        )}
      </main>
      <Footer />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick Apply Modal                                                   */
/* ------------------------------------------------------------------ */
function QuickApplyModal({ job, resumes, onClose, onSuccess }: {
  job: JobPost;
  resumes: ResumeSummary[];
  onClose: () => void;
  onSuccess: (jobId: string) => void;
}) {
  const [selectedResumeId, setSelectedResumeId] = useState(resumes.length > 0 ? resumes[0].id : '');
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const user = getUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResumeId) {
      toast('지원할 이력서를 선택해주세요.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await createApplication({
        company: job.company,
        position: job.position,
        status: 'applied',
        resumeId: selectedResumeId,
        notes: coverLetter || undefined,
        location: job.location,
        salary: job.salary,
      });
      toast('지원이 완료되었습니다!', 'success');
      onSuccess(job.id);
    } catch (err: any) {
      toast(err?.message || '지원 중 오류가 발생했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">이력서로 즉시 지원</h2>
            <p className="text-xs text-slate-500 mt-0.5">{job.company} - {job.position}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {!user ? (
          <div className="p-6 text-center">
            <svg className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">로그인 후 즉시 지원할 수 있습니다.</p>
            <Link to="/login" className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors">
              로그인하기
            </Link>
          </div>
        ) : resumes.length === 0 ? (
          <div className="p-6 text-center">
            <svg className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">먼저 이력서를 작성해주세요.</p>
            <Link to="/resumes/new" className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors">
              이력서 작성하기
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">지원할 이력서 선택</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {resumes.map(r => (
                  <label
                    key={r.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedResumeId === r.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resume"
                      value={r.id}
                      checked={selectedResumeId === r.id}
                      onChange={() => setSelectedResumeId(r.id)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{r.title || '제목 없음'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.personalInfo?.name || ''}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                커버레터 <span className="text-xs font-normal text-slate-400">(선택사항)</span>
              </label>
              <textarea
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                rows={4}
                placeholder="간단한 자기소개나 지원 동기를 적어주세요..."
                className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedResumeId}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  지원 중...
                </>
              ) : (
                '지원하기'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* Extracted detail panel for reuse in desktop and mobile */
function JobDetailPanel({ job, isPersonal, userSkills, allJobs, onSelectJob, appliedJobs, savedJobs, onToggleSave, onQuickApply, userResumes }: { job: JobPost; isPersonal: boolean; userSkills: Set<string>; allJobs: JobPost[]; onSelectJob: (id: string) => void; appliedJobs: Set<string>; savedJobs: Set<string>; onToggleSave: (id: string, e: React.MouseEvent) => void; onQuickApply: (job: JobPost) => void; userResumes: ResumeSummary[] }) {
  const matchScore = userSkills.size > 0 && job.skills ? calculateMatchScore(userSkills, job.skills) : 0;
  const jobSkillsList = job.skills ? job.skills.split(',').map(s => s.trim()) : [];
  const matchedSkills = jobSkillsList.filter(s => userSkills.has(s.toLowerCase()));
  const missingSkills = jobSkillsList.filter(s => !userSkills.has(s.toLowerCase()));

  return (
    <>
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{job.position}</h2>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={e => onToggleSave(job.id, e)}
              className={`p-1.5 rounded-lg border transition-colors ${
                savedJobs.has(job.id)
                  ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-500'
                  : 'border-slate-200 dark:border-slate-600 text-slate-400 hover:text-amber-400 hover:border-amber-300'
              }`}
              aria-label={savedJobs.has(job.id) ? '저장 취소' : '공고 저장'}
            >
              <svg className="w-4 h-4" fill={savedJobs.has(job.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          {matchScore > 0 && (
            <div className={`px-3 py-1.5 rounded-xl text-center ${
              matchScore >= 80 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
              matchScore >= 60 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
              matchScore >= 30 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
              'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              <div className="text-lg font-bold">{matchScore}%</div>
              <div className="text-[10px] font-medium">매칭률</div>
            </div>
          )}
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{job.company}</p>
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500 dark:text-slate-400">
          {job.location && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {job.location}
            </span>
          )}
          {job.salary && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {job.salary}
            </span>
          )}
          {job.salary && (() => {
            const badge = getSalaryComparisonBadge(job.salary, job.type);
            return badge ? <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border ${badge.color}`}>{badge.text}</span> : null;
          })()}
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-lg font-medium">{JOB_TYPES[job.type] || job.type}</span>
          <span>{timeAgo(job.createdAt)}</span>
        </div>
      </div>

      {/* Company info card */}
      <CompanyInfoCard job={job} allJobs={allJobs} onSelectJob={onSelectJob} />

      {/* Required skills with match highlighting */}
      {job.skills && (
        <div className="mb-5">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            요구 기술
            {userSkills.size > 0 && matchedSkills.length > 0 && (
              <span className="ml-2 text-xs font-normal text-slate-400">({matchedSkills.length}/{jobSkillsList.length} 보유)</span>
            )}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {jobSkillsList.map((s, i) => {
              const isMatched = userSkills.has(s.trim().toLowerCase());
              if (userSkills.size > 0) {
                return (
                  <span key={i} className={`px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1 ${
                    isMatched
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-300 dark:ring-emerald-700'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800'
                  }`}>
                    {isMatched ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    )}
                    {s.trim()}
                  </span>
                );
              }
              const c = getSkillColor(i);
              return (
                <span key={i} className={`px-2.5 py-1 text-xs font-medium ${c.bg} ${c.text} rounded-lg`}>{s.trim()}</span>
              );
            })}
          </div>
          {userSkills.size > 0 && missingSkills.length > 0 && (
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              {missingSkills.map(s => s.trim()).join(', ')} 기술을 이력서에 추가하면 매칭률이 올라갑니다
            </p>
          )}
        </div>
      )}

      {/* Description */}
      {job.description && (
        <div className="mb-5">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">상세 설명</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{job.description}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
        {isPersonal ? (
          <>
            {appliedJobs.has(job.id) ? (
              <div className="flex-1 py-2.5 text-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-xl flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                지원 완료
              </div>
            ) : (
              <button
                onClick={() => onQuickApply(job)}
                className="flex-1 py-2.5 text-center bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                이력서로 즉시 지원
              </button>
            )}
          </>
        ) : (
          <>
            <Link
              to={`/applications?company=${encodeURIComponent(job.company)}&position=${encodeURIComponent(job.position)}`}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl hover:bg-slate-200 transition-colors"
            >
              지원 추가
            </Link>
            <Link
              to={`/jobs/new?copyFrom=${job.id}`}
              className="px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              복사해서 새 공고
            </Link>
          </>
        )}
        <Link
          to={`/cover-letter?company=${encodeURIComponent(job.company)}&position=${encodeURIComponent(job.position)}`}
          className={`${isPersonal ? '' : 'flex-1'} px-4 py-2.5 text-center bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors`}
        >
          이 공고로 자소서 작성
        </Link>
        <Link
          to={`/company/${encodeURIComponent(job.company)}`}
          className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          회사 정보 보기
        </Link>
      </div>
    </>
  );
}
