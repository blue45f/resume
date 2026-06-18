/**
 * DeskCloudMounts — DeskCloud 위젯들을 앱 셸에 한 번만 마운트하는 통합 진입점.
 * ──────────────────────────────────────────────────────────────────────────
 * 각 위젯은 해당 desk 의 환경변수(VITE_*_URL)가 설정됐을 때만 렌더됩니다(env-gated).
 * URL 미설정 = 위젯 비활성(아무것도 렌더 안 함). 기존 앱 기능과 충돌하지 않도록
 * 모두 자체 스코프 스타일 + 플로팅/헤더리스 위젯으로 동작합니다.
 *
 *  - ChangelogWidget (changelogdesk): 플로팅 "새 소식" 런처(우하단).
 *  - SearchPalette   (searchdesk):    ⌘K 커맨드 팔레트(전역 단축키).
 *  - NotificationBell (notifydesk):   로그인 사용자 한정 플로팅 알림 벨(우상단).
 *
 * SurveyDesk 의 FeedbackWidget 과 동일하게 import.meta.env 기반으로 게이팅합니다.
 *
 * 충돌 방지(이 앱 한정):
 *  - SearchDesk 가 설정되면 자체 CommandPalette 는 ⌘K 등록을 양보하고(CommandPalette.tsx),
 *    SearchDesk 결과 선택은 SPA 라우터로 내비게이션해서 전체 새로고침을 피합니다.
 *  - NotifyDesk 가 설정되면 헤더의 자체 NotificationBell 은 숨겨 벨 중복을 막습니다(Header.tsx).
 */

import { useCallback, type ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'

import { ChangelogWidget } from './changelogdesk/ChangelogWidget'
import { NotificationBell } from './notifydesk/NotificationBell'
import { SearchPalette, type SearchHit } from './searchdesk/SearchPalette'

import { useAuthStore } from '@/stores'

const PK_DEMO = 'pk_demo'

const CHANGELOG_URL = import.meta.env.VITE_CHANGELOGDESK_URL
const CHANGELOG_PK = import.meta.env.VITE_CHANGELOGDESK_PK ?? PK_DEMO
const NOTIFY_URL = import.meta.env.VITE_NOTIFYDESK_URL
const NOTIFY_PK = import.meta.env.VITE_NOTIFYDESK_PK ?? PK_DEMO
const SEARCH_URL = import.meta.env.VITE_SEARCHDESK_URL
const SEARCH_PK = import.meta.env.VITE_SEARCHDESK_PK ?? PK_DEMO

/** 절대(외부) URL 인지 — 외부면 하드 내비게이션, 내부면 SPA 라우팅. */
function isExternalUrl(url: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(url) || url.startsWith('//')
}

/** SearchDesk 결과 선택 시 SPA 라우터로 이동(내부) — 전체 새로고침 방지. */
function SearchDeskMount(): ReactElement {
  const navigate = useNavigate()
  const onSelect = useCallback(
    (hit: SearchHit) => {
      const url = hit.url
      if (!url) return
      if (isExternalUrl(url)) {
        window.location.assign(url)
        return
      }
      // 같은 오리진의 절대 경로/상대 경로는 라우터로 처리
      try {
        const u = new URL(url, window.location.origin)
        if (u.origin === window.location.origin) {
          navigate(u.pathname + u.search + u.hash)
          return
        }
      } catch {
        /* URL 파싱 실패 시 아래 폴백 */
      }
      navigate(url)
    },
    [navigate]
  )
  return <SearchPalette publishableKey={SEARCH_PK} endpoint={SEARCH_URL} onSelect={onSelect} />
}

/** 로그인 사용자에게만 알림 벨을 띄운다(recipientId = user.id). 미로그인 시 null. */
function NotifyBellMount(): ReactElement | null {
  const userId = useAuthStore((s) => s.user?.id)
  if (!userId) return null
  return (
    <div
      style={{
        position: 'fixed',
        top: 'max(12px, env(safe-area-inset-top))',
        right: 'max(12px, env(safe-area-inset-right))',
        zIndex: 2147483000,
      }}
    >
      <NotificationBell recipientId={userId} publishableKey={NOTIFY_PK} endpoint={NOTIFY_URL} />
    </div>
  )
}

export function DeskCloudMounts(): ReactElement {
  return (
    <>
      {CHANGELOG_URL && <ChangelogWidget publishableKey={CHANGELOG_PK} endpoint={CHANGELOG_URL} />}
      {SEARCH_URL && <SearchDeskMount />}
      {NOTIFY_URL && <NotifyBellMount />}
    </>
  )
}

export default DeskCloudMounts
