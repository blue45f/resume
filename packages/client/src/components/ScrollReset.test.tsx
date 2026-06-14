import { render } from '@testing-library/react'
import { useEffect } from 'react'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { describe, expect, it, beforeEach, vi } from 'vitest'

import ScrollReset from './ScrollReset'

/**
 * a11y smoke: 라우트 전환 시 포커스 관리.
 *
 * SPA 에서 페이지가 바뀌어도 키보드/스크린리더 포커스가 이전 요소에 남는 문제를
 * ScrollReset 이 본문 랜드마크(#main-content)로 포커스를 옮겨 해결한다.
 * "본문으로 건너뛰기" 스킵 링크와 동일한 진입점을 보장한다.
 */

/** 테스트용: 마운트 직후 한 번 navigate 를 호출하는 트리거. */
function NavigateOnMount({ to }: { to: string }) {
  const navigate = useNavigate()
  useEffect(() => {
    navigate(to)
  }, [navigate, to])
  return null
}

function Layout() {
  return (
    <>
      <ScrollReset />
      {/* 실제 페이지들과 동일한 본문 랜드마크 */}
      <main id="main-content">본문</main>
    </>
  )
}

describe('ScrollReset (route-change focus management)', () => {
  beforeEach(() => {
    // jsdom 은 scrollTo 가 없으므로 폴리필.
    window.scrollTo = vi.fn()
    document.body.innerHTML = ''
  })

  it('초기 마운트에서는 포커스를 가로채지 않는다', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Layout />} />
        </Routes>
      </MemoryRouter>
    )
    // 첫 로드에서는 본문이 포커스를 강제로 받지 않아야 한다.
    const main = document.getElementById('main-content')
    expect(document.activeElement).not.toBe(main)
  })

  it('라우트 전환 후 #main-content 로 포커스를 옮긴다', async () => {
    render(
      <MemoryRouter initialEntries={['/start']}>
        <Routes>
          <Route
            path="/start"
            element={
              <>
                <Layout />
                <NavigateOnMount to="/next" />
              </>
            }
          />
          <Route path="/next" element={<Layout />} />
        </Routes>
      </MemoryRouter>
    )

    // 전환 후 effect 가 처리될 때까지 대기.
    await vi.waitFor(() => {
      const main = document.getElementById('main-content')
      expect(main).not.toBeNull()
      expect(document.activeElement).toBe(main)
    })
  })

  it('포커스 타깃에 tabindex=-1 을 부여해 프로그램적 포커스만 받게 한다', async () => {
    render(
      <MemoryRouter initialEntries={['/start']}>
        <Routes>
          <Route
            path="/start"
            element={
              <>
                <Layout />
                <NavigateOnMount to="/next" />
              </>
            }
          />
          <Route path="/next" element={<Layout />} />
        </Routes>
      </MemoryRouter>
    )

    await vi.waitFor(() => {
      const main = document.getElementById('main-content')
      expect(main?.getAttribute('tabindex')).toBe('-1')
    })
  })

  it('라우트 전환마다 스크롤을 최상단으로 재설정한다', async () => {
    render(
      <MemoryRouter initialEntries={['/start']}>
        <Routes>
          <Route
            path="/start"
            element={
              <>
                <Layout />
                <NavigateOnMount to="/next" />
              </>
            }
          />
          <Route path="/next" element={<Layout />} />
        </Routes>
      </MemoryRouter>
    )

    await vi.waitFor(() => {
      expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
    })
  })
})
