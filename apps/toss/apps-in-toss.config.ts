import { defineConfig } from '@apps-in-toss/web-framework/config'

export default defineConfig({
  appName: 'resume-gongbang',
  brand: {
    primaryColor: '#4D9FFF',
  },
  permissions: [
    { name: 'clipboard', access: 'read' },
    { name: 'clipboard', access: 'write' },
  ],
  webView: {},
  webBundleDir: 'dist',
  navigationBar: { withBackButton: true, withHomeButton: true },
})
