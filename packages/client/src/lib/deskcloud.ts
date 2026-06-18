/**
 * DeskCloud — 네이티브 SDK 클라이언트 팩토리 (브라우저 전용 · publishable `pk_` 키).
 * ──────────────────────────────────────────────────────────────────────────
 * 이 앱은 DeskCloud 의 범용 기능(피드백/새 소식/검색/알림)을 위젯 임베드가 아니라
 * 공식 npm SDK(`@heejun/deskcloud`)의 타입드 브라우저 클라이언트로 연동한다.
 * 데이터는 이 앱의 자체 컴포넌트·디자인 토큰으로 렌더한다(네이티브 룩앤필).
 *
 * 보안: 여기서는 오직 publishable(`pk_…`) 키만 사용한다. 절대
 * `@heejun/deskcloud/server`(sk_ 서버 전용)를 import 하지 않는다 — 클라 번들 금지.
 *
 * 게이팅: 각 Desk 는 `VITE_<DESK>DESK_URL` 이 설정됐을 때만 활성. 미설정이면
 * 클라이언트는 `null` 이고 호출부는 앱의 기존 1st-party 기능으로 폴백한다(가역적).
 * pk 는 `VITE_<DESK>DESK_PK` 에서 읽고, 미지정 시 `pk_demo`.
 */
import {
  createChangelogClient,
  createNotifyClient,
  createReviewClient,
  createSearchClient,
  createSurveyClient,
  type ChangelogClient,
  type NotifyClient,
  type ReviewClient,
  type SearchClient,
  type SurveyClient,
} from '@heejun/deskcloud'

const PK_DEMO = 'pk_demo'

/** 빈 문자열("")/undefined 를 모두 "미설정" 으로 본다. */
function envUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

const SURVEY_URL = envUrl(import.meta.env.VITE_SURVEYDESK_URL)
const SURVEY_PK = import.meta.env.VITE_SURVEYDESK_PK ?? PK_DEMO
const CHANGELOG_URL = envUrl(import.meta.env.VITE_CHANGELOGDESK_URL)
const CHANGELOG_PK = import.meta.env.VITE_CHANGELOGDESK_PK ?? PK_DEMO
const NOTIFY_URL = envUrl(import.meta.env.VITE_NOTIFYDESK_URL)
const NOTIFY_PK = import.meta.env.VITE_NOTIFYDESK_PK ?? PK_DEMO
const SEARCH_URL = envUrl(import.meta.env.VITE_SEARCHDESK_URL)
const SEARCH_PK = import.meta.env.VITE_SEARCHDESK_PK ?? PK_DEMO
const REVIEW_URL = envUrl(import.meta.env.VITE_REVIEWDESK_URL)
const REVIEW_PK = import.meta.env.VITE_REVIEWDESK_PK ?? PK_DEMO

/** 각 Desk 활성 여부 — 호출부 게이팅용(렌더 분기). */
export const deskcloud = {
  surveyEnabled: Boolean(SURVEY_URL),
  changelogEnabled: Boolean(CHANGELOG_URL),
  notifyEnabled: Boolean(NOTIFY_URL),
  searchEnabled: Boolean(SEARCH_URL),
  reviewEnabled: Boolean(REVIEW_URL),
} as const

/** SurveyDesk — 피드백/설문 제출(공개). 미설정이면 null. */
export const surveyClient: SurveyClient | null = SURVEY_URL
  ? createSurveyClient({ endpoint: SURVEY_URL, publishableKey: SURVEY_PK })
  : null

/** ChangelogDesk — 게시된 "새 소식" 읽기. 미설정이면 null. */
export const changelogClient: ChangelogClient | null = CHANGELOG_URL
  ? createChangelogClient({ endpoint: CHANGELOG_URL, publishableKey: CHANGELOG_PK })
  : null

/** NotifyDesk — 수신자 인박스 읽기 + 읽음 처리. 미설정이면 null. */
export const notifyClient: NotifyClient | null = NOTIFY_URL
  ? createNotifyClient({ endpoint: NOTIFY_URL, publishableKey: NOTIFY_PK })
  : null

/** SearchDesk — 전역 검색 질의. 미설정이면 null. */
export const searchClient: SearchClient | null = SEARCH_URL
  ? createSearchClient({ endpoint: SEARCH_URL, publishableKey: SEARCH_PK })
  : null

/** ReviewDesk — 후기/평점 읽기·제출. 미설정이면 null(현재 폴백 없음 → 게이트 시 미표시). */
export const reviewClient: ReviewClient | null = REVIEW_URL
  ? createReviewClient({ endpoint: REVIEW_URL, publishableKey: REVIEW_PK })
  : null

/** 이 앱의 SurveyDesk appId — 활성 설문 조회/응답 제출 키. */
export const SURVEY_APP_ID = 'resume'

/**
 * 익명 디바이스 id — ChangelogDesk 의 unread 뱃지/seen 기록용.
 * 로그인 없이도 "새 소식 읽음" 상태를 유지하기 위한 안정적 키.
 */
const ANON_KEY = 'deskcloud:anonId'
let anonMemory: string | null = null
export function getAnonId(): string {
  if (typeof localStorage !== 'undefined') {
    try {
      const existing = localStorage.getItem(ANON_KEY)
      if (existing) return existing
      const created = crypto.randomUUID()
      localStorage.setItem(ANON_KEY, created)
      return created
    } catch {
      /* 스토리지 차단 → 메모리 폴백 */
    }
  }
  if (!anonMemory) anonMemory = crypto.randomUUID()
  return anonMemory
}
