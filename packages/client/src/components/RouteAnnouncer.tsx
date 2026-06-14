import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

// 낭독되지 않는 폭 0 공백(U+200B). 동일 안내 문구가 연속될 때도 aria-live 라이브 영역
// 콘텐츠를 변동시켜 재낭독을 보장하기 위한 보이지 않는 토글 문자.
const ZERO_WIDTH_SPACE = String.fromCharCode(0x200b)

/**
 * SPA 라우트 전환을 보조기술에 polite 하게 안내한다(WCAG 2.2 SC 4.1.3 Status Messages).
 *
 * 포커스/스크롤 이동은 `ScrollReset` 이 담당하므로 여기서는 announce 만 한다(중복 방지).
 *
 * 정확성 처리:
 * - lazy 페이지는 Suspense 로딩 후에야 `document.title` 을 갱신하므로, 단일 rAF 로 읽으면
 *   직전 페이지 제목(stale)을 읽을 수 있다. `<title>` 변경을 MutationObserver 로 감지해
 *   실제로 제목이 바뀔 때 안내한다.
 * - 제목을 갱신하지 않는 페이지(일부 라우트)는 stale 한 직전 제목을 읽지 않도록, 폴백 타이머가
 *   일반 문구로 안내한다.
 * - `pathname` 뿐 아니라 `search` 변경(쿼리만 바뀌는 내비)도 키에 포함한다.
 * - 최초 마운트(첫 로드)에서는 안내하지 않는다.
 */
export default function RouteAnnouncer() {
  const { pathname, search } = useLocation()
  const [message, setMessage] = useState('')
  const isFirstRender = useRef(true)
  const announceCountRef = useRef(0)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const titleEl = document.querySelector('title')
    const previousTitle = document.title
    let announced = false

    const announce = (text: string) => {
      if (announced) return
      announced = true
      announceCountRef.current += 1
      // 연속 안내가 동일 문구여도 라이브 영역 콘텐츠가 매번 바뀌도록 ZWSP 를 0/1 개 토글한다.
      const nonce = announceCountRef.current % 2 === 0 ? '' : ZERO_WIDTH_SPACE
      setMessage(text + nonce)
    }

    // 새 페이지가 document.title 을 갱신하면 그 시점에 정확한 제목으로 안내한다.
    const handleTitleChange = () => {
      if (document.title && document.title !== previousTitle) {
        announce(`${document.title} 페이지로 이동했습니다`)
      }
    }

    const observer = titleEl ? new MutationObserver(handleTitleChange) : null
    observer?.observe(titleEl as Node, { childList: true, characterData: true, subtree: true })

    // 제목을 갱신하지 않는 페이지를 위한 폴백 — stale 제목 대신 일반 문구로 안내한다.
    const timer = window.setTimeout(() => announce('새 페이지로 이동했습니다'), 800)

    return () => {
      observer?.disconnect()
      window.clearTimeout(timer)
    }
  }, [pathname, search])

  return (
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </p>
  )
}
