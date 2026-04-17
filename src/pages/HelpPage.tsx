import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { API_URL } from '@/lib/config';

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  { q: '이력서는 몇 개까지 만들 수 있나요?', a: '무료 플랜에서 이력서 3개, 프로 플랜에서 무제한으로 만들 수 있습니다.', category: '일반' },
  { q: 'AI 분석은 무료인가요?', a: '네, 무료 LLM(Gemini, Groq)을 활용하여 비용 없이 AI 분석을 제공합니다. 월 5회 무료 변환을 지원합니다.', category: '일반' },
  { q: 'ATS 호환성 검사란 무엇인가요?', a: 'ATS(Applicant Tracking System)는 기업이 이력서를 자동으로 분류하는 시스템입니다. ATS 검사는 이력서가 이 시스템에서 잘 인식되는지 점수로 알려줍니다.', category: 'AI 도구' },
  { q: 'JD 매칭 분석은 어떻게 사용하나요?', a: '이력서 미리보기에서 "JD 매칭" 버튼을 클릭하고, 채용공고의 자격요건을 붙여넣으면 매칭도를 분석해드립니다.', category: 'AI 도구' },
  { q: '면접 질문은 어떻게 생성되나요?', a: '이력서 내용과 지원 직무를 AI가 분석하여 예상 면접 질문과 모범 답변을 생성합니다. 채용공고를 함께 입력하면 더 정확한 질문이 생성됩니다.', category: 'AI 도구' },
  { q: '이력서를 PDF로 저장하려면?', a: '이력서 미리보기에서 "인쇄/PDF" 버튼을 클릭하면 브라우저 인쇄 기능으로 깔끔한 PDF를 저장할 수 있습니다.', category: '이력서' },
  { q: '이력서 버전 관리가 되나요?', a: '네, 이력서를 수정할 때마다 자동으로 버전이 저장됩니다. 이전 버전으로 복원도 가능합니다.', category: '이력서' },
  { q: '공유 링크에 비밀번호를 설정할 수 있나요?', a: '네, 이력서 공유 시 비밀번호와 만료 시간을 설정할 수 있습니다.', category: '이력서' },
  { q: '다크 모드를 사용하려면?', a: '상단 메뉴의 테마 아이콘을 클릭하면 라이트/다크/시스템 모드를 전환할 수 있습니다.', category: '일반' },
  { q: '소셜 로그인은 어떤 것을 지원하나요?', a: 'Google, GitHub, Kakao 계정으로 간편 로그인이 가능합니다.', category: '계정' },
  { q: '채용 담당자 모드란?', a: '설정에서 사용자 유형을 "채용 담당자"로 변경하면 인재 탐색, 스카우트, 채용공고 관리 등의 기능을 사용할 수 있습니다.', category: '계정' },
  { q: '커뮤니티에서 글을 삭제하려면?', a: '본인이 작성한 글의 삭제 버튼을 클릭하면 됩니다. 관리자도 삭제할 수 있습니다.', category: '커뮤니티' },
  { q: '금칙어가 포함된 글은 어떻게 되나요?', a: '금칙어가 포함된 게시글이나 댓글은 자동으로 등록이 차단됩니다.', category: '커뮤니티' },
  { q: '키보드 단축키가 있나요?', a: 'Cmd+K(검색), ?(단축키 도움말), N(새 이력서), E(탐색), Esc(모달 닫기) 등을 지원합니다.', category: '일반' },
];

const CATEGORIES = ['전체', '일반', '이력서', 'AI 도구', '계정', '커뮤니티'];

export default function HelpPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('전체');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const { data: dynamicFaq } = useQuery<FAQItem[]>({
    queryKey: ['help-faq'],
    queryFn: () => fetch(`${API_URL}/api/system-config/content/help_faq`).then(r => r.ok ? r.json() : null),
    staleTime: 5 * 60_000,
  });

  const faqData = dynamicFaq?.length ? dynamicFaq : FAQ_DATA;

  useEffect(() => {
    document.title = '도움말 — 이력서공방';
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  const filtered = useMemo(() => {
    return faqData.filter(item => {
      const matchCat = category === '전체' || item.category === category;
      const matchSearch = !search.trim() || item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, category]);

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8" role="main">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-neutral-900 dark:bg-white rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg">
            ?
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">도움말</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">자주 묻는 질문과 사용 가이드</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="질문을 검색하세요..."
            className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all ${
                category === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ list */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item, i) => {
              const isOpen = expandedIdx === i;
              return (
                <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedIdx(isOpen ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium shrink-0">{item.category}</span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.q}</span>
                    </div>
                    <svg className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-0 border-t border-slate-100 dark:border-slate-700">
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-3">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Quick links */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: '📖', label: '사용 가이드', to: '/tutorial' },
            { icon: '💬', label: '커뮤니티', to: '/community' },
            { icon: '📧', label: '피드백 보내기', to: '/feedback' },
            { icon: '⌨️', label: '단축키 (? 키)', to: '#' },
            { icon: '📊', label: '전체 통계', to: '/stats' },
            { icon: '💰', label: '요금제', to: '/pricing' },
          ].map(link => (
            <Link key={link.label} to={link.to} className="flex items-center gap-2.5 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
              <span className="text-lg">{link.icon}</span>
              <span className="text-sm text-slate-700 dark:text-slate-300">{link.label}</span>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
