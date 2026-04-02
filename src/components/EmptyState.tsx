import { Link } from 'react-router-dom';

interface Props {
  type: 'search' | 'resume' | 'application' | 'template' | 'tag' | 'version' | 'attachment';
  query?: string;
}

const configs = {
  search: {
    icon: (
      <svg className="w-20 h-20 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 10l.01.01" />
      </svg>
    ),
    title: '검색 결과가 없습니다',
    description: '다른 키워드로 검색하거나, 필터를 변경해보세요.',
    actions: [
      { label: '전체 보기', to: '/explore', variant: 'primary' as const },
    ],
  },
  resume: {
    icon: (
      <svg className="w-20 h-20 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: '공개된 이력서가 없습니다',
    description: '이력서 편집 페이지에서 공개 설정을 하면 여기에 노출됩니다.',
    actions: [
      { label: '이력서 만들기', to: '/resumes/new', variant: 'primary' as const },
      { label: 'AI 자동 생성', to: '/auto-generate', variant: 'secondary' as const },
    ],
  },
  application: {
    icon: (
      <svg className="w-20 h-20 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: '지원 내역이 없습니다',
    description: '지원한 회사를 추가하면 현황을 한눈에 관리할 수 있습니다.',
    actions: [],
  },
  template: {
    icon: (
      <svg className="w-20 h-20 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    title: '등록된 템플릿이 없습니다',
    description: '커스텀 템플릿을 만들어 이력서를 나만의 양식으로 변환하세요.',
    actions: [],
  },
  tag: {
    icon: (
      <svg className="w-20 h-20 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    title: '태그가 없습니다',
    description: '태그를 만들어 이력서를 분류하고 빠르게 찾아보세요.',
    actions: [],
  },
  version: {
    icon: (
      <svg className="w-20 h-20 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: '버전 기록이 없습니다',
    description: '이력서를 수정하면 자동으로 버전이 저장됩니다.',
    actions: [],
  },
  attachment: {
    icon: (
      <svg className="w-20 h-20 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
    ),
    title: '첨부 파일이 없습니다',
    description: '포트폴리오, 자격증 등을 첨부하여 이력서를 보완하세요.',
    actions: [],
  },
};

export default function EmptyState({ type, query }: Props) {
  const config = configs[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 animate-fade-in">
      {/* Decorative background circle */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full scale-150 blur-2xl opacity-50" />
        <div className="relative bg-slate-50 dark:bg-slate-800/50 rounded-full p-6 border border-slate-200/50 dark:border-slate-700/50">
          {config.icon}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
        {query ? `"${query}"에 대한 결과가 없습니다` : config.title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm text-center leading-relaxed">
        {config.description}
      </p>

      {config.actions.length > 0 && (
        <div className="flex items-center gap-3 mt-6">
          {config.actions.map(action => (
            <Link
              key={action.to}
              to={action.to}
              className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                action.variant === 'primary'
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}

      {/* Decorative dots */}
      <div className="flex items-center gap-1.5 mt-8">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
      </div>
    </div>
  );
}
