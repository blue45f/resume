import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SPA 라우트 전환을 보조기술에 polite 하게 안내한다(WCAG 2.2 SC 4.1.3 Status Messages).
 *
 * 포커스/스크롤 이동은 `ScrollReset` 이 담당하므로 여기서는 announce 만 한다(중복 방지).
 * 각 페이지가 설정한 `document.title` 을 rAF 한 프레임 뒤에 읽어, 새 페이지의 제목을 안내한다.
 * 최초 마운트(첫 로드)에서는 안내하지 않는다 — 사용자가 직접 연 페이지는 알림이 불필요하다.
 */
export default function RouteAnnouncer() {
  const { pathname } = useLocation();
  const [message, setMessage] = useState('');
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const frame = requestAnimationFrame(() => {
      setMessage(`${document.title} 페이지로 이동했습니다`);
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </p>
  );
}
