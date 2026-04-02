import { Link } from 'react-router-dom';

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
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">AI 도구</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/cover-letter" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">자소서 생성</Link></li>
              <li><Link to="/compare" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">이력서 비교</Link></li>
              <li><Link to="/applications" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">지원 관리</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">정보</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">서비스 소개</Link></li>
              <li><Link to="/tutorial" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">사용 가이드</Link></li>
              <li><Link to="/terms" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">이용약관</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">이력서공방</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              AI 기반 이력서 관리 플랫폼.
              무료 LLM으로 비용 걱정 없이
              전문적인 이력서를 만드세요.
            </p>
          </div>
        </div>
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 dark:text-slate-500">
          <span>&copy; 2025 이력서공방. 오픈소스 프로젝트.</span>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">이용약관</Link>
            <Link to="/about" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">서비스 소개</Link>
            <span>?로 단축키 보기</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
