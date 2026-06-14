import { base, react, defineConfig } from '@heejun/eslint-config'
import { globalIgnores } from 'eslint/config'
import globals from 'globals'

export default defineConfig(
  globalIgnores([
    '**/dist/**',
    '**/dist-server/**',
    '**/node_modules/**',
    '**/coverage/**',
    '**/*.d.ts',
    'public/**',
    'packages/client/public/**',
    'packages/client/storybook-static/**',
    'packages/server/prisma/migrations/**',
  ]),

  // 공유 베이스(TS + import 위생 + prettier 충돌 비활성). 커스텀 규칙은 5.0.0 에서
  // opt-in 이므로 펼치지 않는다(heejun 개인 테스트/목 컨벤션은 이 레포 대상 아님).
  base({ files: ['**/*.{ts,tsx}'] }),

  // packages/client — React 19 + Vite + RC + jsx-a11y + react-compiler 게이트.
  react({ files: ['packages/client/**/*.{ts,tsx}'] }),

  // packages/client 레포 정책: 네이티브 confirm/alert/prompt 금지 + RC 강제.
  // (useConfirm()/usePrompt() 같은 로컬 변수는 섀도잉이라 영향 없음)
  {
    files: ['packages/client/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'confirm',
          message: 'useConfirm()/ConfirmDialog를 사용하세요 (window.confirm 금지).',
        },
        { name: 'alert', message: 'toast()를 사용하세요 (window.alert 금지).' },
        {
          name: 'prompt',
          message: 'usePrompt()/PromptProvider를 사용하세요 (window.prompt 금지).',
        },
      ],
      // autoFocus 사용처는 전부 사용자 동작으로 막 노출되는 오버레이/인라인 편집 컨트롤
      // (CommandPalette·PromptProvider·답글/이름변경 인라인 입력 등)이라 포커스를 옮기는 것이
      // 올바른 모달 접근성 동작이다(페이지 로드 시점의 autofocus 가 아님). 12개 사용처를 개별
      // disable 로 흩는 대신 client 한정으로 끈다(offhours·webtoon 와 동일 정책).
      'jsx-a11y/no-autofocus': 'off',
    },
  },

  // 레거시 클라이언트 코드에 처음 적용되는 react-hooks v7 컴파일러 진단 계열은
  // 비활성화한다(이전 config 는 client 글롭에만 react() 를 적용한 적이 없어 미실행).
  // 진단 계열(set-state-in-effect/purity/refs/immutability/incompatible-library)은
  // RC 가 자동 메모이즈하므로 런타임 정확성을 깨지 않으며, 레거시 패턴을 일괄 리라이트
  // 하는 것은 본 어댑션 범위를 벗어난다(webtoon/remote-devtools/termsdesk 와 동일 정책).
  // exhaustive-deps/rules-of-hooks(실버그 계열)는 그대로 error 로 유지한다.
  {
    files: ['packages/client/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },

  // packages/server — NestJS (Node). 데코레이터 + 빈 생성자/클래스 관용.
  {
    files: ['packages/server/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },

  // packages/shared — isomorphic (Node) + 루트 scripts(seed/CLI, Node).
  {
    files: ['packages/shared/**/*.ts', 'scripts/**/*.ts'],
    languageOptions: { globals: globals.node },
  },

  // 테스트 — jest/vitest globals; fast-refresh 제약 완화 + any 허용.
  {
    files: ['**/*.{test,spec}.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser, ...globals.jest } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-refresh/only-export-components': 'off',
    },
  }
)
