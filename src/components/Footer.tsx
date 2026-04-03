import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { t } from '@/lib/i18n';
import { API_URL } from '@/lib/config';

function SiteStats() {
  const [stats, setStats] = useState<{ users: number; resumes: number; views: number } | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/health/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setStats({ users: d.users.total, resumes: d.resumes.total, views: d.activity.totalViews });
      })
      .catch(() => {});
  }, []);

  if (!stats) return null;

  return (
    <div className="flex items-center gap-4 text-xs">
      <span className="flex items-center gap-1"><span className="font-semibold text-slate-600 dark:text-slate-300">{stats.users}</span> 회원</span>
      <span className="flex items-center gap-1"><span className="font-semibold text-slate-600 dark:text-slate-300">{stats.resumes}</span> 이력서</span>
      <span className="flex items-center gap-1"><span className="font-semibold text-slate-600 dark:text-slate-300">{stats.views.toLocaleString()}</span> 조회</span>
    </div>
  );
}

const linkClass = 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-[13px]';

export default function Footer() {
  return (
    <footer className="no-print border-t border-slate-200/80 dark:border-slate-700/80 mt-auto bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8">
        {/* Logo + Description */}
        <div className="flex flex-col lg:flex-row gap-8 mb-10">
          <div className="lg:w-1/3">
            <Link to="/" className="inline-flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">이력서공방</span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              AI 기반 이력서 관리 플랫폼. 15종 테마, ATS 호환성 검사, 자기소개서 생성, 채용 공고 관리까지.
            </p>
            <SiteStats />
          </div>

          {/* Link Groups */}
          <div className="lg:w-2/3 grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">이력서</h4>
              <ul className="space-y-2">
                <li><Link to="/resumes/new" className={linkClass}>새 이력서</Link></li>
                <li><Link to="/auto-generate" className={linkClass}>AI 자동 생성</Link></li>
                <li><Link to="/templates" className={linkClass}>템플릿</Link></li>
                <li><Link to="/explore" className={linkClass}>탐색</Link></li>
                <li><Link to="/translate" className={linkClass}>번역</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">AI 도구</h4>
              <ul className="space-y-2">
                <li><Link to="/cover-letter" className={linkClass}>자소서 생성</Link></li>
                <li><Link to="/compare" className={linkClass}>이력서 비교</Link></li>
                <li><Link to="/interview-prep" className={linkClass}>면접 준비</Link></li>
                <li><Link to="/applications" className={linkClass}>지원 관리</Link></li>
                <li><Link to="/jobs" className={linkClass}>채용 공고</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">채용담당자</h4>
              <ul className="space-y-2">
                <li><Link to="/recruiter" className={linkClass}>채용 대시보드</Link></li>
                <li><Link to="/scouts" className={linkClass}>스카우트</Link></li>
                <li><Link to="/jobs/new" className={linkClass}>채용공고 등록</Link></li>
                <li><Link to="/messages" className={linkClass}>메시지</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">정보</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className={linkClass}>서비스 소개</Link></li>
                <li><Link to="/tutorial" className={linkClass}>사용 가이드</Link></li>
                <li><Link to="/pricing" className={linkClass}>요금제</Link></li>
                <li><Link to="/feedback" className={linkClass}>피드백</Link></li>
                <li><Link to="/terms" className={linkClass}>이용약관</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span>{t('footer.copyright')}. {t('footer.openSource')}.</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/blue45f/resume" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
            </a>
            <Link to="/sitemap" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">사이트맵</Link>
            <Link to="/terms" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">이용약관</Link>
            <span className="hidden sm:inline">? 단축키</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
