/**
 * ChangelogMenu — "새 소식" 네이티브 메뉴 (DeskCloud ChangelogDesk, SDK 연동).
 * ──────────────────────────────────────────────────────────────────────────
 * 위젯 임베드(플로팅 런처) 대신, 이 앱의 Radix Popover + Tailwind 디자인 토큰으로
 * 렌더하는 헤더 메뉴. 데이터는 공식 SDK 의 `changelogClient.getWall()` 로 읽고,
 * unread 뱃지는 `getUnreadCount({ anonId })`, 열람 시 `markSeen` 으로 기록한다.
 *
 * 게이팅: ChangelogDesk 미설정(VITE_CHANGELOGDESK_URL 없음)이면 `changelogClient`
 * 가 null 이고 이 컴포넌트는 아무것도 렌더하지 않는다(가역적).
 */
import { useCallback, useEffect, useState, type ReactElement } from 'react'

import type { ChangelogEntry, ChangelogEntryTag } from '@heejun/deskcloud'

import SafeHtml from '@/components/SafeHtml'
import { changelogClient, getAnonId } from '@/lib/deskcloud'
import { timeAgo } from '@/lib/time'
import Popover from '@/shared/ui/Popover'

/** 태그별 라벨 + 상태색(Impeccable: blue/cyan/emerald/amber/rose — purple 금지). */
const TAG_META: Record<ChangelogEntryTag, { label: string; cls: string }> = {
  new: { label: '신규', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  improved: {
    label: '개선',
    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  fixed: {
    label: '수정',
    cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
  announcement: {
    label: '공지',
    cls: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  },
}

type Phase = 'idle' | 'loading' | 'ready' | 'error'

export default function ChangelogMenu(): ReactElement | null {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [entries, setEntries] = useState<ChangelogEntry[]>([])
  const [unread, setUnread] = useState(0)
  const [latestId, setLatestId] = useState<string | null>(null)

  // 마운트 시 unread 뱃지 한 번 조회(읽지 않은 게시 수).
  useEffect(() => {
    if (!changelogClient) return
    const ctrl = new AbortController()
    changelogClient
      .getUnreadCount({ anonId: getAnonId(), signal: ctrl.signal })
      .then((res) => {
        setUnread(res.unreadCount)
        setLatestId(res.latestEntryId)
      })
      .catch(() => {
        /* 뱃지 실패는 조용히 무시 — 메뉴 자체는 동작 */
      })
    return () => ctrl.abort()
  }, [])

  const loadWall = useCallback(() => {
    if (!changelogClient) return
    setPhase('loading')
    const ctrl = new AbortController()
    changelogClient
      .getWall({ limit: 20, signal: ctrl.signal })
      .then((wall) => {
        setEntries(wall.items)
        setPhase('ready')
      })
      .catch(() => setPhase('error'))
  }, [])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next)
      if (!next) return
      loadWall()
      // 열람 시 모든 게시를 읽음 처리하고 뱃지를 비운다.
      if (changelogClient && unread > 0) {
        const input = latestId
          ? { anonId: getAnonId(), lastSeenEntryId: latestId }
          : { anonId: getAnonId() }
        changelogClient.markSeen(input).catch(() => {})
        setUnread(0)
      }
    },
    [loadWall, unread, latestId]
  )

  if (!changelogClient) return null

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button type="button" className="relative icon-btn-sm" aria-label="새 소식">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
            />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Content align="end" className="w-80 p-0 overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-[var(--color-border-subtle)]">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">새 소식</h3>
          <span className="text-xs text-[var(--color-text-muted)]">제품 업데이트</span>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {phase === 'loading' && (
            <div
              className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]"
              aria-busy="true"
            >
              불러오는 중…
            </div>
          )}
          {phase === 'error' && (
            <div className="px-4 py-8 text-center" role="alert">
              <p className="text-sm font-medium text-[var(--color-text)]">
                소식을 불러오지 못했어요
              </p>
              <button
                type="button"
                onClick={loadWall}
                className="mt-3 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                다시 시도
              </button>
            </div>
          )}
          {phase === 'ready' && entries.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
              아직 등록된 소식이 없어요.
            </p>
          )}
          {phase === 'ready' &&
            entries.map((entry) => {
              const meta = TAG_META[entry.tag] ?? TAG_META.announcement
              return (
                <article
                  key={entry.id}
                  className="px-4 py-3 border-b border-[var(--color-border-subtle)] last:border-b-0"
                >
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${meta.cls}`}
                    >
                      {meta.label}
                    </span>
                    {entry.version && (
                      <span className="text-[11px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-sunken)] px-1.5 py-0.5 rounded">
                        {entry.version}
                      </span>
                    )}
                    {entry.publishedAt && (
                      <span className="ml-auto text-[11px] text-[var(--color-text-muted)]">
                        {timeAgo(entry.publishedAt)}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-[var(--color-text)] text-pretty">
                    {entry.title}
                  </h4>
                  <SafeHtml
                    html={entry.bodyHtml}
                    className="changelog-body mt-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)]"
                  />
                </article>
              )
            })}
        </div>
      </Popover.Content>
    </Popover.Root>
  )
}
