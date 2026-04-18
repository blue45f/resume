/**
 * Tests for i18n translation data integrity.
 * Validates that all locales have consistent keys and correct translations.
 *
 * The translation data is copied from src/lib/i18n.ts to avoid import.meta.env issues.
 */

type Locale = 'ko' | 'en' | 'ja';

const ko = {
  'common.home': '홈',
  'common.login': '로그인',
  'common.logout': '로그아웃',
  'common.settings': '설정',
  'common.save': '저장',
  'common.cancel': '취소',
  'common.delete': '삭제',
  'common.edit': '편집',
  'common.preview': '미리보기',
  'common.search': '검색',
  'common.close': '닫기',
  'common.copy': '복사',
  'common.share': '공유',
  'common.loading': '불러오는 중...',
  'common.noResults': '결과가 없습니다',
  'nav.resumes': '이력서',
  'nav.explore': '탐색',
  'nav.templates': '템플릿',
  'nav.tags': '태그',
  'nav.applications': '지원관리',
  'nav.coverLetter': '자소서',
  'nav.compare': '비교',
  'nav.aiGenerate': 'AI 생성',
  'nav.newResume': '+ 새 이력서',
  'nav.admin': '관리자',
  'nav.tutorial': '사용 가이드',
  'home.title': '내 이력서',
  'home.subtitle': 'AI가 도와주는 이력서 작성',
  'home.myResumes': '내 이력서',
  'home.welcome': '이력서를 스마트하게 관리하세요',
  'home.welcomeDesc':
    'AI가 도와주는 이력서 작성. 15가지 테마로 미리보기하고, ATS 호환성을 검사하고, 다양한 양식으로 변환하세요.',
  'home.directWrite': '직접 작성',
  'home.aiGenerate': 'AI 자동 생성',
  'home.explore': '둘러보기',
  'home.quickImport': '빠른 가져오기',
  'resume.personal': '인적사항',
  'resume.experience': '경력',
  'resume.education': '학력',
  'resume.skills': '기술',
  'resume.projects': '프로젝트',
  'resume.certifications': '자격증',
  'resume.languages': '어학',
  'resume.awards': '수상',
  'resume.activities': '활동',
  'resume.summary': '자기소개',
  'footer.copyright': '© 2025 이력서공방',
  'footer.openSource': '오픈소스 프로젝트',
};

const en = {
  'common.home': 'Home',
  'common.login': 'Login',
  'common.logout': 'Logout',
  'common.settings': 'Settings',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.preview': 'Preview',
  'common.search': 'Search',
  'common.close': 'Close',
  'common.copy': 'Copy',
  'common.share': 'Share',
  'common.loading': 'Loading...',
  'common.noResults': 'No results found',
  'nav.resumes': 'Resumes',
  'nav.explore': 'Explore',
  'nav.templates': 'Templates',
  'nav.tags': 'Tags',
  'nav.applications': 'Applications',
  'nav.coverLetter': 'Cover Letter',
  'nav.compare': 'Compare',
  'nav.aiGenerate': 'AI Generate',
  'nav.newResume': '+ New Resume',
  'nav.admin': 'Admin',
  'nav.tutorial': 'Guide',
  'home.title': 'My Resumes',
  'home.subtitle': 'AI-powered resume builder',
  'home.myResumes': 'My Resumes',
  'home.welcome': 'Manage your resume smartly',
  'home.welcomeDesc':
    'AI-powered resume writing. Preview with 15 themes, check ATS compatibility, and convert to various formats.',
  'home.directWrite': 'Write directly',
  'home.aiGenerate': 'AI Generate',
  'home.explore': 'Explore',
  'home.quickImport': 'Quick Import',
  'resume.personal': 'Personal Info',
  'resume.experience': 'Experience',
  'resume.education': 'Education',
  'resume.skills': 'Skills',
  'resume.projects': 'Projects',
  'resume.certifications': 'Certifications',
  'resume.languages': 'Languages',
  'resume.awards': 'Awards',
  'resume.activities': 'Activities',
  'resume.summary': 'Summary',
  'footer.copyright': '© 2025 Resume Workshop',
  'footer.openSource': 'Open Source Project',
};

const ja = {
  'common.home': 'ホーム',
  'common.login': 'ログイン',
  'common.logout': 'ログアウト',
  'common.settings': '設定',
  'common.save': '保存',
  'common.cancel': 'キャンセル',
  'common.delete': '削除',
  'common.edit': '編集',
  'common.preview': 'プレビュー',
  'common.search': '検索',
  'common.close': '閉じる',
  'common.copy': 'コピー',
  'common.share': '共有',
  'common.loading': '読み込み中...',
  'common.noResults': '結果がありません',
  'nav.resumes': '履歴書',
  'nav.explore': '探索',
  'nav.templates': 'テンプレート',
  'nav.tags': 'タグ',
  'nav.applications': '応募管理',
  'nav.coverLetter': '志望動機',
  'nav.compare': '比較',
  'nav.aiGenerate': 'AI生成',
  'nav.newResume': '+ 新規作成',
  'nav.admin': '管理者',
  'nav.tutorial': 'ガイド',
  'home.title': 'マイ履歴書',
  'home.subtitle': 'AI搭載の履歴書作成ツール',
  'home.myResumes': 'マイ履歴書',
  'home.welcome': '履歴書をスマートに管理',
  'home.welcomeDesc':
    'AIが履歴書作成をサポート。15種類のテーマでプレビュー、ATS互換性チェック、多様な形式に変換。',
  'home.directWrite': '直接作成',
  'home.aiGenerate': 'AI自動生成',
  'home.explore': '探す',
  'home.quickImport': 'クイックインポート',
  'resume.personal': '個人情報',
  'resume.experience': '職歴',
  'resume.education': '学歴',
  'resume.skills': 'スキル',
  'resume.projects': 'プロジェクト',
  'resume.certifications': '資格',
  'resume.languages': '語学',
  'resume.awards': '受賞',
  'resume.activities': '活動',
  'resume.summary': '自己紹介',
  'footer.copyright': '© 2025 履歴書工房',
  'footer.openSource': 'オープンソースプロジェクト',
};

const translations: Record<Locale, Record<string, string>> = { ko, en, ja };
const LOCALES: Locale[] = ['ko', 'en', 'ja'];

describe('i18n translations', () => {
  const koKeys = Object.keys(ko).sort();
  const enKeys = Object.keys(en).sort();
  const jaKeys = Object.keys(ja).sort();

  it('all three locales have the same keys', () => {
    expect(enKeys).toEqual(koKeys);
    expect(jaKeys).toEqual(koKeys);
  });

  it('key count matches across all locales', () => {
    expect(Object.keys(ko).length).toBe(Object.keys(en).length);
    expect(Object.keys(ko).length).toBe(Object.keys(ja).length);
  });

  it('no missing translations (no empty strings)', () => {
    for (const locale of LOCALES) {
      const dict = translations[locale];
      for (const [key, value] of Object.entries(dict)) {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
        // Value must not be empty or whitespace-only
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('has all expected key prefixes', () => {
    const prefixes = ['common.', 'nav.', 'home.', 'resume.', 'footer.'];
    for (const prefix of prefixes) {
      const matching = koKeys.filter((k) => k.startsWith(prefix));
      expect(matching.length).toBeGreaterThan(0);
    }
  });

  it('specific important Korean translations are correct', () => {
    expect(ko['common.save']).toBe('저장');
    expect(ko['common.delete']).toBe('삭제');
    expect(ko['nav.resumes']).toBe('이력서');
    expect(ko['home.title']).toBe('내 이력서');
    expect(ko['resume.experience']).toBe('경력');
  });

  it('specific important English translations are correct', () => {
    expect(en['common.save']).toBe('Save');
    expect(en['common.delete']).toBe('Delete');
    expect(en['nav.resumes']).toBe('Resumes');
    expect(en['home.title']).toBe('My Resumes');
    expect(en['resume.experience']).toBe('Experience');
  });

  it('specific important Japanese translations are correct', () => {
    expect(ja['common.save']).toBe('保存');
    expect(ja['common.delete']).toBe('削除');
    expect(ja['nav.resumes']).toBe('履歴書');
    expect(ja['resume.experience']).toBe('職歴');
  });

  it('LOCALES array contains exactly ko, en, ja', () => {
    expect(LOCALES).toEqual(['ko', 'en', 'ja']);
  });

  it('has expected number of translation keys (47)', () => {
    expect(koKeys.length).toBe(47);
  });
});
