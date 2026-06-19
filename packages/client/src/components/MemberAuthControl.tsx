import { useState } from 'react'

import { AuthDialog, useAuth } from '@/lib/firebaseAuth'
import { cn } from '@/shared/lib/cn'

/**
 * 헤더 회원 로그인 진입점 — Firebase Auth(이메일/비밀번호 + 게스트) 기반.
 *
 * 이 컨트롤은 기존 백엔드 JWT 로그인(이메일·Google GIS·GitHub·Kakao → /login)과 **별개**의
 * 추가 옵션이다. 기존 로그인은 그대로 두고, 통합 Firebase 회원 로그인을 헤더에 추가로 노출한다.
 * 로그아웃 상태면 "회원" 버튼으로 AuthDialog 를 열고, 로그인 상태면 이메일(또는 "게스트")과
 * 로그아웃을 보여준다.
 */

/** 로그인 아이콘(인라인 SVG — lucide 미사용, 앱 헤더 아이콘 스타일). */
function LoginIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  )
}

/** 사용자 아이콘. */
function UserIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

/** 로그아웃 아이콘. */
function LogoutIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export function MemberAuthControl({ className }: { className?: string }) {
  const { user, loading, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  if (loading) {
    // 초기 onAuthStateChanged 해석 전 — 레이아웃 점프 방지용 플레이스홀더.
    return (
      <div
        className={cn(
          'h-7 w-16 animate-pulse rounded-lg bg-[var(--color-surface-sunken)] motion-reduce:animate-none',
          className
        )}
        aria-hidden="true"
      />
    )
  }

  if (!user) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 lg:px-2.5 py-1.5 text-xs lg:text-sm font-medium text-[var(--color-text-secondary)] whitespace-nowrap transition-colors hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1"
        >
          <LoginIcon />
          <span className="hidden sm:inline">회원</span>
        </button>
        <AuthDialog open={open} onOpenChange={setOpen} />
      </div>
    )
  }

  const label = user.isAnonymous ? '게스트' : (user.email ?? '회원')

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span
        className="hidden max-w-[10rem] items-center gap-1.5 truncate rounded-lg bg-[var(--color-surface-sunken)] px-2.5 py-1 text-[0.8125rem] text-[var(--color-text-secondary)] sm:inline-flex"
        title={label}
      >
        <UserIcon />
        <span className="truncate">{label}</span>
      </span>
      <button
        type="button"
        onClick={() => void signOut()}
        aria-label={`${label} 로그아웃`}
        title="로그아웃"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1"
      >
        <LogoutIcon />
      </button>
    </div>
  )
}
