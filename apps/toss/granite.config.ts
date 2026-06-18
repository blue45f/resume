import { defineConfig } from '@apps-in-toss/web-framework/config'

// 직무별 이력서 예시 갤러리. 비게임=partner.
export default defineConfig({
  appName: 'resume-gongbang',
  brand: { displayName: '이력서공방', primaryColor: '#4D9FFF', icon: '' },
  web: { host: 'localhost', port: 5187, commands: { dev: 'vite', build: 'vite build' } },
  permissions: [
    { name: 'clipboard', access: 'read' },
    { name: 'clipboard', access: 'write' },
  ],
  outdir: 'dist',
  webViewProps: { type: 'partner' },
  navigationBar: { withBackButton: true, withHomeButton: true },
})
