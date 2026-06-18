import { Top } from '@toss/tds-mobile'
import { useMemo, useState } from 'react'

import { getResumes, type Resume } from '../lib/api'
import { navigate } from '../router'
import { theme, pageShell } from '../theme'
import { SearchBar, Chips, Badge } from '../ui'

const ALL = '전체'
const groupOf = (role: string) =>
  /개발|엔지니어|아키텍트|풀스택|프론트|백엔드/.test(role)
    ? '개발'
    : /디자이너|UX|UI/.test(role)
      ? '디자인'
      : /마케/.test(role)
        ? '마케팅'
        : /매니저|기획|PM/.test(role)
          ? '기획'
          : /데이터|분석/.test(role)
            ? '데이터'
            : '기타'

export function ResumeListPage() {
  const items = getResumes()
  const [q, setQ] = useState('')
  const [g, setG] = useState(ALL)

  const groups = useMemo(() => {
    const c = new Map<string, number>()
    for (const r of items) c.set(groupOf(r.role), (c.get(groupOf(r.role)) || 0) + 1)
    return [ALL, ...[...c.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k)]
  }, [items])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return items.filter((r) => {
      const okG = g === ALL || groupOf(r.role) === g
      const okQ =
        !query ||
        [r.title, r.role, r.summary, ...(r.skills || [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)
      return okG && okQ
    })
  }, [items, q, g])

  const open = (r: Resume) => navigate(`/resume/${encodeURIComponent(r.id)}`)

  return (
    <div style={{ minHeight: '100dvh', background: theme.bg }}>
      <Top
        title={<Top.TitleParagraph size={22}>📄 이력서공방</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            직무별 합격 이력서 예시를 참고하세요
          </Top.SubtitleParagraph>
        }
      />
      <div style={pageShell}>
        <div className="rise" style={{ marginBottom: 12 }}>
          <SearchBar value={q} onChange={setQ} placeholder="직무·스킬 검색" />
        </div>
        <div className="rise" style={{ animationDelay: '60ms', marginBottom: 18 }}>
          <Chips items={groups} active={g} onPick={setG} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={() => open(r)}
              className="pressable rise"
              style={{
                animationDelay: `${90 + i * 22}ms`,
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: theme.radius,
                padding: 16,
                color: theme.text,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <Badge accent>{r.role}</Badge>
                {r.viewCount ? (
                  <span style={{ fontSize: 12, color: theme.textMuted, marginLeft: 'auto' }}>
                    👁 {r.viewCount.toLocaleString()}
                  </span>
                ) : null}
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.4 }}>{r.title}</div>
              {r.summary && (
                <div
                  style={{
                    fontSize: 13,
                    color: theme.textMuted,
                    marginTop: 6,
                    lineHeight: 1.55,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {r.summary}
                </div>
              )}
              {r.skills?.length ? (
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  {r.skills.slice(0, 4).map((s) => (
                    <Badge key={s}>{s}</Badge>
                  ))}
                </div>
              ) : null}
            </button>
          ))}
          {filtered.length === 0 && (
            <p style={{ textAlign: 'center', color: theme.textMuted, padding: '40px 0' }}>
              ‘{q || g}’ 결과가 없어요.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
