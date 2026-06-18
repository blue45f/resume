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
 */

import { ChangelogWidget } from './changelogdesk/ChangelogWidget'
import { NotificationBell } from './notifydesk/NotificationBell'
import { SearchPalette } from './searchdesk/SearchPalette'

import type { ReactElement } from 'react'

import { useAuthStore } from '@/stores'

const PK_DEMO = 'pk_demo'

const CHANGELOG_URL = import.meta.env.VITE_CHANGELOGDESK_URL
const CHANGELOG_PK = import.meta.env.VITE_CHANGELOGDESK_PK ?? PK_DEMO
const NOTIFY_URL = import.meta.env.VITE_NOTIFYDESK_URL
const NOTIFY_PK = import.meta.env.VITE_NOTIFYDESK_PK ?? PK_DEMO
const SEARCH_URL = import.meta.env.VITE_SEARCHDESK_URL
const SEARCH_PK = import.meta.env.VITE_SEARCHDESK_PK ?? PK_DEMO

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
      {SEARCH_URL && <SearchPalette publishableKey={SEARCH_PK} endpoint={SEARCH_URL} />}
      {NOTIFY_URL && <NotifyBellMount />}
    </>
  )
}

export default DeskCloudMounts
