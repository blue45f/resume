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
    <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
      <span><strong className="text-slate-500 dark:text-slate-400">{stats.users}</strong> 회원</span>
      <span><strong className="text-slate-500 dark:text-slate-400">{stats.resumes}</strong> 이력서</span>
      <span><strong className="text-slate-500 dark:text-slate-400">{stats.views.toLocaleString()}</strong> 조회</span>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="no-print border-t border-slate-200 dark:border-slate-700 py-8 mt-auto bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">이력서</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/resumes/new" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">새 이력서</Link></li>
              <li><Link to="/auto-generate" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">AI 자동 생성</Link></li>
              <li><Link to="/templates" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">템플릿</Link></li>
              <li><Link to="/explore" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">공개 이력서</Link></li>
              <li><Link to="/bookmarks" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">북마크</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">AI 도구</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/cover-letter" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">자소서 생성</Link></li>
              <li><Link to="/compare" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">이력서 비교</Link></li>
              <li><Link to="/applications" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">지원 관리</Link></li>
              <li><Link to="/interview-prep" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">면접 준비</Link></li>
              <li><Link to="/jobs" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">채용 공고</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">정보</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">서비스 소개</Link></li>
              <li><Link to="/tutorial" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">사용 가이드</Link></li>
              <li><Link to="/terms" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">이용약관</Link></li>
              <li><Link to="/pricing" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">요금제</Link></li>
              <li><Link to="/feedback" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">피드백</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">채용담당자</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/recruiter" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">채용 대시보드</Link></li>
              <li><Link to="/scouts" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">스카우트</Link></li>
              <li><Link to="/jobs/new" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">채용공고 등록</Link></li>
              <li><Link to="/messages" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">메시지</Link></li>
            </ul>
          </div>
        </div>

        {/* Sitemap links */}
        <div className="pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">사이트맵</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
            <Link to="/" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">홈</Link>
            <Link to="/" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">대시보드</Link>
            <Link to="/explore" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">탐색</Link>
            <Link to="/templates" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">템플릿</Link>
            <Link to="/jobs" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">채용공고</Link>
            <Link to="/cover-letter" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">자소서</Link>
            <Link to="/interview-prep" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">면접준비</Link>
            <Link to="/applications" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">지원관리</Link>
            <Link to="/pricing" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">요금제</Link>
            <Link to="/about" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">소개</Link>
            <Link to="/terms" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">이용약관</Link>
          </div>
        </div>
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 dark:text-slate-500">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span>{t('footer.copyright')}. {t('footer.openSource')}.</span>
            <SiteStats />
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/hjunkim/resume" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors inline-flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
              GitHub
            </a>
            <Link to="/terms" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">이용약관</Link>
            <Link to="/about" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">서비스 소개</Link>
            <span>?로 단축키 보기</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
