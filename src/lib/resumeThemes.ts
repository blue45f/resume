export interface ResumeTheme {
  id: string;
  name: string;
  description: string;
  headerStyle: string;
  sectionTitleStyle: string;
  bodyStyle: string;
  accentColor: string;
  fontFamily: string;
  premium?: boolean;
}

export const resumeThemes: ResumeTheme[] = [
  {
    id: 'classic',
    name: '클래식',
    description: '전통적인 이력서 스타일',
    headerStyle: 'border-b-2 border-slate-800 pb-6 mb-8',
    sectionTitleStyle: 'text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-1.5 mb-3',
    bodyStyle: 'text-slate-800',
    accentColor: 'blue',
    fontFamily: "-apple-system, 'Pretendard', 'Noto Sans KR', sans-serif",
  },
  {
    id: 'modern',
    name: '모던',
    description: '깔끔하고 현대적인 디자인',
    headerStyle: 'border-b-4 border-blue-600 pb-6 mb-8',
    sectionTitleStyle: 'text-sm font-bold text-blue-700 uppercase tracking-wider pb-1.5 mb-3 flex items-center gap-2 before:content-[""] before:w-1 before:h-4 before:bg-blue-600 before:rounded',
    bodyStyle: 'text-slate-700',
    accentColor: 'blue',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  {
    id: 'minimal',
    name: '미니멀',
    description: '최소한의 장식, 내용 중심',
    headerStyle: 'pb-4 mb-6',
    sectionTitleStyle: 'text-xs font-semibold text-slate-500 uppercase tracking-[0.2em] mb-3',
    bodyStyle: 'text-slate-600',
    accentColor: 'slate',
    fontFamily: "'SF Pro Text', -apple-system, sans-serif",
  },
  {
    id: 'professional',
    name: '프로페셔널',
    description: '기업 채용에 최적화',
    headerStyle: 'bg-slate-900 text-white -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 px-6 sm:px-10 pt-6 sm:pt-10 pb-6 mb-8 rounded-t-none',
    sectionTitleStyle: 'text-sm font-bold text-slate-900 border-l-4 border-slate-900 pl-3 mb-3',
    bodyStyle: 'text-slate-700',
    accentColor: 'slate',
    fontFamily: "'Noto Sans KR', sans-serif",
    premium: true,
  },
  {
    id: 'creative',
    name: '크리에이티브',
    description: '디자이너/크리에이터용',
    headerStyle: 'border-b-2 border-gradient-to-r from-purple-500 to-pink-500 pb-6 mb-8',
    sectionTitleStyle: 'text-sm font-bold text-purple-700 uppercase tracking-wider pb-1.5 mb-3',
    bodyStyle: 'text-slate-700',
    accentColor: 'purple',
    fontFamily: "'Pretendard', sans-serif",
    premium: true,
  },
  {
    id: 'executive',
    name: '임원급',
    description: '시니어/임원 레벨 격식 스타일',
    headerStyle: 'text-center border-b border-slate-400 pb-8 mb-8',
    sectionTitleStyle: 'text-center text-sm font-semibold text-slate-700 uppercase tracking-[0.3em] border-b border-slate-200 pb-2 mb-4',
    bodyStyle: 'text-slate-700',
    accentColor: 'slate',
    fontFamily: "'Georgia', 'Noto Serif KR', serif",
    premium: true,
  },
  {
    id: 'startup',
    name: '스타트업',
    description: '역동적이고 자유로운 분위기',
    headerStyle: 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 px-6 sm:px-10 pt-8 sm:pt-10 pb-8 mb-8',
    sectionTitleStyle: 'text-sm font-bold text-indigo-600 mb-3 flex items-center gap-2 before:content-[""] before:w-8 before:h-0.5 before:bg-indigo-400',
    bodyStyle: 'text-slate-700',
    accentColor: 'indigo',
    fontFamily: "'Inter', -apple-system, sans-serif",
    premium: true,
  },
  {
    id: 'academic',
    name: '학술',
    description: '연구/교육 분야 최적화',
    headerStyle: 'border-b border-slate-300 pb-4 mb-6',
    sectionTitleStyle: 'text-base font-bold text-slate-900 mb-2 border-b-2 border-slate-800 pb-1 inline-block',
    bodyStyle: 'text-slate-800 leading-relaxed',
    accentColor: 'slate',
    fontFamily: "'Times New Roman', 'Noto Serif KR', serif",
    premium: true,
  },
  {
    id: 'tech',
    name: '테크',
    description: '개발자/엔지니어 전용',
    headerStyle: 'bg-slate-950 text-green-400 -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 px-6 sm:px-10 pt-6 sm:pt-10 pb-6 mb-8 font-mono',
    sectionTitleStyle: 'text-sm font-bold text-green-600 font-mono uppercase tracking-wider mb-3 flex items-center gap-2 before:content-["//"] before:text-green-400 before:text-xs',
    bodyStyle: 'text-slate-700',
    accentColor: 'green',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    premium: true,
  },
  {
    id: 'elegant',
    name: '엘레강트',
    description: '세련되고 우아한 디자인',
    headerStyle: 'border-b border-amber-300 pb-6 mb-8',
    sectionTitleStyle: 'text-sm font-light text-amber-800 uppercase tracking-[0.25em] mb-3 border-b border-amber-200 pb-1.5',
    bodyStyle: 'text-slate-700',
    accentColor: 'amber',
    fontFamily: "'Playfair Display', 'Noto Serif KR', serif",
    premium: true,
  },
];
