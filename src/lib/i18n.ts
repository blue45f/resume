export type Locale = 'ko' | 'en' | 'ja';

const LOCALE_KEY = 'resume-locale';

export function getLocale(): Locale {
  return (localStorage.getItem(LOCALE_KEY) as Locale) || 'ko';
}

const langMap: Record<Locale, string> = { ko: 'ko', en: 'en', ja: 'ja' };

// RTL languages for future support (e.g., Arabic, Hebrew)
const rtlLocales: string[] = [];

export function isRtl(locale?: Locale): boolean {
  return rtlLocales.includes(locale || getLocale());
}

export function setLocale(locale: Locale) {
  localStorage.setItem(LOCALE_KEY, locale);
  document.documentElement.lang = langMap[locale] || 'ko';
  document.documentElement.dir = isRtl(locale) ? 'rtl' : 'ltr';
  window.location.reload();
}

type TranslationKeys = {
  // Common
  'common.home': string;
  'common.login': string;
  'common.logout': string;
  'common.settings': string;
  'common.save': string;
  'common.cancel': string;
  'common.delete': string;
  'common.edit': string;
  'common.preview': string;
  'common.search': string;
  'common.close': string;
  'common.copy': string;
  'common.share': string;
  'common.loading': string;
  'common.noResults': string;
  'common.confirm': string;
  'common.back': string;
  'common.next': string;
  'common.submit': string;
  'common.download': string;
  'common.upload': string;
  'common.add': string;
  'common.remove': string;
  'common.more': string;
  'common.retry': string;

  // Nav
  'nav.resumes': string;
  'nav.explore': string;
  'nav.templates': string;
  'nav.tags': string;
  'nav.applications': string;
  'nav.coverLetter': string;
  'nav.compare': string;
  'nav.aiGenerate': string;
  'nav.newResume': string;
  'nav.admin': string;
  'nav.tutorial': string;
  'nav.interviewPrep': string;
  'nav.feedback': string;
  'nav.scouts': string;
  'nav.translate': string;
  'nav.bookmarks': string;
  'nav.messages': string;
  'nav.pricing': string;
  'nav.recruiterDashboard': string;
  'nav.jobPostings': string;
  'nav.myCoverLetters': string;

  // Home
  'home.title': string;
  'home.subtitle': string;
  'home.myResumes': string;
  'home.welcome': string;
  'home.welcomeDesc': string;
  'home.directWrite': string;
  'home.aiGenerate': string;
  'home.explore': string;
  'home.quickImport': string;

  // Resume
  'resume.personal': string;
  'resume.experience': string;
  'resume.education': string;
  'resume.skills': string;
  'resume.projects': string;
  'resume.certifications': string;
  'resume.languages': string;
  'resume.awards': string;
  'resume.activities': string;
  'resume.summary': string;

  // Error messages
  'error.loginFailed': string;
  'error.emailRequired': string;
  'error.emailInvalid': string;
  'error.passwordRequired': string;
  'error.passwordMinLength': string;
  'error.nameRequired': string;
  'error.titleRequired': string;
  'error.authFailed': string;
  'error.saveFailed': string;
  'error.networkError': string;

  // Page titles
  'page.login': string;
  'page.register': string;
  'page.interviewPrep': string;
  'page.feedback': string;
  'page.scouts': string;
  'page.pricing': string;
  'page.settings': string;
  'page.compare': string;
  'page.translate': string;

  // Accessibility
  'a11y.skipToContent': string;
  'a11y.mainMenu': string;
  'a11y.mobileMenu': string;
  'a11y.openMenu': string;
  'a11y.closeMenu': string;
  'a11y.quickMenuOpen': string;
  'a11y.quickMenuClose': string;
  'a11y.shareMenu': string;
  'a11y.themeToggle': string;
  'a11y.languageSelect': string;
  'a11y.searchToggle': string;
  'a11y.profileMenu': string;

  // Footer
  'footer.copyright': string;
  'footer.openSource': string;
};

const ko: TranslationKeys = {
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
  'common.confirm': '확인',
  'common.back': '뒤로',
  'common.next': '다음',
  'common.submit': '제출',
  'common.download': '다운로드',
  'common.upload': '업로드',
  'common.add': '추가',
  'common.remove': '제거',
  'common.more': '더보기',
  'common.retry': '재시도',

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
  'nav.interviewPrep': '면접 준비',
  'nav.feedback': '피드백',
  'nav.scouts': '스카우트',
  'nav.translate': '번역',
  'nav.bookmarks': '북마크',
  'nav.messages': '쪽지',
  'nav.pricing': '요금제',
  'nav.recruiterDashboard': '채용 대시보드',
  'nav.jobPostings': '채용공고',
  'nav.myCoverLetters': '내 자소서',

  'home.title': '내 이력서',
  'home.subtitle': 'AI가 도와주는 이력서 작성',
  'home.myResumes': '내 이력서',
  'home.welcome': '이력서를 스마트하게 관리하세요',
  'home.welcomeDesc': 'AI가 도와주는 이력서 작성. 15가지 테마로 미리보기하고, ATS 호환성을 검사하고, 다양한 양식으로 변환하세요.',
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

  'error.loginFailed': '로그인에 실패했습니다. 다시 시도해주세요.',
  'error.emailRequired': '이메일을 입력해주세요',
  'error.emailInvalid': '올바른 이메일 형식을 입력해주세요',
  'error.passwordRequired': '비밀번호를 입력해주세요',
  'error.passwordMinLength': '비밀번호는 8자 이상이어야 합니다',
  'error.nameRequired': '이름을 입력해주세요',
  'error.titleRequired': '이력서 제목을 입력해주세요',
  'error.authFailed': '인증에 실패했습니다',
  'error.saveFailed': '저장에 실패했습니다',
  'error.networkError': '네트워크 오류가 발생했습니다',

  'page.login': '로그인',
  'page.register': '회원가입',
  'page.interviewPrep': '면접 준비',
  'page.feedback': '피드백',
  'page.scouts': '스카우트',
  'page.pricing': '요금제',
  'page.settings': '설정',
  'page.compare': '이력서 비교',
  'page.translate': '이력서 번역',

  'a11y.skipToContent': '본문으로 건너뛰기',
  'a11y.mainMenu': '주요 메뉴',
  'a11y.mobileMenu': '모바일 메뉴',
  'a11y.openMenu': '메뉴 열기',
  'a11y.closeMenu': '메뉴 닫기',
  'a11y.quickMenuOpen': '빠른 메뉴 열기',
  'a11y.quickMenuClose': '빠른 메뉴 닫기',
  'a11y.shareMenu': '공유',
  'a11y.themeToggle': '테마 변경',
  'a11y.languageSelect': '언어 선택',
  'a11y.searchToggle': '검색',
  'a11y.profileMenu': '프로필 메뉴',

  'footer.copyright': '© 2025 이력서공방',
  'footer.openSource': '오픈소스 프로젝트',
};

const en: TranslationKeys = {
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
  'common.confirm': 'Confirm',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.submit': 'Submit',
  'common.download': 'Download',
  'common.upload': 'Upload',
  'common.add': 'Add',
  'common.remove': 'Remove',
  'common.more': 'More',
  'common.retry': 'Retry',

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
  'nav.interviewPrep': 'Interview Prep',
  'nav.feedback': 'Feedback',
  'nav.scouts': 'Scout',
  'nav.translate': 'Translate',
  'nav.bookmarks': 'Bookmarks',
  'nav.messages': 'Messages',
  'nav.pricing': 'Pricing',
  'nav.recruiterDashboard': 'Recruiter Dashboard',
  'nav.jobPostings': 'Job Postings',
  'nav.myCoverLetters': 'My Cover Letters',

  'home.title': 'My Resumes',
  'home.subtitle': 'AI-powered resume builder',
  'home.myResumes': 'My Resumes',
  'home.welcome': 'Manage your resume smartly',
  'home.welcomeDesc': 'AI-powered resume writing. Preview with 15 themes, check ATS compatibility, and convert to various formats.',
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

  'error.loginFailed': 'Login failed. Please try again.',
  'error.emailRequired': 'Email is required',
  'error.emailInvalid': 'Please enter a valid email address',
  'error.passwordRequired': 'Password is required',
  'error.passwordMinLength': 'Password must be at least 8 characters',
  'error.nameRequired': 'Name is required',
  'error.titleRequired': 'Resume title is required',
  'error.authFailed': 'Authentication failed',
  'error.saveFailed': 'Failed to save',
  'error.networkError': 'A network error occurred',

  'page.login': 'Login',
  'page.register': 'Register',
  'page.interviewPrep': 'Interview Prep',
  'page.feedback': 'Feedback',
  'page.scouts': 'Scout',
  'page.pricing': 'Pricing',
  'page.settings': 'Settings',
  'page.compare': 'Compare Resumes',
  'page.translate': 'Translate Resume',

  'a11y.skipToContent': 'Skip to main content',
  'a11y.mainMenu': 'Main menu',
  'a11y.mobileMenu': 'Mobile menu',
  'a11y.openMenu': 'Open menu',
  'a11y.closeMenu': 'Close menu',
  'a11y.quickMenuOpen': 'Open quick menu',
  'a11y.quickMenuClose': 'Close quick menu',
  'a11y.shareMenu': 'Share',
  'a11y.themeToggle': 'Toggle theme',
  'a11y.languageSelect': 'Select language',
  'a11y.searchToggle': 'Search',
  'a11y.profileMenu': 'Profile menu',

  'footer.copyright': '© 2025 Resume Workshop',
  'footer.openSource': 'Open Source Project',
};

const ja: TranslationKeys = {
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
  'common.confirm': '確認',
  'common.back': '戻る',
  'common.next': '次へ',
  'common.submit': '送信',
  'common.download': 'ダウンロード',
  'common.upload': 'アップロード',
  'common.add': '追加',
  'common.remove': '除去',
  'common.more': 'もっと見る',
  'common.retry': '再試行',

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
  'nav.interviewPrep': '面接準備',
  'nav.feedback': 'フィードバック',
  'nav.scouts': 'スカウト',
  'nav.translate': '翻訳',
  'nav.bookmarks': 'ブックマーク',
  'nav.messages': 'メッセージ',
  'nav.pricing': '料金プラン',
  'nav.recruiterDashboard': '採用ダッシュボード',
  'nav.jobPostings': '求人情報',
  'nav.myCoverLetters': '志望動機一覧',

  'home.title': 'マイ履歴書',
  'home.subtitle': 'AI搭載の履歴書作成ツール',
  'home.myResumes': 'マイ履歴書',
  'home.welcome': '履歴書をスマートに管理',
  'home.welcomeDesc': 'AIが履歴書作成をサポート。15種類のテーマでプレビュー、ATS互換性チェック、多様な形式に変換。',
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

  'error.loginFailed': 'ログインに失敗しました。もう一度お試しください。',
  'error.emailRequired': 'メールアドレスを入力してください',
  'error.emailInvalid': '正しいメールアドレスを入力してください',
  'error.passwordRequired': 'パスワードを入力してください',
  'error.passwordMinLength': 'パスワードは8文字以上必要です',
  'error.nameRequired': '名前を入力してください',
  'error.titleRequired': '履歴書のタイトルを入力してください',
  'error.authFailed': '認証に失敗しました',
  'error.saveFailed': '保存に失敗しました',
  'error.networkError': 'ネットワークエラーが発生しました',

  'page.login': 'ログイン',
  'page.register': '新規登録',
  'page.interviewPrep': '面接準備',
  'page.feedback': 'フィードバック',
  'page.scouts': 'スカウト',
  'page.pricing': '料金プラン',
  'page.settings': '設定',
  'page.compare': '履歴書比較',
  'page.translate': '履歴書翻訳',

  'a11y.skipToContent': '本文へスキップ',
  'a11y.mainMenu': 'メインメニュー',
  'a11y.mobileMenu': 'モバイルメニュー',
  'a11y.openMenu': 'メニューを開く',
  'a11y.closeMenu': 'メニューを閉じる',
  'a11y.quickMenuOpen': 'クイックメニューを開く',
  'a11y.quickMenuClose': 'クイックメニューを閉じる',
  'a11y.shareMenu': '共有',
  'a11y.themeToggle': 'テーマ切替',
  'a11y.languageSelect': '言語選択',
  'a11y.searchToggle': '検索',
  'a11y.profileMenu': 'プロフィールメニュー',

  'footer.copyright': '© 2025 履歴書工房',
  'footer.openSource': 'オープンソースプロジェクト',
};

const translations: Record<Locale, TranslationKeys> = { ko, en, ja };

let currentLocale: Locale = getLocale();

export function t(key: keyof TranslationKeys): string {
  return translations[currentLocale]?.[key] || translations.ko[key] || key;
}

export function getLocaleName(locale: Locale): string {
  const names: Record<Locale, string> = { ko: '한국어', en: 'English', ja: '日本語' };
  return names[locale];
}

export const LOCALES: Locale[] = ['ko', 'en', 'ja'];

// Initialize HTML lang and dir attributes
document.documentElement.lang = langMap[getLocale()] || 'ko';
document.documentElement.dir = isRtl() ? 'rtl' : 'ltr';
