import { describe, expect, it } from 'vitest'

import { filterAndSortBookmarks, type BookmarkItem } from '@/lib/bookmarkList'

const items: BookmarkItem[] = [
  { id: '1', resumeId: 'r1', title: '백엔드 이력서', name: '김철수', createdAt: '2026-01-03' },
  { id: '2', resumeId: 'r2', title: 'Frontend Resume', name: '이영희', createdAt: '2026-01-05' },
  { id: '3', resumeId: 'r3', title: '데이터 분석가', name: '박민수', createdAt: '2026-01-01' },
]

describe('filterAndSortBookmarks', () => {
  it('정렬: recent 는 최신순, oldest 는 오래된순', () => {
    expect(filterAndSortBookmarks(items, '', 'recent').map((b) => b.id)).toEqual(['2', '1', '3'])
    expect(filterAndSortBookmarks(items, '', 'oldest').map((b) => b.id)).toEqual(['3', '1', '2'])
  })

  it('검색: 제목·작성자 대소문자 무시 부분일치', () => {
    expect(filterAndSortBookmarks(items, 'frontend', 'recent').map((b) => b.id)).toEqual(['2'])
    expect(filterAndSortBookmarks(items, '박민수', 'recent').map((b) => b.id)).toEqual(['3'])
    expect(filterAndSortBookmarks(items, '이력서', 'recent').map((b) => b.id)).toEqual(['1'])
  })

  it('검색어가 비면 전체를 반환하고 매치가 없으면 빈 배열', () => {
    expect(filterAndSortBookmarks(items, '   ', 'recent')).toHaveLength(3)
    expect(filterAndSortBookmarks(items, 'zzz', 'recent')).toEqual([])
  })

  it('입력 배열을 변형하지 않는다(순수 함수)', () => {
    const snapshot = items.map((b) => b.id)
    filterAndSortBookmarks(items, '', 'title')
    expect(items.map((b) => b.id)).toEqual(snapshot)
  })
})
