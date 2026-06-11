import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { getLocale, LOCALES } from '@/lib/i18n';
import ko from './locales/ko.json';
import en from './locales/en.json';
import ja from './locales/ja.json';
import zhCN from './locales/zh-CN.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: { translation: ko },
      en: { translation: en },
      ja: { translation: ja },
      'zh-CN': { translation: zhCN },
    },
    // lib/i18n(setLocale → 'resume-locale')이 관리하는 앱 로케일과 단일 소스 유지.
    // 명시 lng 가 detector 감지보다 우선하므로 UI 언어와 어긋나지 않는다.
    lng: getLocale(),
    fallbackLng: 'ko',
    supportedLngs: LOCALES,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'lang',
    },
  });

// 언어 변경(초기 init 포함) 시 <html lang> 동기화 — 스크린리더·브라우저 번역·SEO 힌트.
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
