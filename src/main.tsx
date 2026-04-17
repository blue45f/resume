import { API_URL } from '@/lib/config';
import './i18n';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTheme } from './lib/theme'
import { setMonetizationEnabled } from './lib/plans'

initTheme();

// 앱 시작 시 유료화 설정 로드 (비동기, 실패해도 기본값 유지)

fetch(`${API_URL}/api/system-config/public`)
  .then(r => r.ok ? r.json() : null)
  .then(d => {
    if (d && 'monetization_enabled' in d) {
      setMonetizationEnabled(d.monetization_enabled === 'true' || d.monetization_enabled === true);
    }
  })
  .catch(() => {});

async function enableMocking() {
  // VITE_MSW=true 일 때만 MSW 활성화 (백엔드 없이 프론트 개발 시)
  if (import.meta.env.VITE_MSW !== 'true') {
    return;
  }

  const { worker } = await import('./mocks/browser');
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

// Global unhandled error logging
window.addEventListener('unhandledrejection', e => {
  console.error('[Unhandled Promise]', e.reason?.message || e.reason);
});

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

  // Register service worker for offline support
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
})
