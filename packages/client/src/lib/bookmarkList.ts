// 북마크 목록의 검색·정렬 로직 — 순수 함수라 단위 테스트 가능하고 UI 와 분리된다.

export interface BookmarkItem {
  id: string
  resumeId: string
  title: string
  name: string
  createdAt: string
}

export type BookmarkSortMode = 'recent' | 'oldest' | 'title' | 'name'

export const BOOKMARK_SORT_OPTIONS: { value: BookmarkSortMode; label: string }[] = [
  { value: 'recent', label: '최근 저장순' },
  { value: 'oldest', label: '오래된순' },
  { value: 'title', label: '이력서 제목순' },
  { value: 'name', label: '작성자 이름순' },
]

/** 제목/작성자에 대해 대소문자 무시 부분일치 검색 후 선택한 기준으로 정렬한다(입력 불변). */
export function filterAndSortBookmarks(
  items: readonly BookmarkItem[],
  search: string,
  sortMode: BookmarkSortMode
): BookmarkItem[] {
  const q = search.trim().toLowerCase()
  const filtered = q
    ? items.filter(
        (b) => (b.title || '').toLowerCase().includes(q) || (b.name || '').toLowerCase().includes(q)
      )
    : items
  return [...filtered].sort((a, b) => {
    switch (sortMode) {
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'title':
        return (a.title || '').localeCompare(b.title || '', 'ko')
      case 'name':
        return (a.name || '').localeCompare(b.name || '', 'ko')
    }
  })
}
