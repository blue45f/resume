import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {LANGS.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          title={lang.label}
          style={{
            background: i18n.language === lang.code ? 'rgba(99,102,241,0.15)' : 'transparent',
            border: i18n.language === lang.code ? '1px solid #6366f1' : '1px solid transparent',
            borderRadius: '6px',
            padding: '2px 6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: i18n.language === lang.code ? 600 : 400,
            color: i18n.language === lang.code ? '#6366f1' : '#666',
          }}
        >
          {lang.flag} {lang.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
