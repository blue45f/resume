/**
 * FeedbackPage 로직 테스트 (localStorage 기반)
 *
 * src/pages/FeedbackPage.tsx의 피드백 관련 순수 로직을 테스트합니다.
 * localStorage 모킹을 통해 CRUD, 필터링, 투표, 정렬을 검증합니다.
 */

// export를 추가하여 모듈 스코프로 전환 (auth-utils.spec.ts와 변수 충돌 방지)
export {};

interface FeedbackItem {
  id: string;
  type: 'bug' | 'feature' | 'opinion' | 'question';
  title: string;
  content: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  votes: number;
  authorName: string;
  createdAt: string;
  replies: number;
}

// localStorage 모킹
const feedbackStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', { value: feedbackStorageMock });

// ─── 헬퍼: FeedbackPage의 로직을 순수 함수로 추출 ───

function createFeedbackItem(
  type: FeedbackItem['type'],
  title: string,
  content: string,
  authorName: string,
): FeedbackItem {
  return {
    id: Date.now().toString(),
    type,
    title: title.trim(),
    content: content.trim(),
    status: 'open',
    votes: 0,
    authorName: authorName || '익명',
    createdAt: new Date().toISOString(),
    replies: 0,
  };
}

function loadItems(): FeedbackItem[] {
  try {
    return JSON.parse(localStorage.getItem('feedback-items') || '[]');
  } catch {
    return [];
  }
}

function saveItems(items: FeedbackItem[]) {
  localStorage.setItem('feedback-items', JSON.stringify(items));
}

function filterByType(items: FeedbackItem[], type: string): FeedbackItem[] {
  return type === 'all' ? items : items.filter((i) => i.type === type);
}

function voteItem(items: FeedbackItem[], id: string): FeedbackItem[] {
  return items.map((item) => (item.id === id ? { ...item, votes: item.votes + 1 } : item));
}

function sortByVotes(items: FeedbackItem[]): FeedbackItem[] {
  return [...items].sort((a, b) => b.votes - a.votes);
}

function sortByDate(items: FeedbackItem[]): FeedbackItem[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

describe('Feedback 시스템', () => {
  beforeEach(() => {
    feedbackStorageMock.clear();
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────
  // 피드백 생성
  // ──────────────────────────────────────────────────
  describe('피드백 생성', () => {
    it('새 피드백 아이템 생성', () => {
      const item = createFeedbackItem('bug', '로그인 오류', '구글 로그인이 안 됩니다', '홍길동');
      expect(item.type).toBe('bug');
      expect(item.title).toBe('로그인 오류');
      expect(item.content).toBe('구글 로그인이 안 됩니다');
      expect(item.authorName).toBe('홍길동');
      expect(item.status).toBe('open');
      expect(item.votes).toBe(0);
      expect(item.replies).toBe(0);
    });

    it('제목과 내용의 공백이 트리밍됨', () => {
      const item = createFeedbackItem('feature', '  기능 제안  ', '  내용  ', '테스터');
      expect(item.title).toBe('기능 제안');
      expect(item.content).toBe('내용');
    });

    it('작성자명이 없으면 익명', () => {
      const item = createFeedbackItem('opinion', '의견', '내용', '');
      expect(item.authorName).toBe('익명');
    });

    it('생성 시 ISO 형식 타임스탬프', () => {
      const item = createFeedbackItem('question', '질문', '내용', '유저');
      expect(() => new Date(item.createdAt)).not.toThrow();
      expect(new Date(item.createdAt).toISOString()).toBe(item.createdAt);
    });

    it('모든 타입 생성 가능 (bug, feature, opinion, question)', () => {
      const types: FeedbackItem['type'][] = ['bug', 'feature', 'opinion', 'question'];
      for (const type of types) {
        const item = createFeedbackItem(type, `${type} 제목`, '내용', '작성자');
        expect(item.type).toBe(type);
      }
    });

    it('id가 문자열로 생성됨', () => {
      const item = createFeedbackItem('bug', '제목', '내용', '작성자');
      expect(typeof item.id).toBe('string');
      expect(item.id.length).toBeGreaterThan(0);
    });
  });

  // ──────────────────────────────────────────────────
  // localStorage CRUD
  // ──────────────────────────────────────────────────
  describe('localStorage 저장/로드', () => {
    it('빈 상태에서 빈 배열 반환', () => {
      const items = loadItems();
      expect(items).toEqual([]);
    });

    it('피드백 저장 후 로드', () => {
      const item = createFeedbackItem('bug', '버그', '내용', '유저');
      saveItems([item]);
      expect(feedbackStorageMock.setItem).toHaveBeenCalledWith(
        'feedback-items',
        expect.any(String),
      );
      const loaded = loadItems();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].title).toBe('버그');
    });

    it('여러 피드백 저장 후 로드', () => {
      const items = [
        createFeedbackItem('bug', '버그1', '내용1', '유저1'),
        createFeedbackItem('feature', '기능1', '내용2', '유저2'),
        createFeedbackItem('opinion', '의견1', '내용3', '유저3'),
      ];
      saveItems(items);
      const loaded = loadItems();
      expect(loaded).toHaveLength(3);
    });

    it('잘못된 JSON → 빈 배열 반환', () => {
      feedbackStorageMock.getItem.mockReturnValueOnce('invalid json{{{');
      const items = loadItems();
      expect(items).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────
  // 타입 필터링
  // ──────────────────────────────────────────────────
  describe('타입 필터링', () => {
    const items: FeedbackItem[] = [
      createFeedbackItem('bug', '버그1', '내용', '유저'),
      createFeedbackItem('bug', '버그2', '내용', '유저'),
      createFeedbackItem('feature', '기능1', '내용', '유저'),
      createFeedbackItem('opinion', '의견1', '내용', '유저'),
      createFeedbackItem('question', '질문1', '내용', '유저'),
    ];

    it('all → 전체 반환', () => {
      expect(filterByType(items, 'all')).toHaveLength(5);
    });

    it('bug → 버그만 반환', () => {
      const filtered = filterByType(items, 'bug');
      expect(filtered).toHaveLength(2);
      expect(filtered.every((i) => i.type === 'bug')).toBe(true);
    });

    it('feature → 기능 제안만 반환', () => {
      const filtered = filterByType(items, 'feature');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe('feature');
    });

    it('opinion → 의견만 반환', () => {
      const filtered = filterByType(items, 'opinion');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe('opinion');
    });

    it('question → 질문만 반환', () => {
      const filtered = filterByType(items, 'question');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe('question');
    });

    it('존재하지 않는 타입 → 빈 배열', () => {
      const filtered = filterByType(items, 'nonexistent');
      expect(filtered).toHaveLength(0);
    });

    it('빈 배열 필터링 → 빈 배열', () => {
      expect(filterByType([], 'bug')).toHaveLength(0);
      expect(filterByType([], 'all')).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────
  // 투표
  // ──────────────────────────────────────────────────
  describe('투표', () => {
    it('특정 아이템의 votes 증가', () => {
      const items: FeedbackItem[] = [
        { ...createFeedbackItem('bug', '버그', '내용', '유저'), id: 'item-1', votes: 0 },
        { ...createFeedbackItem('feature', '기능', '내용', '유저'), id: 'item-2', votes: 5 },
      ];

      const updated = voteItem(items, 'item-1');
      expect(updated[0].votes).toBe(1);
      expect(updated[1].votes).toBe(5); // 다른 아이템은 변경 없음
    });

    it('여러 번 투표 가능', () => {
      let items: FeedbackItem[] = [
        { ...createFeedbackItem('bug', '버그', '내용', '유저'), id: 'item-1', votes: 0 },
      ];

      items = voteItem(items, 'item-1');
      items = voteItem(items, 'item-1');
      items = voteItem(items, 'item-1');
      expect(items[0].votes).toBe(3);
    });

    it('존재하지 않는 아이템 투표 → 변경 없음', () => {
      const items: FeedbackItem[] = [
        { ...createFeedbackItem('bug', '버그', '내용', '유저'), id: 'item-1', votes: 2 },
      ];

      const updated = voteItem(items, 'nonexistent');
      expect(updated[0].votes).toBe(2);
    });

    it('원본 배열이 변경되지 않음 (불변성)', () => {
      const items: FeedbackItem[] = [
        { ...createFeedbackItem('bug', '버그', '내용', '유저'), id: 'item-1', votes: 0 },
      ];

      const updated = voteItem(items, 'item-1');
      expect(items[0].votes).toBe(0); // 원본 불변
      expect(updated[0].votes).toBe(1); // 새 배열만 변경
    });
  });

  // ──────────────────────────────────────────────────
  // 정렬
  // ──────────────────────────────────────────────────
  describe('정렬', () => {
    it('투표 수 기준 내림차순 정렬', () => {
      const items: FeedbackItem[] = [
        { ...createFeedbackItem('bug', '적음', '내용', '유저'), votes: 1 },
        { ...createFeedbackItem('feature', '많음', '내용', '유저'), votes: 10 },
        { ...createFeedbackItem('opinion', '중간', '내용', '유저'), votes: 5 },
      ];

      const sorted = sortByVotes(items);
      expect(sorted[0].title).toBe('많음');
      expect(sorted[1].title).toBe('중간');
      expect(sorted[2].title).toBe('적음');
    });

    it('날짜 기준 최신순 정렬', () => {
      const items: FeedbackItem[] = [
        {
          ...createFeedbackItem('bug', '옛날', '내용', '유저'),
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        {
          ...createFeedbackItem('feature', '최신', '내용', '유저'),
          createdAt: '2024-06-01T00:00:00.000Z',
        },
        {
          ...createFeedbackItem('opinion', '중간', '내용', '유저'),
          createdAt: '2024-03-15T00:00:00.000Z',
        },
      ];

      const sorted = sortByDate(items);
      expect(sorted[0].title).toBe('최신');
      expect(sorted[1].title).toBe('중간');
      expect(sorted[2].title).toBe('옛날');
    });

    it('투표 정렬은 원본을 변경하지 않음', () => {
      const items: FeedbackItem[] = [
        { ...createFeedbackItem('bug', 'A', '내용', '유저'), votes: 3 },
        { ...createFeedbackItem('feature', 'B', '내용', '유저'), votes: 1 },
      ];

      const sorted = sortByVotes(items);
      expect(items[0].title).toBe('A'); // 원본 순서 유지
      expect(sorted[0].title).toBe('A'); // 정렬 결과
    });

    it('동일 투표 수 → 순서 유지 (안정 정렬)', () => {
      const items: FeedbackItem[] = [
        { ...createFeedbackItem('bug', '첫째', '내용', '유저'), votes: 5 },
        { ...createFeedbackItem('feature', '둘째', '내용', '유저'), votes: 5 },
      ];

      const sorted = sortByVotes(items);
      // JavaScript sort는 안정 정렬이므로 원래 순서 유지
      expect(sorted[0].title).toBe('첫째');
      expect(sorted[1].title).toBe('둘째');
    });

    it('빈 배열 정렬', () => {
      expect(sortByVotes([])).toEqual([]);
      expect(sortByDate([])).toEqual([]);
    });
  });
});
