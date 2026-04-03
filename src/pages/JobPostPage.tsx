import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import { getUser } from '@/lib/auth';
import { createJob } from '@/lib/api';

const JOB_TYPES = [
  { value: 'fulltime', label: '정규직' },
  { value: 'contract', label: '계약직' },
  { value: 'parttime', label: '파트타임' },
  { value: 'intern', label: '인턴' },
];

export default function JobPostPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company: user?.companyName || '',
    position: '',
    location: '',
    salary: '',
    description: '',
    requirements: '',
    benefits: '',
    type: 'fulltime',
    skills: '',
  });

  useEffect(() => {
    document.title = '채용 공고 등록 — 이력서공방';
    if (!user || user.userType === 'personal') {
      toast('리크루터 또는 기업 회원만 공고를 등록할 수 있습니다', 'error');
      navigate('/jobs');
    }
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.position) { toast('포지션을 입력해주세요', 'warning'); return; }
    if (!form.company) { toast('회사명을 입력해주세요', 'warning'); return; }
    setSaving(true);
    try {
      await createJob(form);
      toast('채용 공고가 등록되었습니다', 'success');
      navigate('/jobs');
    } catch (e: any) {
      toast(e.message || '등록에 실패했습니다', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8" role="main">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">채용 공고 등록</h1>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">회사명 *</label>
              <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className={inputClass} placeholder="예: 네이버" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">포지션 *</label>
              <input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className={inputClass} placeholder="예: 프론트엔드 개발자" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">근무지</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inputClass} placeholder="예: 서울시 강남구" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">연봉</label>
              <input value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} className={inputClass} placeholder="예: 5,000~7,000만원" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">고용 형태</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputClass}>
                {JOB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">기술 스택 (쉼표로 구분)</label>
            <input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} className={inputClass} placeholder="예: React, TypeScript, Node.js" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">상세 설명</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={5} className={inputClass + ' resize-none'} placeholder="업무 내용, 팀 소개 등" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">자격 요건</label>
            <textarea value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} rows={3} className={inputClass + ' resize-none'} placeholder="필수/우대 조건" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">복리후생</label>
            <textarea value={form.benefits} onChange={e => setForm(f => ({ ...f, benefits: e.target.value }))} rows={3} className={inputClass + ' resize-none'} placeholder="연차, 복지, 교육 등" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate('/jobs')} className="px-5 py-2.5 text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition-colors">취소</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? '등록 중...' : '채용 공고 등록'}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
}
