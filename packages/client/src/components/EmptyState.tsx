import { Link } from 'react-router-dom';

type EmptyType =
  | 'search'
  | 'resume'
  | 'application'
  | 'template'
  | 'tag'
  | 'version'
  | 'attachment'
  | 'scout'
  | 'cover-letter'
  | 'message'
  | 'notification';

interface Props {
  type: EmptyType;
  query?: string;
}

const configs = {
  search: {
    icon: (
      <svg
        className="w-20 h-20 text-slate-300 dark:text-slate-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 10l.01.01" />
      </svg>
    ),
    title: '검색 결과가 없습니다',
    description: '다른 키워드로 검색하거나, 필터를 변경해보세요.',
    actions: [{ label: '전체 보기', to: '/explore', variant: 'primary' as const }],
  },
  resume: {
    icon: (
      <svg
        className="w-20 h-20 text-slate-300 dark:text-slate-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
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
      <svg
        className="w-20 h-20 text-slate-300 dark:text-slate-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
    title: '지원 내역이 없습니다',
    description: '지원한 회사를 추가하면 현황을 한눈에 관리할 수 있습니다.',
    actions: [],
  },
  template: {
    icon: (
      <svg
        className="w-20 h-20 text-slate-300 dark:text-slate-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
        />
      </svg>
    ),
    title: '등록된 템플릿이 없습니다',
    description: '커스텀 템플릿을 만들어 이력서를 나만의 양식으로 변환하세요.',
    actions: [],
  },
  tag: {
    icon: (
      <svg
        className="w-20 h-20 text-slate-300 dark:text-slate-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
        />
      </svg>
    ),
    title: '태그가 없습니다',
    description: '태그를 만들어 이력서를 분류하고 빠르게 찾아보세요.',
    actions: [],
  },
  version: {
    icon: (
      <svg
        className="w-20 h-20 text-slate-300 dark:text-slate-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    title: '버전 기록이 없습니다',
    description: '이력서를 수정하면 자동으로 버전이 저장됩니다.',
    actions: [],
  },
  attachment: {
    icon: (
      <svg
        className="w-20 h-20 text-slate-300 dark:text-slate-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
        />
      </svg>
    ),
    title: '첨부 파일이 없습니다',
    description: '포트폴리오, 자격증 등을 첨부하여 이력서를 보완하세요.',
    actions: [],
  },
  scout: {
    icon: (
      <svg
        className="w-20 h-20 text-slate-300 dark:text-slate-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    title: '스카우트 제안이 없습니다',
    description: '이력서를 공개하면 기업 관계자가 제안을 보낼 수 있습니다.',
    actions: [],
  },
  'cover-letter': {
    icon: (
      <svg
        className="w-20 h-20 text-slate-300 dark:text-slate-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    title: '생성한 자소서가 없습니다',
    description: 'AI로 자기소개서를 생성해보세요.',
    actions: [{ label: 'AI 자소서 생성하기', to: '/cover-letter', variant: 'primary' as const }],
  },
  message: {
    icon: (
      <svg
        className="w-20 h-20 text-slate-300 dark:text-slate-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
    title: '대화가 없습니다',
    description: '다른 사용자에게 쪽지를 보내 대화를 시작하세요.',
    actions: [],
  },
  notification: {
    icon: (
      <svg
        className="w-20 h-20 text-slate-300 dark:text-slate-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
    title: '알림이 없습니다',
    description: '새로운 소식이 있으면 여기에 표시됩니다.',
    actions: [],
  },
};

/** Eyebrow text per type — teaches what state this is */
const EYEBROW: Record<EmptyType, string> = {
  search: '검색 결과',
  resume: '시작하기',
  application: '지원 내역',
  template: '템플릿',
  tag: '태그',
  version: '버전',
  attachment: '첨부',
  scout: '스카우트',
  'cover-letter': '자소서',
  message: '메시지',
  notification: '알림',
};

export default function EmptyState({ type, query }: Props) {
  const config = configs[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 animate-fade-in max-w-md mx-auto px-4">
      {/* Refined icon container — no glow, no float, no scaling. Solid surface + subtle border. */}
      <div className="mb-7 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
        <span className="[&>svg]:w-6 [&>svg]:h-6">{config.icon}</span>
      </div>

      {/* Eyebrow — teaches the state name in micro-typography */}
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-500 mb-3">
        {EYEBROW[type]}
      </div>

      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 mb-3 text-center tracking-[-0.02em] leading-tight text-balance">
        {query ? `"${query}"에 대한 결과가 없습니다` : config.title}
      </h3>

      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 text-center leading-relaxed max-w-sm">
        {config.description}
      </p>
      {type === 'resume' && !query && (
        <p className="text-xs text-slate-500 dark:text-slate-500 text-center mt-1.5">
          AI가 3분 안에 전문적인 이력서를 완성해드립니다.
        </p>
      )}

      {config.actions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-7 w-full sm:w-auto">
          {config.actions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-200 ${
                action.variant === 'primary'
                  ? 'btn-shine bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white shadow-sm'
                  : 'bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-600'
              }`}
            >
              {action.label}
              {action.variant === 'primary' && (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
