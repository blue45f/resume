/**
 * DesignPage — 이력서공방 디자인 시스템 라이브 스타일 가이드.
 *
 * 이 프로젝트의 실제 토큰(index.css)과 실제 컴포넌트(shared/ui, components)를
 * 그대로 보여준다. 새 팔레트를 만들지 않고 기존 정체성을 전시한다.
 * - Foundations: 색·타이포·간격·라운드·엘리베이션·모션 토큰
 * - Components: 실제 버튼/입력/Select/Dialog/AlertDialog/Tooltip/Popover/DropdownMenu/Tabs
 *               + 시그니처 컴포넌트(EmptyState/ErrorState/Toast)
 *
 * Header/Footer 와 동일한 셸 규칙(main#main-content, document.title)을 따른다.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'

import EmptyState from '@/components/EmptyState'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { toast } from '@/components/Toast'
import { getTheme, setTheme } from '@/lib/theme'
import AlertDialog from '@/shared/ui/AlertDialog'
import Dialog from '@/shared/ui/Dialog'
import DropdownMenu from '@/shared/ui/DropdownMenu'
import { ErrorState } from '@/shared/ui/ErrorState'
import { FieldError, fieldAria } from '@/shared/ui/FieldError'
import Popover from '@/shared/ui/Popover'
import Select from '@/shared/ui/Select'
import Tabs from '@/shared/ui/Tabs'
import Tooltip from '@/shared/ui/Tooltip'

type Theme = ReturnType<typeof getTheme>

// ─── In-page nav sections ────────────────────────────────────
const SECTIONS = [
  { id: 'foundations-color', label: '색상' },
  { id: 'foundations-type', label: '타이포그래피' },
  { id: 'foundations-space', label: '간격' },
  { id: 'foundations-radius', label: '라운드' },
  { id: 'foundations-elevation', label: '엘리베이션' },
  { id: 'foundations-motion', label: '모션' },
  { id: 'components-buttons', label: '버튼' },
  { id: 'components-fields', label: '입력' },
  { id: 'components-overlays', label: '오버레이' },
  { id: 'components-feedback', label: '피드백' },
] as const

// ─── Token catalogs (mirror index.css :root / .dark) ─────────
const NEUTRAL_TOKENS = [
  { token: '--color-surface', note: 'Paper White · 본문 배경' },
  { token: '--color-surface-raised', note: 'slate-50 · 올라온 표면' },
  { token: '--color-surface-sunken', note: 'slate-100 · 가라앉은 표면' },
  { token: '--color-border', note: 'slate-200 · 기본 보더' },
  { token: '--color-border-subtle', note: 'slate-100 · 약한 보더' },
  { token: '--color-text', note: 'slate-900 · 본문 (≥7:1)' },
  { token: '--color-text-secondary', note: 'slate-500 · 보조' },
  { token: '--color-text-muted', note: 'slate-400 · 약한 텍스트' },
] as const

const ACCENT_TOKENS = [
  { token: '--color-accent', note: 'Signal Blue · 주요 액션·선택' },
  { token: '--color-accent-soft', note: '액센트 연한 배경' },
] as const

const STATE_TOKENS = [
  { token: '--color-success', soft: '--color-success-light', note: 'emerald · 성공' },
  { token: '--color-warning', soft: '--color-warning-light', note: 'amber · 경고·콜드스타트' },
  { token: '--color-error', soft: '--color-error-light', note: 'red · 에러' },
] as const

const RADIUS_TOKENS = [
  { token: '--radius-sm', px: '8px' },
  { token: '--radius-md', px: '12px' },
  { token: '--radius-lg', px: '16px' },
  { token: '--radius-xl', px: '20px' },
] as const

const SHADOW_TOKENS = [
  { token: '--shadow-sm', note: '카드 기본' },
  { token: '--shadow-md', note: '드롭다운·팝오버' },
  { token: '--shadow-lg', note: '오버레이 콘텐츠' },
  { token: '--shadow-hover', note: '카드 hover·다이얼로그' },
] as const

const SPACE_STEPS = [
  { name: '1', rem: '0.25rem' },
  { name: '2', rem: '0.5rem' },
  { name: '3', rem: '0.75rem' },
  { name: '4', rem: '1rem' },
  { name: '6', rem: '1.5rem' },
  { name: '8', rem: '2rem' },
  { name: '12', rem: '3rem' },
  { name: '16', rem: '4rem' },
] as const

const EASING_TOKENS = [
  {
    token: '--ease-out-quart',
    value: 'cubic-bezier(0.25, 1, 0.5, 1)',
    note: '대부분의 진입·hover',
  },
  { token: '--ease-out-expo', value: 'cubic-bezier(0.16, 1, 0.3, 1)', note: '강한 감속·성공 모션' },
  {
    token: '--ease-in-out-quart',
    value: 'cubic-bezier(0.76, 0, 0.24, 1)',
    note: '양방향 전환',
  },
] as const

// ─── Live computed-value reader for token swatches ───────────
// rev 가 바뀌면(테마 토글) 재계산. tokens 는 join 한 안정 키로 deps 에 넣어
// react-compiler/exhaustive-deps 규칙을 모두 만족시킨다.
function useResolvedTokens(tokens: readonly string[], rev: number) {
  const [resolved, setResolved] = useState<Record<string, string>>({})
  const tokenKey = tokens.join(',')
  useEffect(() => {
    const styles = getComputedStyle(document.documentElement)
    const next: Record<string, string> = {}
    for (const t of tokenKey.split(',')) next[t] = styles.getPropertyValue(t).trim() || '—'
    setResolved(next)
  }, [tokenKey, rev])
  return resolved
}

// ─── Small presentational helpers (no nested cards) ──────────
function Section({
  id,
  title,
  desc,
  children,
}: {
  id: string
  title: string
  desc?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 py-10 sm:py-12 border-t border-[var(--color-border-subtle)]"
    >
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-balance text-[var(--color-text)]">
          {title}
        </h2>
        {desc && (
          <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-prose">
            {desc}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

/** 상태/구성 라벨 — 컴포넌트 데모 위 작은 캡션 */
function StateCaption({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
      {children}
    </p>
  )
}

/** 코드 토큰 표기 (mono) */
function Code({ children }: { children: ReactNode }) {
  return (
    <code className="font-mono text-[12px] text-[var(--color-text-secondary)] [font-family:ui-monospace,SFMono-Regular,'SF_Mono',Menlo,monospace]">
      {children}
    </code>
  )
}

function SwatchRow({
  swatch,
  token,
  value,
  note,
}: {
  swatch: ReactNode
  token: string
  value?: string
  note: string
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      {swatch}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <Code>{token}</Code>
          {value && (
            <span className="text-[11px] tabular-nums text-[var(--color-text-muted)]">{value}</span>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] truncate">{note}</p>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────
export default function DesignPage() {
  const [theme, setThemeState] = useState<Theme>(getTheme())
  // 테마 토글 시 computed value 재계산 트리거
  const [tokenRev, setTokenRev] = useState(0)

  const neutralResolved = useResolvedTokens(
    NEUTRAL_TOKENS.map((t) => t.token),
    tokenRev
  )
  const accentResolved = useResolvedTokens(
    [...ACCENT_TOKENS.map((t) => t.token), ...STATE_TOKENS.map((t) => t.token)],
    tokenRev
  )

  // Component demo state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [selectValue, setSelectValue] = useState('blue')
  const [fieldValue, setFieldValue] = useState('')
  const [motionKey, setMotionKey] = useState(0)
  const motionBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = '디자인 시스템 — 이력서공방'
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'
    }
  }, [])

  const cycleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    setTheme(next)
    setThemeState(next)
    // 클래스 토글이 적용된 다음 프레임에 토큰 재계산
    requestAnimationFrame(() => setTokenRev((r) => r + 1))
  }
  const themeIcon = theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '💻'
  const themeLabel = theme === 'dark' ? '다크' : theme === 'light' ? '라이트' : '시스템'

  const fieldHasError = fieldValue.trim().length > 0 && fieldValue.trim().length < 3

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1" role="main">
        {/* ── Page header ──────────────────────────────── */}
        <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="inline-block w-3 h-[2px] bg-[var(--color-accent)]"
                  />
                  <span className="text-xs font-bold tracking-[-0.02em] text-[var(--color-text-secondary)]">
                    이력서공방
                  </span>
                </div>
                <h1 className="mt-3 text-3xl sm:text-[2.75rem] font-bold leading-[1.1] tracking-[-0.03em] text-balance text-[var(--color-text)]">
                  디자인 시스템
                </h1>
                <p className="mt-3 text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-[60ch] text-pretty">
                  이 페이지는 별도 라이브러리가 아니라, 실제 제품이 쓰는 토큰과 컴포넌트를 그대로
                  렌더링한 살아있는 가이드입니다. 테마를 바꾸면 모든 값이 즉시 반영됩니다.
                </p>
              </div>
              <button
                type="button"
                onClick={cycleTheme}
                className="imp-btn shrink-0 inline-flex items-center gap-2 h-10 px-3.5 text-sm font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-sunken)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 transition-colors"
                aria-label={`테마 전환 (현재: ${themeLabel}) — 라이트 → 다크 → 시스템 순환`}
                title="라이트 → 다크 → 시스템 순환"
              >
                <span aria-hidden="true">{themeIcon}</span>
                <span className="tabular-nums">{themeLabel}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Sticky in-page nav ───────────────────────── */}
        <nav
          aria-label="디자인 시스템 섹션"
          className="sticky top-0 z-30 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-surface)]/75"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <ul className="flex gap-1 overflow-x-auto py-2.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="inline-flex whitespace-nowrap rounded-[var(--radius-sm)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-sunken)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] transition-colors"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-8">
          {/* ════ FOUNDATIONS ════ */}

          {/* Color */}
          <Section
            id="foundations-color"
            title="색상"
            desc="중립 슬레이트 램프 한 줄과 신호용 블루 액센트, 그리고 의미 상태색. 보라색은 쓰지 않습니다. 아래 값은 현재 테마 기준 computed value 입니다."
          >
            <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              <div>
                <StateCaption>중립 램프 · neutral</StateCaption>
                {NEUTRAL_TOKENS.map((t) => (
                  <SwatchRow
                    key={t.token}
                    token={t.token}
                    value={neutralResolved[t.token]}
                    note={t.note}
                    swatch={
                      <span
                        className="h-9 w-9 shrink-0 rounded-[var(--radius-sm)] border border-[var(--color-border)]"
                        style={{ background: `var(${t.token})` }}
                      />
                    }
                  />
                ))}
              </div>
              <div>
                <StateCaption>액센트 · accent</StateCaption>
                {ACCENT_TOKENS.map((t) => (
                  <SwatchRow
                    key={t.token}
                    token={t.token}
                    value={accentResolved[t.token]}
                    note={t.note}
                    swatch={
                      <span
                        className="h-9 w-9 shrink-0 rounded-[var(--radius-sm)] border border-[var(--color-border)]"
                        style={{ background: `var(${t.token})` }}
                      />
                    }
                  />
                ))}
                <div className="mt-4">
                  <StateCaption>상태색 · semantic</StateCaption>
                  {STATE_TOKENS.map((t) => (
                    <SwatchRow
                      key={t.token}
                      token={t.token}
                      value={accentResolved[t.token]}
                      note={t.note}
                      swatch={
                        <span className="flex shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                          <span className="h-9 w-9" style={{ background: `var(${t.token})` }} />
                          <span className="h-9 w-5" style={{ background: `var(${t.soft})` }} />
                        </span>
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Typography */}
          <Section
            id="foundations-type"
            title="타이포그래피"
            desc="단일 system-ui 산세리프 스택을 weight 로 위계를 만듭니다. 데이터·라벨에는 ui-monospace 를 씁니다."
          >
            <div className="space-y-5">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-[var(--color-border-subtle)] pb-4">
                <span className="text-4xl font-bold tracking-[-0.03em] text-[var(--color-text)]">
                  이력서공방 Aa
                </span>
                <Code>system-ui · sans</Code>
              </div>
              <div className="space-y-3">
                {(
                  [
                    ['Display / 3xl·bold', 'text-3xl font-bold tracking-[-0.02em]'],
                    ['Heading / xl·bold', 'text-xl font-bold tracking-tight'],
                    ['Subhead / lg·semibold', 'text-lg font-semibold'],
                    ['Body / base', 'text-base'],
                    ['Small / sm·secondary', 'text-sm text-[var(--color-text-secondary)]'],
                    ['Caption / xs·muted', 'text-xs text-[var(--color-text-muted)]'],
                  ] as const
                ).map(([label, cls]) => (
                  <div key={label} className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4">
                    <span className="w-48 shrink-0 pt-0.5">
                      <Code>{label}</Code>
                    </span>
                    <span className={`${cls} text-[var(--color-text)]`}>
                      체계적인 이력서, AI 로 완성하다
                    </span>
                  </div>
                ))}
              </div>
              <div>
                <StateCaption>본문 가독 폭 · 65–75ch + text-pretty</StateCaption>
                <p className="max-w-[68ch] text-base leading-relaxed text-pretty text-[var(--color-text)]">
                  본문 텍스트는 한 줄에 65–75자(ch) 안쪽으로 두어 시선 이동을 줄입니다. 긴 문단에는
                  text-wrap: pretty 를 적용해 마지막 줄의 외톨이 단어(orphan)를 줄이고, 제목에는
                  balance 를 써서 줄 길이를 고르게 맞춥니다. 본문 색은 충분한 대비(약 7:1)를 위해
                  연한 회색이 아니라 잉크에 가까운 슬레이트를 씁니다.
                </p>
              </div>
            </div>
          </Section>

          {/* Spacing */}
          <Section
            id="foundations-space"
            title="간격"
            desc="Tailwind 4 의 4px 기반 스페이스 스케일을 그대로 씁니다. 리듬을 위해 섹션마다 간격을 변주합니다."
          >
            <div className="space-y-2.5">
              {SPACE_STEPS.map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="w-10 shrink-0 text-right">
                    <Code>{s.name}</Code>
                  </span>
                  <span
                    className="h-3.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)]"
                    style={{ width: s.rem }}
                  />
                  <span className="text-xs tabular-nums text-[var(--color-text-muted)]">
                    {s.rem}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* Radii */}
          <Section
            id="foundations-radius"
            title="라운드"
            desc="요소 크기에 비례한 4단계 라운드. 작은 컨트롤은 sm, 카드는 lg, 입력은 md 가 기본입니다."
          >
            <div className="flex flex-wrap gap-5">
              {RADIUS_TOKENS.map((r) => (
                <div key={r.token} className="flex flex-col items-center gap-2">
                  <div
                    className="h-20 w-20 border border-[var(--color-border)] bg-[var(--color-surface-sunken)]"
                    style={{ borderRadius: `var(${r.token})` }}
                  />
                  <Code>{r.token}</Code>
                  <span className="text-xs tabular-nums text-[var(--color-text-muted)]">
                    {r.px}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* Elevation */}
          <Section
            id="foundations-elevation"
            title="엘리베이션"
            desc="그림자는 표면이 떠 있는 높이를 표현합니다. 다크 모드에서는 같은 토큰이 더 깊은 그림자로 자동 전환됩니다."
          >
            <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
              {SHADOW_TOKENS.map((s) => (
                <div
                  key={s.token}
                  className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5"
                  style={{ boxShadow: `var(${s.token})` }}
                >
                  <Code>{s.token}</Code>
                  <p className="mt-2 text-xs text-[var(--color-text-secondary)]">{s.note}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Motion */}
          <Section
            id="foundations-motion"
            title="모션"
            desc="감속 곡선(ease-out)만 쓰고 바운스는 쓰지 않습니다. 모든 모션은 prefers-reduced-motion 에서 비활성화됩니다."
          >
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <div>
                <StateCaption>이징 토큰</StateCaption>
                <div className="space-y-2">
                  {EASING_TOKENS.map((e) => (
                    <div key={e.token} className="py-1">
                      <Code>{e.token}</Code>
                      <p className="text-xs text-[var(--color-text-secondary)]">{e.note}</p>
                      <p className="text-[11px] tabular-nums text-[var(--color-text-muted)]">
                        {e.value}
                      </p>
                    </div>
                  ))}
                  <p className="pt-1 text-xs text-[var(--color-text-secondary)]">
                    지속시간: <Code>--transition-fast 150ms</Code> ·{' '}
                    <Code>--transition-normal 250ms</Code>
                  </p>
                </div>
              </div>
              <div>
                <StateCaption>인터랙티브 데모</StateCaption>
                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-5">
                  <div className="flex h-20 items-center">
                    <div
                      key={motionKey}
                      ref={motionBoxRef}
                      className="design-motion-demo h-12 w-12 rounded-[var(--radius-md)] bg-[var(--color-accent)]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setMotionKey((k) => k + 1)}
                    className="imp-btn mt-2 h-9 px-3.5 text-sm font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-sunken)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 transition-colors"
                  >
                    다시 재생 (ease-out-expo)
                  </button>
                </div>
              </div>
            </div>
          </Section>

          {/* ════ COMPONENTS ════ */}

          {/* Buttons */}
          <Section
            id="components-buttons"
            title="버튼"
            desc="버튼은 .imp-btn 베이스 위에 인라인 클래스로 변형을 만듭니다. active 시 0.98 scale, 키보드 포커스는 accent 링으로 통일됩니다."
          >
            <div className="space-y-6">
              <div>
                <StateCaption>variant — default</StateCaption>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="imp-btn px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-[var(--radius-md)] hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 transition-colors"
                  >
                    Primary
                  </button>
                  <button
                    type="button"
                    className="imp-btn px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] bg-transparent hover:bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 transition-colors"
                  >
                    Secondary
                  </button>
                  <button
                    type="button"
                    className="imp-btn px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-sunken)] rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 transition-colors"
                  >
                    Ghost
                  </button>
                  <button
                    type="button"
                    className="imp-btn px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-[var(--radius-md)] hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-colors"
                  >
                    Danger
                  </button>
                </div>
              </div>
              <div>
                <StateCaption>state — disabled · loading</StateCaption>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled
                    className="imp-btn px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-[var(--radius-md)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Disabled
                  </button>
                  <button
                    type="button"
                    disabled
                    className="imp-btn inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-[var(--radius-md)] opacity-80 cursor-progress"
                  >
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin motion-reduce:animate-none"
                    />
                    저장 중…
                  </button>
                </div>
              </div>
            </div>
          </Section>

          {/* Fields */}
          <Section
            id="components-fields"
            title="입력 · 필드"
            desc=".auth-field 클래스가 기본/hover/focus/error 상태를 담고, FieldError + fieldAria 로 검증 메시지를 의미적으로 연결합니다."
          >
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <div>
                <StateCaption>default · focus</StateCaption>
                <label
                  htmlFor="ds-default"
                  className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                >
                  이름
                </label>
                <input
                  id="ds-default"
                  className="auth-field"
                  placeholder="홍길동"
                  defaultValue=""
                />
                <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                  포커스 시 accent 링이 나타납니다.
                </p>
              </div>
              <div>
                <StateCaption>error (live · 3자 미만)</StateCaption>
                <label
                  htmlFor="ds-error"
                  className="mb-1.5 block text-sm font-medium text-[var(--color-text)]"
                >
                  닉네임
                </label>
                <input
                  id="ds-error"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  placeholder="3자 이상 입력해보세요"
                  className={`auth-field ${fieldHasError ? 'auth-field--error' : ''}`}
                  {...fieldAria('ds-error', fieldHasError || undefined)}
                />
                <FieldError
                  id="ds-error"
                  message={fieldHasError ? '닉네임은 3자 이상이어야 합니다.' : undefined}
                />
              </div>
              <div>
                <StateCaption>disabled</StateCaption>
                <input
                  className="auth-field"
                  value="수정할 수 없는 값"
                  disabled
                  aria-label="비활성 입력 예시"
                />
              </div>
              <div>
                <StateCaption>Select (Radix · 포털)</StateCaption>
                <Select
                  value={selectValue}
                  onChange={setSelectValue}
                  ariaLabel="액센트 예시 선택"
                  options={[
                    { value: 'blue', label: 'Signal Blue' },
                    { value: 'emerald', label: 'Success Emerald' },
                    { value: 'amber', label: 'Warning Amber' },
                    { value: 'red', label: 'Error Red' },
                  ]}
                />
              </div>
            </div>
          </Section>

          {/* Overlays */}
          <Section
            id="components-overlays"
            title="오버레이"
            desc="Dialog·AlertDialog·Tooltip·Popover·DropdownMenu 는 모두 Radix 포털로 렌더되어 overflow 스택을 탈출하고, 포커스 트랩·Esc·reduced-motion 을 기본 지원합니다."
          >
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="imp-btn px-4 py-2.5 text-sm font-medium bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-sunken)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 transition-colors"
              >
                Dialog 열기
              </button>
              <button
                type="button"
                onClick={() => setAlertOpen(true)}
                className="imp-btn px-4 py-2.5 text-sm font-medium bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-sunken)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 transition-colors"
              >
                AlertDialog (danger)
              </button>

              <Tooltip content="키보드 포커스로도 열립니다">
                <button
                  type="button"
                  className="imp-btn px-4 py-2.5 text-sm font-medium bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-sunken)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 transition-colors"
                >
                  Tooltip (hover)
                </button>
              </Tooltip>

              <Popover.Root>
                <Popover.Trigger asChild>
                  <button
                    type="button"
                    className="imp-btn px-4 py-2.5 text-sm font-medium bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-sunken)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 transition-colors"
                  >
                    Popover
                  </button>
                </Popover.Trigger>
                <Popover.Content>
                  <p className="text-sm font-semibold text-[var(--color-text)]">표면 위 패널</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    팝오버는 임의 콘텐츠를 담을 수 있고 트리거에 정렬됩니다.
                  </p>
                </Popover.Content>
              </Popover.Root>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    className="imp-btn px-4 py-2.5 text-sm font-medium bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-sunken)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 transition-colors"
                  >
                    Dropdown
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  <DropdownMenu.Label>작업</DropdownMenu.Label>
                  <DropdownMenu.Item onSelect={() => toast('복제했습니다', 'success')}>
                    복제
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => toast('링크를 복사했습니다', 'info')}>
                    링크 복사
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item
                    className="text-red-600 dark:text-red-400 data-[highlighted]:bg-red-50 dark:data-[highlighted]:bg-red-900/20"
                    onSelect={() => toast('삭제했습니다', 'error')}
                  >
                    삭제
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </div>

            <Dialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              title="다이얼로그 예시"
              description="포털로 렌더되어 어떤 overflow 컨테이너 안에서도 잘립니다 없이 표시됩니다."
              maxWidth="max-w-md"
            >
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Esc 키나 바깥 클릭으로 닫히고, 열릴 때 포커스가 안으로 트랩됩니다. 닫으면 포커스가
                트리거로 복귀합니다.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="imp-btn px-4 h-10 text-sm font-medium text-[var(--color-text-secondary)] bg-transparent hover:bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-md)] transition-colors"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDialogOpen(false)
                    toast('확인했습니다', 'success')
                  }}
                  className="imp-btn px-4 h-10 text-sm font-semibold bg-blue-600 text-white rounded-[var(--radius-md)] hover:bg-blue-700 transition-colors"
                >
                  확인
                </button>
              </div>
            </Dialog>

            <AlertDialog
              open={alertOpen}
              onOpenChange={setAlertOpen}
              title="이력서를 삭제할까요?"
              description="이 작업은 되돌릴 수 없습니다. 연결된 자기소개서는 유지됩니다."
              confirmText="삭제"
              cancelText="취소"
              danger
              onConfirm={() => toast('삭제했습니다', 'error')}
            />
          </Section>

          {/* Feedback / signature */}
          <Section
            id="components-feedback"
            title="피드백 상태"
            desc="제품의 정직성 원칙: 서버 에러를 '데이터 없음'으로 위장하지 않습니다. 에러·빈 상태·토스트를 명확히 구분합니다."
          >
            <div className="space-y-8">
              <div>
                <StateCaption>ErrorState — 쿼리 실패 (재시도)</StateCaption>
                <ErrorState
                  message="목록을 불러오지 못했습니다"
                  onRetry={() => toast('다시 시도합니다', 'info')}
                />
              </div>

              <div>
                <StateCaption>EmptyState — 성공 + 0건</StateCaption>
                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
                  <EmptyState type="search" query="프론트엔드" />
                </div>
              </div>

              <div>
                <StateCaption>Toast — sonner</StateCaption>
                <div className="flex flex-wrap gap-3">
                  {(
                    [
                      ['success', '성공 토스트'],
                      ['error', '에러 토스트'],
                      ['warning', '경고 토스트'],
                      ['info', '정보 토스트'],
                    ] as const
                  ).map(([type, label]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toast(label, type)}
                      className="imp-btn px-4 py-2 text-sm font-medium bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-sunken)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <StateCaption>Tabs — 패널 전환</StateCaption>
                <Tabs
                  ariaLabel="탭 예시"
                  items={[
                    {
                      id: 'overview',
                      label: '개요',
                      content: (
                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                          탭은 키보드 화살표로 이동하고 밑줄 인디케이터가 활성 탭을 따라갑니다.
                        </p>
                      ),
                    },
                    {
                      id: 'tokens',
                      label: '토큰',
                      count: 3,
                      content: (
                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                          count 뱃지로 항목 수를 함께 표시할 수 있습니다.
                        </p>
                      ),
                    },
                    {
                      id: 'a11y',
                      label: '접근성',
                      content: (
                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                          role=tablist · aria-selected · 포커스 관리가 내장되어 있습니다.
                        </p>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          </Section>
        </div>
      </main>
      <Footer />
    </>
  )
}
