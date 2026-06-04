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
      // 네이티브 window.confirm 금지 — 브랜드 useConfirm()/ConfirmDialog를 쓴다.
      // (useConfirm() 같은 로컬 confirm 변수는 섀도잉이라 영향 없음)
      // alert/prompt는 toast/입력 다이얼로그 마이그레이션 후 추가 예정.
      'no-restricted-globals': [
        'error',
        { name: 'confirm', message: 'useConfirm()/ConfirmDialog를 사용하세요 (window.confirm 금지).' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
      'react-refresh/only-export-components': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-useless-escape': 'warn',
    },
  },
])
