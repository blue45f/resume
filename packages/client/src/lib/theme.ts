type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'resume-theme';

export function getTheme(): Theme {
  return (localStorage.getItem(THEME_KEY) as Theme) || 'system';
}

export function setTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

export function applyTheme(theme: Theme) {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

export function initTheme() {
  applyTheme(getTheme());
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getTheme() === 'system') applyTheme('system');
  });
}
