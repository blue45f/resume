import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { applyTheme, getTheme, setTheme } from './theme'

const THEME_KEY = 'resume-theme'

/**
 * lib/theme.ts 계약 테스트.
 *
 * 이 계약(.dark 클래스 토글 + localStorage['resume-theme'] + system→prefers-color-scheme)은
 * index.html 의 No-FOUC 인라인 부트스트랩 스크립트가 페인트 이전에 동일하게 재현한다.
 * 둘이 어긋나면 다크 사용자가 흰 화면 깜빡임을 겪으므로, 여기서 계약을 고정한다.
 */

/** jsdom 에는 matchMedia 가 없다 — prefers-color-scheme: dark 매칭 여부를 주입한다. */
function stubPrefersDark(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('dark') ? matches : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  )
}

const isDarkClassSet = () => document.documentElement.classList.contains('dark')

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getTheme', () => {
  it('defaults to "system" when nothing is stored', () => {
    expect(getTheme()).toBe('system')
  })

  it('reads the persisted value from localStorage', () => {
    localStorage.setItem(THEME_KEY, 'dark')
    expect(getTheme()).toBe('dark')
  })
})

describe('applyTheme', () => {
  it('adds the .dark class for the explicit "dark" theme', () => {
    stubPrefersDark(false)
    applyTheme('dark')
    expect(isDarkClassSet()).toBe(true)
  })

  it('removes the .dark class for the explicit "light" theme even when the OS prefers dark', () => {
    stubPrefersDark(true)
    applyTheme('light')
    expect(isDarkClassSet()).toBe(false)
  })

  it('follows prefers-color-scheme for the "system" theme (dark OS → dark)', () => {
    stubPrefersDark(true)
    applyTheme('system')
    expect(isDarkClassSet()).toBe(true)
  })

  it('follows prefers-color-scheme for the "system" theme (light OS → light)', () => {
    stubPrefersDark(false)
    applyTheme('system')
    expect(isDarkClassSet()).toBe(false)
  })
})

describe('setTheme', () => {
  it('persists the choice and applies it in one step', () => {
    stubPrefersDark(false)
    setTheme('dark')
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
    expect(isDarkClassSet()).toBe(true)
  })
})

describe('No-FOUC inline-script parity', () => {
  // index.html 의 인라인 스크립트와 동일한 판정식(stored==='dark' || (system/없음 && prefersDark)).
  // 런타임 applyTheme 결과와 1:1 로 일치해야 한다.
  const inlineDecision = (stored: string | null, prefersDark: boolean) =>
    stored === 'dark' ||
    ((stored === 'system' || stored === null || stored === undefined) && prefersDark)

  const cases: Array<[string | null, boolean]> = [
    ['dark', false],
    ['dark', true],
    ['light', false],
    ['light', true],
    ['system', false],
    ['system', true],
    [null, false],
    [null, true],
  ]

  it.each(cases)('stored=%s prefersDark=%s → inline matches runtime', (stored, prefersDark) => {
    stubPrefersDark(prefersDark)
    if (stored === null) {
      localStorage.removeItem(THEME_KEY)
    } else {
      localStorage.setItem(THEME_KEY, stored)
    }
    applyTheme(getTheme())
    expect(isDarkClassSet()).toBe(inlineDecision(stored, prefersDark))
  })
})
