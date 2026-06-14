import { Link, type NavigateFunction } from 'react-router-dom'

import {
  RESUME_SORT_OPTIONS,
  getResumeTagStyle,
  getTagFilterStyle,
  type ResumeSortBy,
} from './types'

import type { ResumeSummary, Tag } from '@/types/resume'
import type { Dispatch, SetStateAction } from 'react'

import ResumeThumbnail from '@/components/ResumeThumbnail'
import ShareMenu from '@/components/ShareMenu'
import { t, tx } from '@/lib/i18n'
import { ROUTES } from '@/lib/routes'
import { timeAgo } from '@/lib/time'

interface MyResumesSectionProps {
  resumes: ResumeSummary[]
  tags: (Tag & { resumeCount: number })[]
  filtered: ResumeSummary[]
  sorted: ResumeSummary[]
  searchQuery: string
  setSearchQuery: Dispatch<SetStateAction<string>>
  filterTag: string | null
  setFilterTag: Dispatch<SetStateAction<string | null>>
  filterVisibility: string
  setFilterVisibility: Dispatch<SetStateAction<string>>
  sortBy: ResumeSortBy
  setSortBy: Dispatch<SetStateAction<ResumeSortBy>>
  sortOrder: 'desc' | 'asc'
  setSortOrder: Dispatch<SetStateAction<'desc' | 'asc'>>
  selectMode: boolean
  setSelectMode: Dispatch<SetStateAction<boolean>>
  selectedIds: Set<string>
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>
  toggleSelect: (id: string) => void
  selectAll: () => void
  setShareDialogOpen: Dispatch<SetStateAction<boolean>>
  handleBulkDelete: () => void | Promise<void>
  handleDelete: (id: string, title: string) => void | Promise<void>
  handleDuplicate: (id: string) => void | Promise<void>
  navigate: NavigateFunction
}

export default function MyResumesSection({
  resumes,
  tags,
  filtered,
  sorted,
  searchQuery,
  setSearchQuery,
  filterTag,
  setFilterTag,
  filterVisibility,
  setFilterVisibility,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  selectMode,
  setSelectMode,
  selectedIds,
  setSelectedIds,
  toggleSelect,
  selectAll,
  setShareDialogOpen,
  handleBulkDelete,
  handleDelete,
  handleDuplicate,
  navigate,
}: MyResumesSectionProps) {
  return (
    <>
      {/* 내 이력서 섹션 헤딩 */}
      <div className="flex items-center justify-between mb-4 mt-2">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md flex items-center justify-center text-xs">
            📄
          </span>
          {t('home.myResumes')}
          {resumes.length > 0 && (
            <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
              ({resumes.length})
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {resumes.length > 0 && (
            <Link
              to={
                '/community/write?category=resume' +
                `&title=${encodeURIComponent('이력서 피드백 부탁드립니다 🙏')}` +
                `&body=${encodeURIComponent(
                  '안녕하세요! 아래 이력서에 대해 피드백 부탁드립니다.\n\n[관심 분야]\n예: 백엔드 / 신입\n\n[궁금한 점]\n- \n- \n\n[이력서 링크]\n(여기에 본인 이력서 링크를 붙여넣어주세요. EditResume → 공개 설정 → 링크만 공개로 토큰 URL 생성 가능)\n'
                )}`
              }
              className="home-hover-dim inline-flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-lg"
              title="커뮤니티에 이력서 피드백 요청 글 작성"
            >
              <span aria-hidden="true">🙋</span> 피드백 받기
            </Link>
          )}
          <Link
            to={ROUTES.resume.new}
            className="home-hover-dim inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {tx('resume.new')}
          </Link>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            role="searchbox"
            placeholder={`${tx('home.myResumes')} ${tx('common.search')}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="이력서 검색"
            className="home-field-control w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-lg"
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: 'all', label: '전체', icon: '📋' },
            { value: 'public', label: '공개', icon: '🌐' },
            { value: 'link-only', label: '링크', icon: '🔗' },
            { value: 'private', label: '비공개', icon: '🔒' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterVisibility(opt.value)}
              className={`home-hover-dim px-2.5 py-1.5 text-xs rounded-lg whitespace-nowrap ${
                filterVisibility === opt.value
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tag filter */}
      {tags.length > 0 && (
        <div
          className="flex gap-2 mb-4 overflow-x-auto py-1 -my-1 px-1 -mx-1"
          role="group"
          aria-label="태그 필터"
        >
          <button
            onClick={() => setFilterTag(null)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap home-hover-dim ${
              !filterTag ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
            aria-pressed={!filterTag}
          >
            전체
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap home-hover-dim home-tag-filter-pill ${
                filterTag === tag.id ? 'text-white' : 'text-slate-700'
              }`}
              style={getTagFilterStyle(tag, filterTag === tag.id)}
              aria-pressed={filterTag === tag.id}
            >
              {tag.name} ({tag.resumeCount})
            </button>
          ))}
        </div>
      )}

      {/* Sort */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-slate-500 dark:text-slate-400">정렬:</span>
        {RESUME_SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              if (sortBy === opt.value) setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
              else {
                setSortBy(opt.value)
                setSortOrder('desc')
              }
            }}
            className={`px-2.5 py-1 text-xs rounded-lg home-hover-dim ${
              sortBy === opt.value
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {opt.label}
            {sortBy === opt.value && (
              <span className="ml-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>
            )}
          </button>
        ))}
      </div>

      {/* Bulk actions toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button
          onClick={() => {
            setSelectMode(!selectMode)
            setSelectedIds(new Set())
          }}
          className={`home-hover-dim text-xs px-3 py-1.5 rounded-lg ${
            selectMode
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          {selectMode ? '선택 취소' : '선택'}
        </button>
        <button
          onClick={() => setShareDialogOpen(true)}
          className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 inline-flex items-center gap-1 home-hover-dim"
          title="이력서를 특정 사용자와 공유"
        >
          🔗 사용자에게 공유
        </button>
        {selectMode && (
          <>
            <button
              onClick={selectAll}
              className="home-hover-dim text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg"
            >
              {selectedIds.size === filtered.length ? '전체 해제' : '전체 선택'}
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="home-hover-dim text-xs px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"
              >
                {selectedIds.size}개 삭제
              </button>
            )}
          </>
        )}
      </div>

      {/* Resume grid (or empty filter state) */}
      {sorted.length === 0 ? (
        <div className="imp-card p-8 sm:p-10 text-center animate-fade-in-up">
          <div className="text-4xl mb-3" aria-hidden="true">
            🔍
          </div>
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
            필터 조건과 일치하는 이력서가 없어요
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
            {searchQuery ? `"${searchQuery}" 검색 결과가 없습니다. ` : ''}
            {filterTag || filterVisibility !== 'all'
              ? '필터를 해제하거나 검색어를 바꿔보세요.'
              : '검색어를 다시 입력해보세요.'}
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setFilterTag(null)
                setFilterVisibility('all')
              }}
              className="home-hover-dim px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white"
            >
              필터 초기화
            </button>
            <Link
              to={ROUTES.resume.new}
              className="home-hover-dim px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300"
            >
              + 새 이력서
            </Link>
          </div>
        </div>
      ) : (
        <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
          {sorted.map((resume, index) => (
            <article
              key={resume.id}
              className={`relative home-resume-card card-lift-subtle imp-card p-4 sm:p-5 pl-5 sm:pl-6 animate-fade-in-up stagger-${Math.min(
                index + 1,
                6
              )} overflow-hidden`}
            >
              <span
                className={`accent-bar ${resume.visibility === 'public' ? 'accent-bar-public' : resume.visibility === 'link-only' ? 'accent-bar-link' : 'accent-bar-private'}`}
                aria-hidden="true"
              />
              <div className="flex gap-3">
                {/* Thumbnail preview */}
                <div className="hidden sm:block w-20 shrink-0">
                  <ResumeThumbnail
                    resume={resume}
                    onClick={() => navigate(ROUTES.resume.preview(resume.id))}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {selectMode && (
                    <div className="mb-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(resume.id)}
                        onChange={() => toggleSelect(resume.id)}
                        className="home-checkbox w-4 h-4 rounded border-slate-300 text-blue-600"
                        aria-label={`${resume.title} 선택`}
                      />
                    </div>
                  )}
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100 truncate mb-1">
                    {resume.title || '제목 없음'}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {resume.personalInfo.name || '이름 미입력'}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <p
                      className="text-xs text-slate-500 dark:text-slate-400"
                      title={new Date(resume.updatedAt).toLocaleString('ko-KR')}
                    >
                      {timeAgo(resume.updatedAt)}
                    </p>
                    {(() => {
                      const daysSinceUpdate = Math.floor(
                        (Date.now() - new Date(resume.updatedAt).getTime()) / 86400000
                      )
                      if (daysSinceUpdate >= 60)
                        return (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full"
                            title="60일 이상 업데이트되지 않았습니다"
                          >
                            <svg
                              className="w-2.5 h-2.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                            오래된 이력서
                          </span>
                        )
                      if (daysSinceUpdate >= 30)
                        return (
                          <span
                            className="badge-xs badge-amber"
                            title="30일 이상 업데이트되지 않았습니다"
                          >
                            <svg
                              className="w-2.5 h-2.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            업데이트 필요
                          </span>
                        )
                      return null
                    })()}
                  </div>

                  {/* Tags */}
                  {resume.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {resume.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-2 py-1 text-xs rounded-full home-resume-tag-chip"
                          style={getResumeTagStyle(tag)}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1" title="조회수">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      {resume.viewCount || 0}
                    </span>
                    <span
                      className="flex items-center gap-1"
                      title={`공개: ${resume.visibility || 'private'}`}
                    >
                      {resume.visibility === 'public'
                        ? '🌐 공개'
                        : resume.visibility === 'link-only'
                          ? '🔗 링크'
                          : '🔒 비공개'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5">
                    <Link
                      to={ROUTES.resume.preview(resume.id)}
                      className="home-resume-action-btn home-resume-action-btn--preview"
                      aria-label={`${resume.title} 미리보기`}
                      title="미리보기"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    </Link>
                    <Link
                      to={ROUTES.resume.edit(resume.id)}
                      className="home-resume-action-btn home-resume-action-btn--edit"
                      aria-label={`${resume.title} 편집`}
                      title="편집"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDuplicate(resume.id)}
                      className="home-resume-action-btn home-resume-action-btn--compact home-resume-action-btn--muted"
                      aria-label={`${resume.title} 복제`}
                      title="복제"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                    <ShareMenu
                      url={`${window.location.origin}/resumes/${resume.id}/preview`}
                      title={resume.title || '이력서'}
                      description={`${resume.personalInfo.name || ''}의 이력서`}
                    />
                    <button
                      onClick={() => handleDelete(resume.id, resume.title)}
                      className="home-resume-action-btn home-resume-action-btn--compact home-resume-action-btn--danger"
                      aria-label={`${resume.title} 삭제`}
                      title="삭제"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
