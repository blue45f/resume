import { useEffect, useId, useRef, useState, type FormEvent } from 'react'

import { useAuth } from './useAuth'

import Dialog from '@/shared/ui/Dialog'

type Mode = 'signin' | 'signup'

const COPY: Record<Mode, { title: string; desc: string; submit: string; toggle: string }> = {
  signin: {
    title: '회원 로그인',
    desc: '이메일과 비밀번호로 로그인하세요. 계정이 없다면 가입하거나 게스트로 시작할 수 있습니다.',
    submit: '로그인',
    toggle: '계정이 없나요? 가입하기',
  },
  signup: {
    title: '회원가입',
    desc: '이메일과 비밀번호로 새 계정을 만드세요. 비밀번호는 6자 이상이어야 합니다.',
    submit: '가입하기',
    toggle: '이미 계정이 있나요? 로그인',
  },
}

/** 입력 공통 클래스 — 앱 폼 표면(LoginPage)과 동일한 토큰/포커스 링. */
const INPUT_CLASS =
  'w-full h-11 px-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-accent)] disabled:opacity-50 disabled:pointer-events-none transition-colors'

/** 로딩 스피너 — lucide 없이 인라인 SVG(앱 아이콘 스타일). */
function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin motion-reduce:animate-none"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

/**
 * Firebase 이메일/비밀번호 + 게스트 로그인 다이얼로그 — 접근성 우선.
 * - 로그인 ⇄ 가입 토글, "게스트로 시작하기"(익명 인증)
 * - 로딩/비활성 상태, aria-live 에러(role="alert")
 * - 포커스: 앱 Dialog(Radix)가 트랩, 열릴 때 이메일 입력에 초기 포커스
 *
 * 앱의 공유 Dialog 프리미티브 + 디자인 토큰(--color-*)에만 의존한다 — 통합 로그인
 * 모듈의 useAuth API/한국어 에러 매핑은 다른 형제 앱과 동일하게 유지하고, UI 만
 * 이 앱 디자인 시스템에 맞춰 벤더링했다.
 */
export function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { signIn, signUp, signInAsGuest, error, clearError, user } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState<'form' | 'guest' | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  const emailId = useId()
  const passwordId = useId()
  const errorId = useId()

  // 로그인 성공 시 자동으로 닫힌다(prop 콜백 호출 — setState 아님).
  useEffect(() => {
    if (open && user) onOpenChange(false)
  }, [open, user, onOpenChange])

  // 열릴 때 이메일 입력에 초기 포커스(앱 Dialog 는 onOpenAutoFocus 훅을 노출하지 않으므로
  // open 전이에서 직접 포커스한다 — Radix 가 포커스 트랩을 유지).
  useEffect(() => {
    if (!open) return
    const id = globalThis.setTimeout(() => emailRef.current?.focus(), 0)
    return () => globalThis.clearTimeout(id)
  }, [open])

  /**
   * 닫힘 전이를 가로채 폼/에러를 초기화한다 — 다음 열림이 항상 깨끗한 상태로 시작.
   */
  function handleOpenChange(next: boolean) {
    if (!next) {
      setMode('signin')
      setBusy(null)
      setEmail('')
      setPassword('')
      clearError()
    }
    onOpenChange(next)
  }

  function switchMode() {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
    clearError()
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy('form')
    try {
      if (mode === 'signup') await signUp(email, password)
      else await signIn(email, password)
    } catch {
      // 에러는 컨텍스트 state(error)로 노출 — 여기선 무시.
    } finally {
      setBusy(null)
    }
  }

  async function onGuest() {
    if (busy) return
    setBusy('guest')
    try {
      await signInAsGuest()
    } catch {
      // 위와 동일.
    } finally {
      setBusy(null)
    }
  }

  const copy = COPY[mode]
  const formBusy = busy === 'form'
  const guestBusy = busy === 'guest'
  const anyBusy = busy !== null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} title={copy.title} maxWidth="max-w-sm">
      <p className="-mt-3 mb-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        {copy.desc}
      </p>

      <form onSubmit={onSubmit} className="space-y-3.5">
        <div className="space-y-1.5">
          <label htmlFor={emailId} className="block text-sm font-medium text-[var(--color-text)]">
            이메일
          </label>
          <input
            ref={emailRef}
            id={emailId}
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? true : undefined}
            required
            disabled={anyBusy}
            className={INPUT_CLASS}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={passwordId}
            className="block text-sm font-medium text-[var(--color-text)]"
          >
            비밀번호
          </label>
          <input
            id={passwordId}
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={6}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? true : undefined}
            required
            disabled={anyBusy}
            className={INPUT_CLASS}
          />
        </div>

        {/* 에러는 항상 같은 노드에 두어 aria-live 가 안정적으로 announce 한다. */}
        <div aria-live="assertive">
          {error ? (
            <p
              id={errorId}
              role="alert"
              className="rounded-xl border border-[var(--color-error)]/40 bg-[var(--color-error-light)] px-3.5 py-2.5 text-[0.8125rem] leading-snug text-[var(--color-error)]"
            >
              {error}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:pointer-events-none disabled:opacity-50"
          disabled={anyBusy || !email || !password}
          aria-busy={formBusy || undefined}
        >
          {formBusy ? <Spinner /> : null}
          {copy.submit}
        </button>
      </form>

      <button
        type="button"
        onClick={switchMode}
        disabled={anyBusy}
        className="mt-2.5 w-full text-center text-[0.8125rem] font-medium text-[var(--color-accent)] transition-colors hover:underline disabled:pointer-events-none disabled:opacity-50"
      >
        {copy.toggle}
      </button>

      <div className="my-3 flex items-center gap-3 text-[var(--color-text-muted)]">
        <span className="h-px flex-1 bg-[var(--color-border-subtle)]" aria-hidden="true" />
        <span className="text-xs">또는</span>
        <span className="h-px flex-1 bg-[var(--color-border-subtle)]" aria-hidden="true" />
      </div>

      <button
        type="button"
        onClick={onGuest}
        disabled={anyBusy}
        aria-busy={guestBusy || undefined}
        className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-medium text-[var(--color-text)] shadow-sm transition-colors hover:bg-[var(--color-surface-sunken)] hover:border-[var(--color-text-muted)] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:pointer-events-none disabled:opacity-50"
      >
        {guestBusy ? <Spinner /> : null}
        게스트로 시작하기
      </button>
    </Dialog>
  )
}
