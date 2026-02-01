export interface ResumeTheme {
  id: string;
  name: string;
  description: string;
  headerStyle: string;
  sectionTitleStyle: string;
  bodyStyle: string;
  accentColor: string;
  fontFamily: string;
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
  },
];
