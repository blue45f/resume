import type { StorybookConfig } from '@storybook/react-vite'

/**
 * Storybook 10 + React 19 + Vite 8 + TailwindCSS 4 설정.
 *
 * Storybook 9+ 부터 controls/actions/viewport/backgrounds/toolbars/docs 는
 * core 에 통합되어 별도 addon 등록 불필요.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],
  addons: ['@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  staticDirs: ['../public'],
  typescript: {
    // 빠른 빌드를 위해 docgen 비활성. 필요 시 'react-docgen-typescript' 로 전환.
    reactDocgen: 'react-docgen',
  },
}

export default config
