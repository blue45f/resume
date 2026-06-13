import reactCompiler from 'eslint-plugin-react-compiler';
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'dist-server',
    'node_modules',
    'coverage',
    '**/*.d.ts',
    'packages/*/dist',
    'packages/*/dist-server',
    'packages/*/node_modules',
    'packages/*/coverage',
    'public/**',
    'packages/client/public/**',
    'packages/client/storybook-static/**',
    'packages/server/prisma/migrations/**',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // 네이티브 window.confirm/alert/prompt 금지 — 브랜드 useConfirm()/toast()/usePrompt()를 쓴다.
      // (useConfirm()/usePrompt() 같은 로컬 변수는 섀도잉이라 영향 없음)
      'no-restricted-globals': [
        'error',
        { name: 'confirm', message: 'useConfirm()/ConfirmDialog를 사용하세요 (window.confirm 금지).' },
        { name: 'alert', message: 'toast()를 사용하세요 (window.alert 금지).' },
        { name: 'prompt', message: 'usePrompt()/PromptProvider를 사용하세요 (window.prompt 금지).' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-unused-expressions': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/set-state-in-effect': 'error',
      'react-hooks/purity': 'error',
      'react-hooks/static-components': 'error',
      'react-hooks/preserve-manual-memoization': 'error',
      'react-hooks/immutability': 'error',
      'react-hooks/refs': 'error',
      'react-refresh/only-export-components': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-useless-escape': 'error',
    },
  },
],
  {
    files: ['packages/client/**/*.{ts,tsx}'],
    plugins: {
      'react-compiler': reactCompiler
    },
    rules: {
      'react-compiler/react-compiler': 'error'
    }
  }
)
