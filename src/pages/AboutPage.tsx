import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import { API_URL } from '@/lib/config';

const featureIcons = {
  resume: (
    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  ai: (
    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5m-4.25-11.396c.251.023.501.05.75.082M5 14.5l-1.395.747a1.125 1.125 0 00-.393 1.544l.743 1.267a1.125 1.125 0 001.544.393L7 17.75m12-3.25l1.395.747a1.125 1.125 0 01.393 1.544l-.743 1.267a1.125 1.125 0 01-1.544.393L17 17.75" />
    </svg>
  ),
  share: (
    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.702a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.343 8.69" />
    </svg>
  ),
  version: (
    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  tag: (
    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h.008v.008H6V6z" />
    </svg>
  ),
  attach: (
    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
    </svg>
  ),
  auth: (
    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  print: (
    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
    </svg>
  ),
};

const DEFAULT_FEATURES = [
  { emoji: '📄', title: '이력서 관리', desc: '9개 섹션(경력, 학력, 기술, 프로젝트 등)을 체계적으로 관리. 부서, 성과, 기술 스택까지 상세 기록.' },
  { emoji: '🤖', title: 'AI 양식 변환', desc: '무료 AI(Gemini, Groq)로 표준 이력서, 경력기술서, 자기소개서, LinkedIn 등 8가지 양식으로 변환.' },
  { emoji: '🔗', title: '공유 & 공개', desc: '비밀번호 보호 공유 링크, 만료 시간 설정. 공개 이력서는 탐색 페이지에서 검색 가능.' },
  { emoji: '🕐', title: '버전 관리', desc: '수정할 때마다 자동 스냅샷. 실수로 삭제해도 이전 버전으로 복원 가능.' },
  { emoji: '🏷️', title: '태그 & 템플릿', desc: '태그로 이력서 분류, 커스텀 템플릿으로 LLM 없이 무료 양식 변환.' },
  { emoji: '📎', title: '첨부파일', desc: 'PDF, 이미지, 문서 파일 첨부. 포트폴리오, 자격증 등을 함께 관리.' },
  { emoji: '🔐', title: '소셜 로그인', desc: 'Google, GitHub, Kakao 계정으로 간편 로그인. 비로그인으로도 사용 가능.' },
  { emoji: '🖨️', title: 'PDF/인쇄', desc: '미리보기 페이지에서 브라우저 인쇄 기능으로 깔끔한 PDF 저장.' },
];

const ICON_MAP: Record<string, JSX.Element> = {
  '📄': featureIcons.resume, '🤖': featureIcons.ai, '🔗': featureIcons.share, '🕐': featureIcons.version,
  '🏷️': featureIcons.tag, '📎': featureIcons.attach, '🔐': featureIcons.auth, '🖨️': featureIcons.print,
};

const DEFAULT_TECH = [
  { category: '프론트엔드', items: 'React 19, TypeScript, Vite 8, Tailwind CSS 4' },
  { category: '백엔드', items: 'NestJS 11, Prisma ORM, PostgreSQL (Neon)' },
  { category: 'AI', items: 'Gemini, Groq, Anthropic Claude, n8n Webhook' },
  { category: '인프라', items: 'Vercel (프론트), Google Cloud Run (백엔드), Neon (DB)' },
  { category: '보안', items: 'JWT, OAuth2, Helmet, Rate Limiting, bcrypt' },
];

export default function AboutPage() {
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [techStack, setTechStack] = useState(DEFAULT_TECH);

  useEffect(() => {
    fetch(`${API_URL}/api/system-config/content/about`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.features?.length) setFeatures(d.features);
        if (d?.techStack?.length) setTechStack(d.techStack);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    document.title = '서비스 소개 — 이력서공방';
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1" role="main">
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-900 text-white py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">이력서공방</h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-2">AI 기반 이력서 관리 플랫폼</p>
            <p className="text-blue-200 max-w-2xl mx-auto">
              이력서를 체계적으로 관리하고, AI로 다양한 양식으로 변환하세요.
              무료 LLM을 활용하여 비용 걱정 없이 전문적인 이력서를 만들 수 있습니다.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Link to="/resumes/new" className="px-6 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
                이력서 만들기
              </Link>
              <Link to="/tutorial" className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition-colors">
                사용 가이드
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: '9', label: '이력서 섹션' },
              { value: '26+', label: '직종별 템플릿' },
              { value: '5', label: 'AI 분석 기능' },
              { value: '3', label: '소셜 로그인' },
            ].map(stat => (
              <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center mb-10">주요 기능</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f: any, i: number) => (
              <div key={f.title} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md hover:-translate-y-1 duration-200 transition-all animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="mb-3">{ICON_MAP[f.emoji] || <span className="text-2xl">{f.emoji || '✨'}</span>}</div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">{f.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* For Recruiters */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 py-12 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full">채용 담당자용</span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-4">인재를 찾고 계신가요?</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">이력서공방에서 우수 인재를 직접 스카우트하세요</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: '🔍', title: '인재 검색', desc: '기술 스택, 경력으로 인재를 검색하고 이력서를 상세히 확인하세요.' },
                { icon: '📨', title: '스카우트 제안', desc: '관심 있는 인재에게 직접 스카우트 메시지를 보낼 수 있습니다.' },
                { icon: '📋', title: '채용 공고', desc: '채용 공고를 등록하면 구직자들이 지원하고 자소서를 작성합니다.' },
              ].map(f => (
                <div key={f.title} className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm">
                  <span className="text-2xl mb-3 block">{f.icon}</span>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{f.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/pricing" className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
                채용 요금제 보기
              </Link>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-slate-50 dark:bg-slate-900 py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center mb-8">기술 스택</h2>
            <div className="space-y-3">
              {techStack.map(t => (
                <div key={t.category} className="flex items-start gap-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/50 px-2 py-1 rounded whitespace-nowrap">{t.category}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-300">{t.items}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-700 py-8 bg-white dark:bg-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <Link to="/about" className="hover:text-slate-700 dark:hover:text-slate-200">서비스 소개</Link>
              <Link to="/tutorial" className="hover:text-slate-700 dark:hover:text-slate-200">사용 가이드</Link>
              <Link to="/terms" className="hover:text-slate-700 dark:hover:text-slate-200">이용약관</Link>
            </div>
            <p>이력서공방 - 오픈소스 이력서 관리 플랫폼</p>
          </div>
        </footer>
      </main>
    </>
  );
}
