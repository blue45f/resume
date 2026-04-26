import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as RadixDialog from '@radix-ui/react-dialog';
import { ROUTES } from '@/lib/routes';
import { getUser } from '@/lib/auth';
import { setTheme, getTheme } from '@/lib/theme';

interface Command {
  id: string;
  label: string;
  hint?: string;
  keywords: string;
  icon: string;
  run: () => void;
  section: '탐색' | '액션' | '설정' | '관리자';
}

/**
 * CommandPalette — ⌘K (Mac) / Ctrl+K (Win) 로 열리는 글로벌 액션 팔레트.
 * Notion/Linear/Raycast 스타일. 검색어로 필터링, 화살표 키로 탐색, Enter 실행.
 * 국내 경쟁 이력서 서비스에 없는 파워유저 기능.
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);

  // 전역 단축키 등록
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (isCmdK) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, []);

  const commands = useMemo<Command[]>(() => {
    const user = getUser();
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const run = (path: string) => () => {
      navigate(path);
      close();
    };

    const base: Command[] = [
      {
        id: 'home',
        label: '홈',
        hint: '대시보드로 이동',
        keywords: '홈 home dashboard',
        icon: '🏠',
        run: run(ROUTES.home),
        section: '탐색',
      },
      {
        id: 'new-resume',
        label: '새 이력서 작성',
        hint: '템플릿 선택 후 시작',
        keywords: '새 이력서 new resume create 작성',
        icon: '📝',
        run: run(ROUTES.resume.new),
        section: '액션',
      },
      {
        id: 'auto-generate',
        label: 'AI 자동 생성',
        hint: '텍스트 붙여넣기로 이력서 완성',
        keywords: 'ai 자동 생성 auto-generate 자동화',
        icon: '🤖',
        run: run(ROUTES.resume.autoGenerate),
        section: '액션',
      },
      {
        id: 'explore',
        label: '이력서 탐색',
        hint: '공개 이력서 둘러보기',
        keywords: '탐색 explore 이력서 browse',
        icon: '🔎',
        run: run(ROUTES.resume.explore),
        section: '탐색',
      },
      {
        id: 'jobs',
        label: '채용공고',
        hint: '열린 공고 보기',
        keywords: '채용 공고 jobs 일자리',
        icon: '💼',
        run: run(ROUTES.jobs.list),
        section: '탐색',
      },
      {
        id: 'applications',
        label: '지원 현황',
        hint: '내가 지원한 공고',
        keywords: '지원 현황 applications 지원서',
        icon: '📋',
        run: run(ROUTES.jobs.applications),
        section: '탐색',
      },
      {
        id: 'interview-prep',
        label: '면접 준비',
        hint: 'AI 면접 질문 풀기',
        keywords: '면접 준비 interview 프랩',
        icon: '🎙️',
        run: run(ROUTES.interview.prep),
        section: '탐색',
      },
      {
        id: 'study-groups',
        label: '면접 스터디',
        hint: '기업별 스터디 그룹',
        keywords: '스터디 group 그룹 study 면접',
        icon: '👥',
        run: run(ROUTES.interview.studyGroups),
        section: '탐색',
      },
      {
        id: 'coaches',
        label: '코치 찾기',
        hint: '1:1 코칭 예약',
        keywords: '코치 coach 코칭 컨설팅',
        icon: '🎓',
        run: run(ROUTES.coaching.coaches),
        section: '탐색',
      },
      {
        id: 'community',
        label: '커뮤니티',
        hint: '게시판 · 질문 · 후기',
        keywords: '커뮤니티 community 게시글 글',
        icon: '💬',
        run: run(ROUTES.community.list),
        section: '탐색',
      },
      {
        id: 'bookmarks',
        label: '북마크',
        hint: '저장한 이력서',
        keywords: '북마크 bookmarks 저장',
        icon: '🔖',
        run: run(ROUTES.resume.bookmarks),
        section: '탐색',
      },
      {
        id: 'settings',
        label: '설정',
        hint: '프로필 · 구독 · 알림',
        keywords: '설정 settings 프로필 profile',
        icon: '⚙️',
        run: run(ROUTES.settings),
        section: '설정',
      },
      {
        id: 'toggle-theme',
        label: '다크/라이트 모드 전환',
        hint: getTheme() === 'dark' ? '라이트로' : '다크로',
        keywords: '테마 다크 라이트 theme dark light mode',
        icon: getTheme() === 'dark' ? '☀️' : '🌙',
        run: () => {
          setTheme(getTheme() === 'dark' ? 'light' : 'dark');
          close();
        },
        section: '설정',
      },
    ];

    if (isAdmin) {
      base.push({
        id: 'admin',
        label: '관리자 대시보드',
        keywords: '관리자 admin 어드민',
        icon: '🛡️',
        run: run(ROUTES.admin.root),
        section: '관리자',
      });
    }

    return base;
  }, [navigate, close]);

  // 검색 필터링
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.keywords.toLowerCase().includes(q) ||
        (c.hint || '').toLowerCase().includes(q),
    );
  }, [query, commands]);

  // 섹션별 그룹
  const grouped = useMemo(() => {
    const sections = new Map<string, Command[]>();
    for (const c of filtered) {
      const arr = sections.get(c.section) || [];
      arr.push(c);
      sections.set(c.section, arr);
    }
    return Array.from(sections.entries());
  }, [filtered]);

  // activeIndex 경계 유지
  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(Math.max(0, filtered.length - 1));
  }, [filtered.length, activeIndex]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filtered[activeIndex]?.run();
    }
  };

  return (
    <RadixDialog.Root open={open} onOpenChange={setOpen}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          className="fixed inset-0 z-[200] bg-neutral-950/50
                     data-[state=open]:animate-in data-[state=open]:fade-in-0
                     data-[state=closed]:animate-out data-[state=closed]:fade-out-0
                     motion-reduce:animate-none"
        />
        <RadixDialog.Content
          className="fixed z-[201] left-1/2 top-[20%] -translate-x-1/2
                     w-[calc(100%-2rem)] max-w-xl
                     bg-white dark:bg-slate-900 rounded-xl
                     shadow-2xl border border-slate-200 dark:border-slate-700
                     overflow-hidden
                     data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.96]
                     data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.96]
                     motion-reduce:animate-none"
          onKeyDown={onKeyDown}
        >
          <RadixDialog.Title className="sr-only">명령 팔레트</RadixDialog.Title>
          <RadixDialog.Description className="sr-only">
            검색어로 페이지와 액션을 빠르게 실행
          </RadixDialog.Description>

          {/* 검색 입력 */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <svg
              className="w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              placeholder="어디로 갈까요? 무엇을 할까요?"
              className="flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          </div>

          {/* 액션 리스트 */}
          <div ref={listRef} className="max-h-[60dvh] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                일치하는 액션이 없습니다
              </div>
            ) : (
              grouped.map(([section, items]) => (
                <div key={section} className="mb-2 last:mb-0">
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {section}
                  </div>
                  {items.map((cmd) => {
                    const idx = filtered.indexOf(cmd);
                    const active = idx === activeIndex;
                    return (
                      <button
                        key={cmd.id}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => cmd.run()}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          active
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-lg shrink-0" aria-hidden="true">
                          {cmd.icon}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{cmd.label}</span>
                          {cmd.hint && (
                            <span className="ml-2 text-[11px] text-slate-500 dark:text-slate-400">
                              {cmd.hint}
                            </span>
                          )}
                        </span>
                        {active && (
                          <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                            ↵
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* 하단 힌트 */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="px-1 py-px bg-slate-100 dark:bg-slate-800 rounded">↑↓</kbd> 탐색
              </span>
              <span>
                <kbd className="px-1 py-px bg-slate-100 dark:bg-slate-800 rounded">↵</kbd> 실행
              </span>
            </div>
            <span>
              <kbd className="px-1 py-px bg-slate-100 dark:bg-slate-800 rounded">⌘K</kbd> 토글
            </span>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
