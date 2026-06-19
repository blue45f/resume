import { useEffect, useId, useRef, useState } from 'react'

import type { FormEvent } from 'react'

import Footer from '@/components/Footer'
import Header from '@/components/Header'
import {
  INQUIRY_CATEGORIES,
  INQUIRY_CATEGORY_HINTS,
  INQUIRY_CATEGORY_LABELS,
  INQUIRY_STATUS_LABELS,
  listInquiries,
  submitInquiry,
  type Inquiry,
  type InquiryCategory,
  type InquiryStatus,
} from '@/lib/inquiryApi'
import { timeAgo } from '@/lib/time'

const TITLE_MAX = 120
const BODY_MAX = 4000
const NAME_MAX = 80

const inputClass =
  'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none'

/** 상태 뱃지 톤 — 진행도에 따라 상태색을 매핑한다(purple 금지). */
const STATUS_TONE: Record<InquiryStatus, string> = {
  new: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  closed: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
}

function StatusBadge({ status }: { status: InquiryStatus }) {
  const label = INQUIRY_STATUS_LABELS[status] ?? status
  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${STATUS_TONE[status] ?? STATUS_TONE.closed}`}
    >
      {label}
    </span>
  )
}

function InquiryCard({ inquiry }: { inquiry: Inquiry }) {
  return (
    <article className="card-hover imp-card p-4">
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          {INQUIRY_CATEGORY_LABELS[inquiry.category] ?? inquiry.category}
        </span>
        <StatusBadge status={inquiry.status} />
        <span className="ml-auto text-[11px] text-slate-500 dark:text-slate-400">
          {timeAgo(inquiry.createdAt)}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
        {inquiry.title}
      </h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 whitespace-pre-wrap">
        {inquiry.body}
      </p>
      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
        {inquiry.authorName?.trim() || '익명'}
      </p>
    </article>
  )
}

type BoardState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; items: Inquiry[] }

function InquiryBoard({ reloadKey }: { reloadKey: number }) {
  const [state, setState] = useState<BoardState>({ phase: 'loading' })
  const [manualKey, setManualKey] = useState(0)

  // 목록 조회. set-state는 모두 비동기 콜백/abort 가드 안에서만 한다.
  useEffect(() => {
    const controller = new AbortController()
    setState({ phase: 'loading' })
    listInquiries(20, 0, controller.signal)
      .then((list) => {
        if (controller.signal.aborted) return
        setState({ phase: 'ready', items: list.items })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setState({
          phase: 'error',
          message: cause instanceof Error ? cause.message : '문의 목록을 불러오지 못했습니다.',
        })
      })
    return () => controller.abort()
  }, [reloadKey, manualKey])

  const loading = state.phase === 'loading'
  const reload = () => setManualKey((value) => value + 1)

  return (
    <section className="space-y-4" aria-labelledby="support-board-heading">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="support-board-heading"
          className="text-sm font-semibold text-slate-900 dark:text-slate-100"
        >
          최근 문의
        </h2>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          새로고침
        </button>
      </div>

      <div aria-live="polite" aria-busy={loading}>
        {state.phase === 'loading' ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((key) => (
              <li
                key={key}
                className="h-32 animate-pulse rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
              />
            ))}
          </ul>
        ) : state.phase === 'error' ? (
          <div className="imp-card p-5 border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">{state.message}</p>
            <button
              type="button"
              onClick={reload}
              className="mt-3 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : state.items.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-slate-500 dark:text-slate-400 mb-2">아직 등록된 문의가 없습니다</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              첫 문의를 남겨 주세요. 등록된 문의는 이 게시판에 공개로 표시됩니다.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {state.items.map((inquiry) => (
              <li key={inquiry.id}>
                <InquiryCard inquiry={inquiry} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default function SupportPage() {
  const fieldId = useId()
  const [category, setCategory] = useState<InquiryCategory>('usage')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [website, setWebsite] = useState('') // 허니팟 — 사람은 채우지 않는다.
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  // 새 문의를 등록하면 게시판을 다시 불러오기 위한 키.
  const [boardKey, setBoardKey] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // 라우트 진입 시 페이지 제목으로 포커스를 옮긴다(스크린리더 컨텍스트 + 키보드 시작점).
  useEffect(() => {
    document.title = '문의 — 이력서공방'
    headingRef.current?.focus()
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'
    }
  }, [])

  const validate = (): string | null => {
    if (!title.trim()) return '제목을 입력해 주세요.'
    if (title.trim().length > TITLE_MAX) return `제목은 ${TITLE_MAX}자 이하로 입력해 주세요.`
    if (!body.trim()) return '내용을 입력해 주세요.'
    if (body.trim().length > BODY_MAX) return `내용은 ${BODY_MAX}자 이하로 입력해 주세요.`
    if (authorName.trim().length > NAME_MAX) return `이름은 ${NAME_MAX}자 이하로 입력해 주세요.`
    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      return '올바른 이메일 형식을 입력해 주세요.'
    }
    return null
  }

  const resetForm = () => {
    setTitle('')
    setBody('')
    setAuthorName('')
    setContactEmail('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitted(false)

    // 허니팟이 채워졌으면 봇으로 간주하고 조용히 성공 처리한다(전송 안 함).
    if (website.trim()) {
      setSubmitted(true)
      resetForm()
      return
    }

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    try {
      await submitInquiry({
        category,
        title: title.trim(),
        body: body.trim(),
        authorName: authorName.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
      })
      setSubmitted(true)
      resetForm()
      setBoardKey((value) => value + 1)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '문의 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        <div className="space-y-6">
          <header>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              문의 · /support
            </p>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="heading-accent text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 outline-none"
            >
              무엇을 도와드릴까요?
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
              제휴·버그·의견·이용 문의를 남겨 주세요. 접수된 문의는 아래 게시판에 공개로 표시되며,
              운영자가 확인 후 상태를 업데이트합니다. 전화·이메일 대신 이 게시판으로 문의를
              통합했습니다.
            </p>
          </header>

          {/* 문의 작성 폼 */}
          {submitted ? (
            <div
              role="status"
              className="imp-card p-4 sm:p-5 border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20"
            >
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                문의가 접수되었습니다.
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                아래 게시판에서 등록된 문의를 확인할 수 있습니다. 운영자가 확인 후 상태를
                업데이트합니다.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-3 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                문의 더 남기기
              </button>
            </div>
          ) : (
            <form className="imp-card p-4 sm:p-6 space-y-5" onSubmit={handleSubmit} noValidate>
              <fieldset>
                <legend className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  카테고리
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {INQUIRY_CATEGORIES.map((value) => {
                    const selected = value === category
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={selected}
                        title={INQUIRY_CATEGORY_HINTS[value]}
                        onClick={() => setCategory(value)}
                        className={
                          selected
                            ? 'px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white'
                            : 'px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors'
                        }
                      >
                        {INQUIRY_CATEGORY_LABELS[value]}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {INQUIRY_CATEGORY_HINTS[category]}
                </p>
              </fieldset>

              <div>
                <label
                  htmlFor={`${fieldId}-title`}
                  className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5"
                >
                  <span>제목</span>
                  <span className="font-normal tabular-nums">
                    {title.length}/{TITLE_MAX}
                  </span>
                </label>
                <input
                  id={`${fieldId}-title`}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={TITLE_MAX}
                  required
                  placeholder="문의 제목을 한 줄로 적어 주세요"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor={`${fieldId}-body`}
                  className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5"
                >
                  <span>내용</span>
                  <span className="font-normal tabular-nums">
                    {body.length}/{BODY_MAX}
                  </span>
                </label>
                <textarea
                  id={`${fieldId}-body`}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  maxLength={BODY_MAX}
                  required
                  rows={6}
                  placeholder="문의 내용을 자세히 적어 주세요. 버그 신고라면 재현 방법과 환경을 함께 알려 주시면 빠르게 확인할 수 있습니다."
                  className={`${inputClass} resize-y leading-6`}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`${fieldId}-name`}
                    className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5"
                  >
                    이름 <span className="font-normal">(선택)</span>
                  </label>
                  <input
                    id={`${fieldId}-name`}
                    value={authorName}
                    onChange={(event) => setAuthorName(event.target.value)}
                    maxLength={NAME_MAX}
                    autoComplete="name"
                    placeholder="게시판에 표시될 이름"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`${fieldId}-email`}
                    className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5"
                  >
                    이메일 <span className="font-normal">(선택)</span>
                  </label>
                  <input
                    id={`${fieldId}-email`}
                    type="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="답변 받을 이메일 (비공개)"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* 허니팟: 스크린리더·일반 사용자에게 숨김. 봇이 채우면 무음 처리. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor={`${fieldId}-website`}>웹사이트(입력하지 마세요)</label>
                <input
                  id={`${fieldId}-website`}
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </div>

              {/* 검증·전송 에러는 aria-live 로 announce. */}
              <div role="alert" aria-live="assertive">
                {error ? (
                  <p className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-400">
                    {error}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? '접수 중…' : '문의 접수'}
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  이메일은 비공개로 운영자만 확인합니다.
                </span>
              </div>
            </form>
          )}

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <InquiryBoard reloadKey={boardKey} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
