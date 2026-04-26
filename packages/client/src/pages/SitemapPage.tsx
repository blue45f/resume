import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { tx } from '@/lib/i18n';

const SITEMAP = [
  {
    title: '이력서 관리',
    icon: '📝',
    color: 'from-blue-500 to-indigo-500',
    links: [
      { to: '/', label: '홈 / 대시보드', desc: '이력서 목록, 통계, 최근 활동' },
      { to: '/resumes/new', label: '새 이력서', desc: '빈 이력서, 샘플, AI 문서 분석' },
      { to: '/auto-generate', label: 'AI 자동 생성', desc: '텍스트/파일로 이력서 자동 생성' },
      { to: '/templates', label: '템플릿 관리', desc: '30종 직종별 템플릿' },
      { to: '/explore', label: '이력서 탐색', desc: '공개 이력서 검색, 사용자 검색' },
      { to: '/translate', label: '이력서 번역', desc: '한↔영↔일 AI 번역' },
      { to: '/compare', label: '이력서 비교', desc: '2개 이력서 비교 분석' },
      { to: '/bookmarks', label: '북마크', desc: '관심 이력서 저장 목록', auth: true },
      { to: '/tags', label: '태그 관리', desc: '이력서 분류 태그' },
    ],
  },
  {
    title: 'AI 도구',
    icon: '🤖',
    color: 'from-blue-500 to-cyan-500',
    links: [
      { to: '/cover-letter', label: '자소서 생성', desc: 'AI 자기소개서 작성' },
      { to: '/my-cover-letters', label: '내 자소서', desc: '작성한 자소서 관리', auth: true },
      { to: '/interview-prep', label: '면접 준비', desc: 'AI 모의 면접, 질문 생성' },
    ],
  },
  {
    title: '취업 활동',
    icon: '💼',
    color: 'from-emerald-500 to-teal-500',
    links: [
      { to: '/jobs', label: '채용 공고', desc: '채용 정보 검색, 매칭률 확인' },
      {
        to: '/applications',
        label: '지원 관리',
        desc: '칸반 보드, 타임라인, 면접 후기',
        auth: true,
      },
    ],
  },
  {
    title: '소셜 / 네트워킹',
    icon: '🤝',
    color: 'from-amber-500 to-orange-500',
    links: [
      { to: '/messages', label: '쪽지', desc: '회원간 1:1 메시지', auth: true },
      { to: '/social/follows', label: '팔로우 목록', desc: '팔로워/팔로잉 관리', auth: true },
      { to: '/notifications', label: '알림', desc: '댓글, 스카우트, 팔로우 알림', auth: true },
      { to: '/feedback', label: '피드백 게시판', desc: '버그 신고, 기능 제안, 의견' },
    ],
  },
  {
    title: '채용담당자',
    icon: '🏢',
    color: 'from-cyan-500 to-blue-500',
    links: [
      { to: '/recruiter', label: '채용 대시보드', desc: '파이프라인, 통계, 추천 후보', auth: true },
      { to: '/scouts', label: '스카우트', desc: '인재 스카우트 메시지', auth: true },
      { to: '/jobs/new', label: '채용공고 등록', desc: '새 채용 공고 작성' },
    ],
  },
  {
    title: '계정 / 설정',
    icon: '⚙️',
    color: 'from-slate-500 to-slate-600',
    links: [
      { to: '/login', label: '로그인 / 회원가입', desc: 'Google, GitHub, 이메일' },
      { to: '/settings', label: '설정', desc: '프로필, 알림, 테마, 계정 관리', auth: true },
      { to: '/pricing', label: '요금제', desc: '무료/스탠다드/프리미엄' },
    ],
  },
  {
    title: '정보',
    icon: '📌',
    color: 'from-indigo-500 to-sky-500',
    links: [
      { to: '/about', label: '서비스 소개', desc: '이력서공방 소개' },
      { to: '/tutorial', label: '사용 가이드', desc: '주요 기능 사용법' },
      { to: '/terms', label: '이용약관', desc: '서비스 이용 약관' },
    ],
  },
];

export default function SitemapPage() {
  useEffect(() => {
    document.title = '사이트맵 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8"
        role="main"
      >
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            {tx('sitemap.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {tx('sitemap.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SITEMAP.map((section) => (
            <div
              key={section.title}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              {/* Section Header */}
              <div
                className={`bg-gradient-to-r ${section.color} px-5 py-3 flex items-center gap-2`}
              >
                <span className="text-lg">{section.icon}</span>
                <h2 className="text-sm font-bold text-white">{section.title}</h2>
                <span className="ml-auto text-xs text-white/70">
                  {section.links.length}개 페이지
                </span>
              </div>

              {/* Links */}
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {section.links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {link.label}
                        </span>
                        {'auth' in link && link.auth && (
                          <span className="px-1.5 py-0.5 text-[9px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                            로그인
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {link.desc}
                      </p>
                    </div>
                    <svg
                      className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-400 transition-colors shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
          총 {SITEMAP.reduce((sum, s) => sum + s.links.length, 0)}개 페이지 · 이력서공방
        </div>
      </main>
      <Footer />
    </>
  );
}
