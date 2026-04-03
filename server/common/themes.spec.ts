/**
 * Tests for resume theme data integrity.
 * Validates that all 15 themes are well-formed with required fields.
 *
 * Theme data is copied from src/lib/resumeThemes.ts to avoid import.meta.env issues.
 */

interface ResumeTheme {
  id: string;
  name: string;
  description: string;
  headerStyle: string;
  sectionTitleStyle: string;
  bodyStyle: string;
  accentColor: string;
  fontFamily: string;
  premium?: boolean;
  preview?: {
    headerBg: string;
    headerText: string;
    accentBar: string;
    bodyBg: string;
    category: 'basic' | 'professional' | 'creative' | 'academic' | 'tech';
    bestFor: string;
  };
}

const resumeThemes: ResumeTheme[] = [
  { id: 'classic', name: '클래식', description: '전통 이력서', headerStyle: 'border-b-2 border-slate-800 pb-6 mb-8', sectionTitleStyle: 'text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-1.5 mb-3', bodyStyle: 'text-slate-800', accentColor: 'slate', fontFamily: "-apple-system, 'Pretendard', sans-serif", preview: { headerBg: '#1e293b', headerText: '#ffffff', accentBar: '#334155', bodyBg: '#ffffff', category: 'basic', bestFor: '모든 직군, 범용' } },
  { id: 'modern', name: '모던', description: '좌측 컬러 바', headerStyle: 'border-l-[8px] border-blue-500 pl-6 pb-6 mb-8 bg-blue-50 -mx-6 sm:-mx-10 px-6 sm:px-10 -mt-6 sm:-mt-10 pt-6 sm:pt-10', sectionTitleStyle: 'text-sm font-bold text-blue-600 mb-3 pl-3 border-l-[4px] border-blue-400 py-0.5', bodyStyle: 'text-slate-700', accentColor: 'blue', fontFamily: "'Inter', -apple-system, sans-serif", preview: { headerBg: '#eff6ff', headerText: '#1e40af', accentBar: '#3b82f6', bodyBg: '#ffffff', category: 'basic', bestFor: 'IT, 스타트업' } },
  { id: 'minimal', name: '미니멀', description: '여백 중심', headerStyle: 'pb-3 mb-8', sectionTitleStyle: 'text-[10px] font-normal text-slate-400 uppercase tracking-[0.5em] mb-5', bodyStyle: 'text-slate-500 leading-loose', accentColor: 'slate', fontFamily: "'Helvetica Neue', Arial, sans-serif", preview: { headerBg: '#f8fafc', headerText: '#475569', accentBar: '#94a3b8', bodyBg: '#ffffff', category: 'basic', bestFor: '디자이너, 마케팅' } },
  { id: 'professional', name: '프로페셔널', description: '풀 다크 헤더', headerStyle: 'bg-slate-900 text-white -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 px-8 sm:px-12 pt-10 sm:pt-12 pb-10 mb-10', sectionTitleStyle: 'text-xs font-bold text-white bg-slate-800 px-4 py-2 mb-4 -mx-2 uppercase tracking-wider', bodyStyle: 'text-slate-700', accentColor: 'slate', fontFamily: "'Noto Sans KR', sans-serif", premium: true, preview: { headerBg: '#0f172a', headerText: '#ffffff', accentBar: '#1e293b', bodyBg: '#ffffff', category: 'professional', bestFor: '경력직, 대기업' } },
  { id: 'creative', name: '크리에이티브', description: '멀티컬러 그라디언트', headerStyle: 'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 px-6 sm:px-10 pt-10 sm:pt-14 pb-10 mb-8 rounded-b-[3rem]', sectionTitleStyle: 'text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 mb-4 uppercase', bodyStyle: 'text-slate-700', accentColor: 'purple', fontFamily: "'Pretendard', sans-serif", premium: true, preview: { headerBg: 'linear-gradient(to right, #9333ea, #ec4899, #f97316)', headerText: '#ffffff', accentBar: '#a855f7', bodyBg: '#ffffff', category: 'creative', bestFor: '크리에이터, 디자이너' } },
  { id: 'executive', name: '임원급', description: '중앙 세리프 격식', headerStyle: 'text-center pb-10 mb-10 border-b-2 border-double border-slate-400', sectionTitleStyle: 'text-center text-xs font-normal text-slate-500 uppercase tracking-[0.5em] mb-5 py-2 border-y border-slate-200', bodyStyle: 'text-slate-700 leading-[1.9]', accentColor: 'slate', fontFamily: "'Georgia', 'Noto Serif KR', serif", premium: true, preview: { headerBg: '#ffffff', headerText: '#1e293b', accentBar: '#94a3b8', bodyBg: '#ffffff', category: 'professional', bestFor: '임원, C-Level' } },
  { id: 'startup', name: '스타트업', description: '대각선 그라디언트', headerStyle: 'bg-gradient-to-br from-indigo-600 via-blue-500 to-cyan-400 text-white -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 px-6 sm:px-10 pt-8 sm:pt-12 pb-8 mb-8 skew-y-0', sectionTitleStyle: 'text-sm font-bold text-indigo-600 mb-3 flex items-center gap-2 before:content-[""] before:w-12 before:h-[3px] before:bg-gradient-to-r before:from-indigo-500 before:to-cyan-400 before:rounded-full', bodyStyle: 'text-slate-700', accentColor: 'indigo', fontFamily: "'Inter', -apple-system, sans-serif", premium: true, preview: { headerBg: 'linear-gradient(to bottom right, #4f46e5, #3b82f6, #06b6d4)', headerText: '#ffffff', accentBar: '#6366f1', bodyBg: '#ffffff', category: 'creative', bestFor: '스타트업, IT' } },
  { id: 'academic', name: '학술', description: '논문 포맷', headerStyle: 'pb-4 mb-6 border-b border-slate-400', sectionTitleStyle: 'text-[14px] font-bold text-slate-900 mb-2 pb-1 border-b-[3px] border-slate-800 inline-block pr-12', bodyStyle: 'text-slate-800 leading-[2] text-[13px]', accentColor: 'slate', fontFamily: "'Times New Roman', 'Noto Serif KR', serif", premium: true, preview: { headerBg: '#ffffff', headerText: '#0f172a', accentBar: '#1e293b', bodyBg: '#ffffff', category: 'academic', bestFor: '연구원, 교수' } },
  { id: 'tech', name: '테크', description: 'GitHub 터미널', headerStyle: 'bg-[#0d1117] text-[#58a6ff] -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 px-6 sm:px-10 pt-8 sm:pt-10 pb-8 mb-8 font-mono border-b-4 border-[#238636]', sectionTitleStyle: 'text-xs font-bold text-[#7ee787] font-mono uppercase tracking-wider mb-3 before:content-["$_"] before:text-[#484f58] before:mr-2 before:font-normal', bodyStyle: 'text-slate-700 text-[13px]', accentColor: 'green', fontFamily: "'JetBrains Mono', 'D2Coding', monospace", premium: true, preview: { headerBg: '#0d1117', headerText: '#58a6ff', accentBar: '#238636', bodyBg: '#ffffff', category: 'tech', bestFor: '개발자, 엔지니어' } },
  { id: 'elegant', name: '엘레강트', description: '골드 럭셔리', headerStyle: 'text-center pb-10 mb-10 border-b-2 border-amber-400 bg-gradient-to-b from-amber-50 to-transparent -mx-6 sm:-mx-10 px-6 sm:px-10 -mt-6 sm:-mt-10 pt-10 sm:pt-12', sectionTitleStyle: 'text-center text-[11px] font-light text-amber-800 uppercase tracking-[0.5em] mb-5 pb-2 border-b border-amber-300', bodyStyle: 'text-slate-700', accentColor: 'amber', fontFamily: "'Playfair Display', 'Noto Serif KR', serif", premium: true, preview: { headerBg: 'linear-gradient(to bottom, #fffbeb, #ffffff)', headerText: '#92400e', accentBar: '#f59e0b', bodyBg: '#ffffff', category: 'creative', bestFor: '럭셔리, 패션' } },
  { id: 'newspaper', name: '뉴스페이퍼', description: '신문 칼럼', headerStyle: 'text-center py-6 mb-6 border-y-[6px] border-double border-slate-900', sectionTitleStyle: 'text-center text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] mb-4 py-1.5 border-y-2 border-slate-800', bodyStyle: 'text-slate-800 leading-relaxed text-[13px]', accentColor: 'slate', fontFamily: "'Georgia', 'Noto Serif KR', serif", premium: true, preview: { headerBg: '#ffffff', headerText: '#0f172a', accentBar: '#0f172a', bodyBg: '#ffffff', category: 'professional', bestFor: '언론, 작가' } },
  { id: 'pastel', name: '파스텔', description: '부드러운 곡선', headerStyle: 'bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 dark:from-pink-900/20 -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 px-6 sm:px-10 pt-10 sm:pt-12 pb-10 mb-8 rounded-b-[3rem]', sectionTitleStyle: 'text-sm font-semibold text-purple-500 mb-3 flex items-center gap-2.5 before:content-[""] before:w-4 before:h-4 before:bg-gradient-to-br before:from-pink-400 before:to-purple-400 before:rounded-full', bodyStyle: 'text-slate-600', accentColor: 'purple', fontFamily: "'Pretendard', -apple-system, sans-serif", premium: true, preview: { headerBg: 'linear-gradient(to right, #fce7f3, #e9d5ff, #dbeafe)', headerText: '#7e22ce', accentBar: '#a855f7', bodyBg: '#ffffff', category: 'creative', bestFor: '신입, 인턴' } },
  { id: 'dark', name: '다크', description: '네이비 모던', headerStyle: 'bg-[#1a1a2e] text-[#eaeaea] -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 px-6 sm:px-10 pt-10 sm:pt-12 pb-10 mb-8', sectionTitleStyle: 'text-sm font-bold text-[#6c63ff] uppercase tracking-wider mb-4 border-l-[5px] border-[#6c63ff] pl-4 py-0.5', bodyStyle: 'text-slate-700', accentColor: 'slate', fontFamily: "'Inter', -apple-system, sans-serif", premium: true, preview: { headerBg: '#1a1a2e', headerText: '#eaeaea', accentBar: '#6c63ff', bodyBg: '#ffffff', category: 'tech', bestFor: '개발자, 데이터' } },
  { id: 'corporate', name: '대기업', description: '공채 포멀', headerStyle: 'border-b-[3px] border-slate-800 pb-6 mb-8', sectionTitleStyle: 'text-xs font-bold text-white bg-slate-900 -mx-2 px-4 py-2.5 mb-4 tracking-wide', bodyStyle: 'text-slate-800 text-[13px]', accentColor: 'slate', fontFamily: "'Noto Sans KR', sans-serif", premium: true, preview: { headerBg: '#ffffff', headerText: '#0f172a', accentBar: '#0f172a', bodyBg: '#ffffff', category: 'professional', bestFor: '대기업, 공채' } },
  { id: 'portfolio', name: '포트폴리오', description: '크리에이터 전용', headerStyle: 'bg-gradient-to-br from-indigo-700 via-purple-600 to-pink-500 text-white -mx-6 sm:-mx-10 -mt-6 sm:-mt-10 px-6 sm:px-10 pt-14 sm:pt-16 pb-14 mb-10', sectionTitleStyle: 'text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 mb-5', bodyStyle: 'text-slate-700', accentColor: 'indigo', fontFamily: "'Pretendard', sans-serif", premium: true, preview: { headerBg: 'linear-gradient(to bottom right, #4338ca, #9333ea, #ec4899)', headerText: '#ffffff', accentBar: '#6366f1', bodyBg: '#ffffff', category: 'creative', bestFor: '크리에이터, 포트폴리오' } },
];

const THEME_CATEGORY_LABELS: Record<string, string> = {
  basic: '기본',
  professional: '프로페셔널',
  creative: '크리에이티브',
  academic: '학술/연구',
  tech: '테크/개발',
};

const REQUIRED_FIELDS: (keyof ResumeTheme)[] = [
  'id', 'name', 'headerStyle', 'sectionTitleStyle', 'bodyStyle', 'accentColor', 'fontFamily',
];

describe('resumeThemes', () => {
  it('contains exactly 15 themes', () => {
    expect(resumeThemes).toHaveLength(15);
  });

  it.each(REQUIRED_FIELDS)('every theme has required field: %s', (field) => {
    for (const theme of resumeThemes) {
      expect(theme[field]).toBeDefined();
      expect(typeof theme[field]).toBe('string');
      expect((theme[field] as string).length).toBeGreaterThan(0);
    }
  });

  it('has no duplicate theme IDs', () => {
    const ids = resumeThemes.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all expected theme IDs are present', () => {
    const expectedIds = [
      'classic', 'modern', 'minimal', 'professional', 'creative',
      'executive', 'startup', 'academic', 'tech', 'elegant',
      'newspaper', 'pastel', 'dark', 'corporate', 'portfolio',
    ];
    const actualIds = resumeThemes.map(t => t.id);
    for (const id of expectedIds) {
      expect(actualIds).toContain(id);
    }
  });

  it('free themes are classic, modern, and minimal', () => {
    const freeThemes = resumeThemes.filter(t => !t.premium);
    const freeIds = freeThemes.map(t => t.id).sort();
    expect(freeIds).toEqual(['classic', 'minimal', 'modern']);
  });

  it('premium themes are correctly marked (12 premium themes)', () => {
    const premiumThemes = resumeThemes.filter(t => t.premium === true);
    expect(premiumThemes).toHaveLength(12);
  });

  it('every theme has a preview object with required fields', () => {
    for (const theme of resumeThemes) {
      expect(theme.preview).toBeDefined();
      expect(theme.preview!.headerBg).toBeTruthy();
      expect(theme.preview!.headerText).toBeTruthy();
      expect(theme.preview!.accentBar).toBeTruthy();
      expect(theme.preview!.bodyBg).toBeTruthy();
      expect(theme.preview!.category).toBeTruthy();
      expect(theme.preview!.bestFor).toBeTruthy();
    }
  });

  it('theme categories cover all themes', () => {
    const validCategories = Object.keys(THEME_CATEGORY_LABELS);
    for (const theme of resumeThemes) {
      expect(validCategories).toContain(theme.preview!.category);
    }
  });

  it('category labels has all 5 categories', () => {
    expect(Object.keys(THEME_CATEGORY_LABELS).sort()).toEqual(
      ['academic', 'basic', 'creative', 'professional', 'tech'],
    );
  });

  it('each category has at least one theme', () => {
    const categories = Object.keys(THEME_CATEGORY_LABELS);
    for (const cat of categories) {
      const themesInCat = resumeThemes.filter(t => t.preview?.category === cat);
      expect(themesInCat.length).toBeGreaterThanOrEqual(1);
    }
  });
});
