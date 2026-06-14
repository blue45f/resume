export type CommunityDemoAction =
  | 'search'
  | 'search-clear'
  | 'category'
  | 'sort'
  | 'read'
  | 'blocked'
  | 'write-open'
  | 'draft-save'
  | 'editor-tool'
  | 'preview'
  | 'upload'
  | 'post-submit'
  | 'tutorial-guide'

export interface CommunityDemoLogEntry {
  id: string
  at: number
  action: CommunityDemoAction
  label: string
  detail?: string
}

export const COMMUNITY_DEMO_LOG_STORAGE_KEY = 'resume-community-demo-log-v1'
const COMMUNITY_DEMO_LOG_LIMIT = 80
const COMMUNITY_DEMO_ACTIONS = new Set<string>([
  'search',
  'search-clear',
  'category',
  'sort',
  'read',
  'blocked',
  'write-open',
  'draft-save',
  'editor-tool',
  'preview',
  'upload',
  'post-submit',
  'tutorial-guide',
])

const makeCommunityDemoLogId = () =>
  `resume-community-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export function readCommunityDemoLog(): CommunityDemoLogEntry[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(COMMUNITY_DEMO_LOG_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is CommunityDemoLogEntry => {
        const candidate = item as Partial<CommunityDemoLogEntry>
        return (
          typeof candidate.id === 'string' &&
          typeof candidate.at === 'number' &&
          typeof candidate.action === 'string' &&
          COMMUNITY_DEMO_ACTIONS.has(candidate.action) &&
          typeof candidate.label === 'string'
        )
      })
      .slice(-COMMUNITY_DEMO_LOG_LIMIT)
  } catch {
    return []
  }
}

export function writeCommunityDemoLog(logs: CommunityDemoLogEntry[]) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      COMMUNITY_DEMO_LOG_STORAGE_KEY,
      JSON.stringify(logs.slice(-COMMUNITY_DEMO_LOG_LIMIT))
    )
  } catch {
    // Local demo persistence is best-effort.
  }
}

export function appendCommunityDemoLog(
  action: CommunityDemoAction,
  label: string,
  detail?: string
): CommunityDemoLogEntry[] {
  const next = [
    ...readCommunityDemoLog(),
    { id: makeCommunityDemoLogId(), at: Date.now(), action, label, detail },
  ].slice(-COMMUNITY_DEMO_LOG_LIMIT)
  writeCommunityDemoLog(next)
  return next
}

export function summarizeCommunityDemoLog(logs: CommunityDemoLogEntry[]) {
  const count = (actions: CommunityDemoAction[]) =>
    logs.filter((log) => actions.includes(log.action)).length

  return {
    searchCount: count(['search', 'search-clear']),
    filterCount: count(['category', 'sort']),
    readCount: count(['read']),
    blockedCount: count(['blocked']),
    writeCount: count([
      'write-open',
      'draft-save',
      'editor-tool',
      'preview',
      'upload',
      'post-submit',
    ]),
    tutorialCount: count(['tutorial-guide']),
  }
}

export function formatCommunityDemoTime(at: number) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(at))
}
