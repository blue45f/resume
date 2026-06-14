import type { Resume } from '@/types/resume'

import TagSelector from '@/components/TagSelector'
import { toast } from '@/components/Toast'
import { setResumeVisibility } from '@/lib/api'

interface EditResumeToolbarProps {
  id: string | undefined
  resume: Resume
  onReload: () => void
  onShowAttachments: () => void
  onShowVersions: () => void
  onShowAllowedViewers: () => void
}

export default function EditResumeToolbar({
  id,
  resume,
  onReload,
  onShowAttachments,
  onShowVersions,
  onShowAllowedViewers,
}: EditResumeToolbarProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* 공개 설정 */}
      {id && (
        <select
          value={resume.visibility || 'private'}
          onChange={async (e) => {
            const next = e.target.value
            const prev = resume.visibility || 'private'
            try {
              await setResumeVisibility(id, next)
              onReload()
              toast(
                next === 'public'
                  ? '공개로 전환했습니다'
                  : next === 'link-only'
                    ? '링크 가진 사람만 볼 수 있도록 변경했습니다'
                    : next === 'selective'
                      ? '선택한 사용자만 볼 수 있도록 변경했습니다'
                      : '비공개로 전환했습니다',
                'success'
              )
            } catch (err) {
              if (import.meta.env.DEV)
                console.warn('[EditResumePage] setResumeVisibility 실패:', err)
              toast(
                err instanceof Error
                  ? err.message
                  : '공개 설정 변경에 실패했습니다. 다시 시도해주세요.',
                'error'
              )
              // revert select to previous value (re-render through query refetch)
              void prev
              onReload()
            }
          }}
          className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100"
          aria-label="공개 설정"
        >
          <option value="private">비공개</option>
          <option value="public">공개</option>
          <option value="link-only">링크만 공개</option>
          <option value="selective">선택 사용자만 공개</option>
        </select>
      )}
      {id && resume.visibility === 'selective' && (
        <button
          type="button"
          onClick={onShowAllowedViewers}
          className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
          title="이 이력서를 볼 수 있는 사용자 목록 관리"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6 0a4 4 0 10-4-4 4 4 0 004 4z"
            />
          </svg>
          허용 사용자 관리
        </button>
      )}
      <button
        onClick={onShowAttachments}
        className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
      >
        첨부파일
      </button>
      <button
        onClick={onShowVersions}
        className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
      >
        버전 이력
      </button>
      {id && <TagSelector resumeId={id} currentTags={resume.tags || []} onUpdate={onReload} />}
    </div>
  )
}
