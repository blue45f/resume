import '@testing-library/jest-dom/vitest';

// jsdom lacks a real localStorage implementation — polyfill minimal Storage so i18n getLocale works.
if (typeof window !== 'undefined' && !window.localStorage) {
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      get length() {
        return store.size;
      },
    },
    writable: false,
  });
}
