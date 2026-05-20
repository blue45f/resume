import type { Preview, Decorator } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import '../src/index.css';

/**
 * locale toggle decorator — 한국어/영어/일본어. tx() 가 사용하는 localStorage 키
 * (resume-locale) 를 직접 세팅. 컴포넌트 마운트 전에 적용되도록 동기 처리.
 */
const withLocale: Decorator = (Story, context) => {
  const locale = context.globals.locale ?? 'ko';
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('resume-locale', locale);
    document.documentElement.lang = locale === 'ja' ? 'ja' : locale === 'en' ? 'en' : 'ko';
  }
  return <Story />;
};

/** Router + Tooltip provider — 다수 컴포넌트가 react-router 와 tooltip 컨텍스트를 요구. */
const withProviders: Decorator = (Story) => (
  <MemoryRouter>
    <RadixTooltip.Provider delayDuration={200}>
      <Story />
    </RadixTooltip.Provider>
  </MemoryRouter>
);

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'slate', value: '#f1f5f9' },
        { name: 'dark', value: '#0f172a' },
      ],
    },
    a11y: {
      // 자동 검사는 옵션, 매뉴얼 트리거.
      test: 'todo',
    },
  },
  globalTypes: {
    locale: {
      name: 'Locale',
      description: '언어 선택',
      defaultValue: 'ko',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'ko', title: '한국어' },
          { value: 'en', title: 'English' },
          { value: 'ja', title: '日本語' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withLocale, withProviders],
};

export default preview;
