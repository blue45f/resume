import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * SPA 라우트 전환 시 스크롤 + 포커스를 재설정한다.
 *
 * 접근성: 클라이언트 라우팅에서는 페이지가 바뀌어도 키보드/스크린리더 포커스가
 * 이전 요소(예: 방금 누른 링크)에 남아 있어, 새 페이지를 Tab 으로 처음부터 다시
 * 훑어야 한다. 라우트가 바뀌면 본문 랜드마크(`#main-content`)로 포커스를 옮겨
 * "본문으로 건너뛰기" 스킵 링크와 동일한 시작점을 제공한다.
 *
 * - `#main-content` 는 인터랙티브 요소가 아니므로 `tabIndex=-1` 을 임시 부여해
 *   프로그램적 포커스만 받게 한다(시각적 포커스 링은 전역 CSS 의 `[tabindex="-1"]`
 *   규칙으로 억제). 스킵 링크 클릭 시에도 동일 경로로 포커스가 본문에 들어간다.
 * - 최초 마운트(첫 페이지 로드)에서는 포커스를 가로채지 않는다 — 사용자가 아직
 *   아무것도 조작하지 않았는데 포커스를 강제 이동하면 오히려 방해가 된다.
 */
export default function ScrollReset() {
  const { pathname } = useLocation()
  const isFirstRender = useRef(true)

  useEffect(() => {
    window.scrollTo(0, 0)

    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // 라우트 전환 후 본문 랜드마크로 포커스 이동(스킵 링크와 동일 시작점).
    const main = document.getElementById('main-content')
    if (!main) return

    if (!main.hasAttribute('tabindex')) {
      main.setAttribute('tabindex', '-1')
    }
    // preventScroll: 위에서 이미 최상단으로 스크롤했으므로 포커스가 다시 스크롤하지 않게.
    main.focus({ preventScroll: true })
  }, [pathname])

  return null
}
