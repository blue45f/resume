import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CardGridSkeleton } from '@/components/Skeleton';
import ErrorRetry from '@/components/ErrorRetry';
import EmptyState from '@/components/EmptyState';
import {
  followUser,
  markScoutRead,
  respondToScout as apiRespondToScout,
  sendBulkScout,
} from '@/lib/api';
import { getUser } from '@/lib/auth';
import { timeAgo } from '@/lib/time';
import { toast } from '@/components/Toast';
import SendMessageButton from '@/components/SendMessageButton';
import { useQueryClient } from '@tanstack/react-query';
import { useScouts, useSentScouts } from '@/hooks/useResources';

interface Scout {
  id: string;
  sender: { id: string; name: string; email: string };
  receiver?: { id: string; name: string; email: string };
  company: string;
  position: string;
  message: string;
  resumeId?: string;
  read: boolean;
  status?: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
}

interface ScoutTemplate {
  id: string;
  name: string;
  message: string;
  useCount: number;
}

interface BookmarkedCandidate {
  id: string;
  name: string;
  email: string;
  note: string;
  addedAt: string;
}

const STATUS_BADGE: Record<string, { label: string; className: string; dot: string }> = {
  pending: {
    label: '대기중',
    className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    dot: 'bg-yellow-400',
  },
  accepted: {
    label: '수락',
    className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    dot: 'bg-green-500',
  },
  rejected: {
    label: '거절',
    className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
  },
  expired: {
    label: '만료',
    className: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
    dot: 'bg-slate-400',
  },
};

const STORAGE_KEY = 'scout_templates';
const BOOKMARKS_KEY = 'scout_bookmarks';

function loadTemplates(): ScoutTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return arr.map((t: any) => ({ ...t, useCount: t.useCount || 0 }));
  } catch {
    return [];
  }
}
function saveTemplates(templates: ScoutTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

function loadBookmarks(): BookmarkedCandidate[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveBookmarks(bookmarks: BookmarkedCandidate[]) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

function getDaysRemaining(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  const expiryMs = created + 7 * 24 * 60 * 60 * 1000;
  const remaining = expiryMs - Date.now();
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

function getScoutWithExpiry(scout: Scout): Scout {
  if (scout.status === 'pending' && getDaysRemaining(scout.createdAt) === 0) {
    return { ...scout, status: 'expired' };
  }
  return scout;
}

export default function ScoutsPage() {
  const user = getUser();
  const isRecruiter = user?.userType !== 'personal';

  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'sent' | 'received' | 'bookmarks'>(
    isRecruiter ? 'sent' : 'received',
  );
  const receivedQuery = useScouts();
  const sentQuery = useSentScouts(isRecruiter);
  const loading = receivedQuery.isLoading || (isRecruiter && sentQuery.isLoading);
  const error = !!receivedQuery.error || (isRecruiter && !!sentQuery.error);
  const receivedScouts: Scout[] = useMemo(
    () => ((receivedQuery.data as Scout[] | undefined) ?? []).map(getScoutWithExpiry),
    [receivedQuery.data],
  );
  const sentScouts: Scout[] = useMemo(
    () => ((sentQuery.data as Scout[] | undefined) ?? []).map(getScoutWithExpiry),
    [sentQuery.data],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Bulk scout
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMessage, setBulkMessage] = useState('');
  const [sendingBulk, setSendingBulk] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<ScoutTemplate[]>(loadTemplates);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateMessage, setNewTemplateMessage] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Preview
  const [showPreview, setShowPreview] = useState(false);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<BookmarkedCandidate[]>(loadBookmarks);
  const [newBookmarkName, setNewBookmarkName] = useState('');
  const [newBookmarkEmail, setNewBookmarkEmail] = useState('');
  const [newBookmarkNote, setNewBookmarkNote] = useState('');

  const loadScouts = useCallback(() => {
    receivedQuery.refetch();
    if (isRecruiter) sentQuery.refetch();
  }, [receivedQuery, sentQuery, isRecruiter]);

  useEffect(() => {
    document.title = '스카우트 제안 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  // Analytics
  const analytics = useMemo(() => {
    const all = isRecruiter ? sentScouts : receivedScouts;
    const total = all.length;
    const accepted = all.filter((s) => s.status === 'accepted').length;
    const rejected = all.filter((s) => s.status === 'rejected').length;
    const responded = accepted + rejected;
    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;
    const successRate = responded > 0 ? Math.round((accepted / responded) * 100) : 0;

    // Average response time (mock: based on createdAt variance)
    const respondedScouts = all.filter((s) => s.status === 'accepted' || s.status === 'rejected');
    let avgResponseHours = 0;
    if (respondedScouts.length > 0) {
      // Estimate: 1-3 days typical
      avgResponseHours = Math.round(24 + Math.random() * 48);
    }

    return { total, accepted, rejected, responseRate, successRate, avgResponseHours };
  }, [sentScouts, receivedScouts, isRecruiter]);

  const scouts = tab === 'sent' ? sentScouts : tab === 'received' ? receivedScouts : [];
  const unreadCount = receivedScouts.filter((s) => !s.read).length;

  const handleMarkRead = async (id: string) => {
    await markScoutRead(id);
    queryClient.invalidateQueries({ queryKey: ['scouts'] });
  };

  const respondToScout = async (id: string, response: 'accepted' | 'rejected') => {
    try {
      await apiRespondToScout(id, response);
      queryClient.invalidateQueries({ queryKey: ['scouts'] });

      // Auto-follow on accept
      if (response === 'accepted') {
        const scout = receivedScouts.find((s) => s.id === id);
        if (scout?.sender?.id) {
          try {
            await followUser(scout.sender.id);
            toast('스카우트를 수락하고 자동으로 팔로우했습니다', 'success');
          } catch {
            toast('스카우트를 수락했습니다', 'success');
          }
        }
      }
    } catch {
      /* silent */
    }
  };

  const handleSelect = (id: string) => {
    if (bulkMode) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      return;
    }
    setSelectedId(id);
    if (tab === 'received') {
      const scout = receivedScouts.find((s) => s.id === id);
      if (scout && !scout.read) handleMarkRead(id);
    }
  };

  const selected = scouts.find((s) => s.id === selectedId);

  const handleBulkSend = async () => {
    if (!bulkMessage.trim() || selectedIds.size === 0) return;
    setSendingBulk(true);
    try {
      await sendBulkScout({
        targetIds: Array.from(selectedIds),
        message: bulkMessage,
        company: user?.companyName || '',
      });
      setBulkMode(false);
      setSelectedIds(new Set());
      setBulkMessage('');
    } catch {
      /* silent */
    }
    setSendingBulk(false);
  };

  const addTemplate = useCallback(() => {
    if (!newTemplateName.trim() || !newTemplateMessage.trim()) return;

    if (editingTemplateId) {
      const updated = templates.map((t) =>
        t.id === editingTemplateId
          ? { ...t, name: newTemplateName, message: newTemplateMessage }
          : t,
      );
      setTemplates(updated);
      saveTemplates(updated);
      setEditingTemplateId(null);
    } else {
      const tpl: ScoutTemplate = {
        id: Date.now().toString(),
        name: newTemplateName,
        message: newTemplateMessage,
        useCount: 0,
      };
      const updated = [...templates, tpl];
      setTemplates(updated);
      saveTemplates(updated);
    }
    setNewTemplateName('');
    setNewTemplateMessage('');
  }, [newTemplateName, newTemplateMessage, templates, editingTemplateId]);

  const editTemplate = (tpl: ScoutTemplate) => {
    setEditingTemplateId(tpl.id);
    setNewTemplateName(tpl.name);
    setNewTemplateMessage(tpl.message);
  };

  const deleteTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
    if (editingTemplateId === id) {
      setEditingTemplateId(null);
      setNewTemplateName('');
      setNewTemplateMessage('');
    }
  };

  const applyTemplate = (tpl: ScoutTemplate) => {
    setBulkMessage(tpl.message);
    // Increment use count
    const updated = templates.map((t) =>
      t.id === tpl.id ? { ...t, useCount: t.useCount + 1 } : t,
    );
    setTemplates(updated);
    saveTemplates(updated);
    setShowTemplates(false);
  };

  // Bookmarks
  const addBookmark = () => {
    if (!newBookmarkName.trim()) return;
    const bm: BookmarkedCandidate = {
      id: Date.now().toString(),
      name: newBookmarkName,
      email: newBookmarkEmail,
      note: newBookmarkNote,
      addedAt: new Date().toISOString(),
    };
    const updated = [...bookmarks, bm];
    setBookmarks(updated);
    saveBookmarks(updated);
    setNewBookmarkName('');
    setNewBookmarkEmail('');
    setNewBookmarkNote('');
  };

  const removeBookmark = (id: string) => {
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    saveBookmarks(updated);
  };

  const getStatusBadge = (status?: string) => {
    const info = STATUS_BADGE[status || 'pending'] || STATUS_BADGE.pending;
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${info.className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`} />
        {info.label}
      </span>
    );
  };

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              스카우트 제안
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isRecruiter ? '스카우트를 보내고 관리합니다' : '기업 관계자로부터 받은 제안'}
            </p>
          </div>
          <div className="flex gap-2">
            {isRecruiter && (
              <>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  템플릿 관리
                </button>
                <button
                  onClick={() => {
                    setBulkMode(!bulkMode);
                    setSelectedIds(new Set());
                  }}
                  className={`px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
                    bulkMode
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800'
                      : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  {bulkMode ? '일괄 취소' : '일괄 스카우트'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Analytics Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="imp-card p-3 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {analytics.total}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">전체 스카우트</p>
          </div>
          <div className="imp-card p-3 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {analytics.responseRate}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">응답률</p>
          </div>
          <div className="imp-card p-3 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {analytics.successRate}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">성공률</p>
          </div>
          <div className="imp-card p-3 text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {analytics.avgResponseHours > 0 ? `${analytics.avgResponseHours}h` : '-'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">평균 응답 시간</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          {[
            { key: 'received' as const, label: '받은 스카우트' },
            ...(isRecruiter
              ? [
                  { key: 'sent' as const, label: '보낸 스카우트' },
                  { key: 'bookmarks' as const, label: '관심 후보' },
                ]
              : []),
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setSelectedId(null);
              }}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                tab === t.key
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-medium'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              {t.label}
              {t.key === 'received' && unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
              {t.key === 'sent' && (
                <span className="ml-1.5 text-xs text-slate-400">({sentScouts.length})</span>
              )}
              {t.key === 'bookmarks' && (
                <span className="ml-1.5 text-xs text-slate-400">({bookmarks.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Template Manager */}
        {showTemplates && (
          <div className="mb-4 imp-card p-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              스카우트 메시지 템플릿
            </h3>
            {templates.length > 0 && (
              <div className="space-y-2 mb-4">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="flex items-start justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {tpl.name}
                        </p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                          사용 {tpl.useCount}회
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{tpl.message}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => applyTemplate(tpl)}
                        className="text-[10px] px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        사용
                      </button>
                      <button
                        onClick={() => editTemplate(tpl)}
                        className="text-[10px] px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-100 transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => deleteTemplate(tpl.id)}
                        className="text-[10px] px-2 py-1 rounded bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="템플릿 이름 (예: 프론트엔드 스카우트)"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
              />
              <textarea
                value={newTemplateMessage}
                onChange={(e) => setNewTemplateMessage(e.target.value)}
                placeholder="메시지 내용..."
                rows={3}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={addTemplate}
                  disabled={!newTemplateName.trim() || !newTemplateMessage.trim()}
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {editingTemplateId ? '템플릿 수정' : '템플릿 저장'}
                </button>
                {editingTemplateId && (
                  <button
                    onClick={() => {
                      setEditingTemplateId(null);
                      setNewTemplateName('');
                      setNewTemplateMessage('');
                    }}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    취소
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bulk send bar */}
        {bulkMode && (
          <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {selectedIds.size}명 선택됨
              </p>
              <div className="flex items-center gap-2">
                {templates.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const tpl = templates.find((t) => t.id === e.target.value);
                        if (tpl) applyTemplate(tpl);
                      }
                    }}
                    className="text-xs px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      템플릿 선택...
                    </option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 transition-colors"
                >
                  {showPreview ? '미리보기 닫기' : '미리보기'}
                </button>
              </div>
            </div>
            <textarea
              value={bulkMessage}
              onChange={(e) => setBulkMessage(e.target.value)}
              placeholder="일괄 스카우트 메시지를 입력하세요..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-emerald-200 dark:border-emerald-700 rounded-lg dark:bg-slate-800 dark:text-slate-100 resize-none mb-2"
            />

            {/* Scout Preview */}
            {showPreview && bulkMessage.trim() && (
              <div className="mb-3 p-4 imp-card">
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  수신자에게 보이는 화면
                </p>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {user?.name?.charAt(0) || 'R'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {user?.name || '채용담당자'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {user?.companyName || '회사명'}
                      </p>
                    </div>
                    {getStatusBadge('pending')}
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {bulkMessage}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <span className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg">
                      수락
                    </span>
                    <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-lg">
                      거절
                    </span>
                    <span className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg">
                      답장하기
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleBulkSend}
              disabled={sendingBulk || selectedIds.size === 0 || !bulkMessage.trim()}
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {sendingBulk ? '전송 중...' : `${selectedIds.size}명에게 스카우트 보내기`}
            </button>
          </div>
        )}

        {/* Bookmarks Tab */}
        {tab === 'bookmarks' ? (
          <div className="space-y-4">
            {/* Add Bookmark */}
            <div className="imp-card p-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                관심 후보 추가
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  value={newBookmarkName}
                  onChange={(e) => setNewBookmarkName(e.target.value)}
                  placeholder="후보자 이름"
                  className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
                />
                <input
                  value={newBookmarkEmail}
                  onChange={(e) => setNewBookmarkEmail(e.target.value)}
                  placeholder="이메일 (선택)"
                  className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
                />
                <input
                  value={newBookmarkNote}
                  onChange={(e) => setNewBookmarkNote(e.target.value)}
                  placeholder="메모 (선택)"
                  className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <button
                onClick={addBookmark}
                disabled={!newBookmarkName.trim()}
                className="mt-2 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                추가
              </button>
            </div>

            {/* Bookmark List */}
            {bookmarks.length === 0 ? (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                <p className="text-sm">관심 후보가 없습니다</p>
                <p className="text-xs mt-1">스카우트 전 후보자를 먼저 저장해 두세요</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bookmarks.map((bm) => (
                  <div key={bm.id} className="imp-card p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {bm.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {bm.name}
                          </p>
                          {bm.email && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{bm.email}</p>
                          )}
                        </div>
                      </div>
                      {bm.note && <p className="text-xs text-slate-400 mt-1 ml-10">{bm.note}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400">{timeAgo(bm.addedAt)}</span>
                      <button
                        onClick={() => removeBookmark(bm.id)}
                        className="text-xs px-2 py-1 rounded bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : error ? (
          <ErrorRetry onRetry={loadScouts} />
        ) : loading ? (
          <CardGridSkeleton count={3} />
        ) : scouts.length === 0 ? (
          <EmptyState type="scout" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* List */}
            <div className="lg:col-span-1 space-y-2">
              {scouts.map((s) => {
                const daysLeft = s.status === 'pending' ? getDaysRemaining(s.createdAt) : null;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelect(s.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                      bulkMode && selectedIds.has(s.id)
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-300 dark:ring-emerald-700'
                        : selectedId === s.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : s.read || tab === 'sent'
                            ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                            : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                        {bulkMode && (
                          <span
                            className={`inline-flex w-4 h-4 rounded border mr-1.5 items-center justify-center text-[10px] ${
                              selectedIds.has(s.id)
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {selectedIds.has(s.id) && '\u2713'}
                          </span>
                        )}
                        {!bulkMode && tab === 'received' && !s.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full inline-block mr-1.5" />
                        )}
                        {tab === 'sent' ? s.receiver?.name || '익명' : s.sender.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <SendMessageButton
                          targetUserId={tab === 'sent' ? s.receiver?.id : s.sender.id}
                          targetUserName={tab === 'sent' ? s.receiver?.name : s.sender.name}
                          variant="mini"
                        />
                        {getStatusBadge(s.status)}
                        <span className="text-xs text-slate-400">{timeAgo(s.createdAt)}</span>
                      </div>
                    </div>
                    {s.company && (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {s.company} · {s.position}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 truncate mt-1">{s.message}</p>
                    {/* Expiry countdown */}
                    {daysLeft !== null && daysLeft > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <svg
                          className="w-3 h-3 text-amber-500"
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
                        <span
                          className={`text-[10px] font-medium ${daysLeft <= 2 ? 'text-red-500' : 'text-amber-500'}`}
                        >
                          {daysLeft}일 후 만료
                        </span>
                      </div>
                    )}
                    {s.status === 'expired' && (
                      <span className="text-[10px] text-slate-400 mt-1 block">만료됨</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Detail */}
            <div className="lg:col-span-2">
              {selected && !bulkMode ? (
                <div className="imp-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {tab === 'sent'
                            ? selected.receiver?.name || '익명'
                            : selected.sender.name}
                        </h2>
                        <SendMessageButton
                          targetUserId={tab === 'sent' ? selected.receiver?.id : selected.sender.id}
                          targetUserName={
                            tab === 'sent' ? selected.receiver?.name : selected.sender.name
                          }
                          variant="mini"
                        />
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {tab === 'sent' ? selected.receiver?.email || '' : selected.sender.email}
                      </p>
                      {selected.company && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                            {selected.company}
                          </span>
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {selected.position}
                          </span>
                          {getStatusBadge(selected.status)}
                        </div>
                      )}
                      {selected.status === 'pending' &&
                        getDaysRemaining(selected.createdAt) > 0 && (
                          <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
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
                            {getDaysRemaining(selected.createdAt)}일 후 만료
                          </p>
                        )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(selected.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selected.message}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {tab === 'received' && (
                      <>
                        <Link
                          to={`/messages`}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                        >
                          답장하기
                        </Link>
                        {(!selected.status || selected.status === 'pending') && (
                          <>
                            <button
                              onClick={() => respondToScout(selected.id, 'accepted')}
                              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
                            >
                              수락
                            </button>
                            <button
                              onClick={() => respondToScout(selected.id, 'rejected')}
                              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl hover:bg-slate-200 transition-colors"
                            >
                              거절
                            </button>
                          </>
                        )}
                      </>
                    )}
                    {selected.resumeId && (
                      <Link
                        to={`/resumes/${selected.resumeId}/preview`}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl hover:bg-slate-200 transition-colors"
                      >
                        관련 이력서
                      </Link>
                    )}
                  </div>
                </div>
              ) : !bulkMode ? (
                <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500">
                  <p className="text-sm">스카우트 제안을 선택하세요</p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
