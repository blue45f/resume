import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CardGridSkeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import { fetchScouts } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { timeAgo } from '@/lib/time';
import { API_URL } from '@/lib/config';


interface Scout {
  id: string;
  sender: { id: string; name: string; email: string };
  receiver?: { id: string; name: string; email: string };
  company: string;
  position: string;
  message: string;
  resumeId?: string;
  read: boolean;
  status?: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface ScoutTemplate {
  id: string;
  name: string;
  message: string;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: '대기중', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
  accepted: { label: '수락', className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  rejected: { label: '거절', className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
};

const STORAGE_KEY = 'scout_templates';

function loadTemplates(): ScoutTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveTemplates(templates: ScoutTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export default function ScoutsPage() {
  const user = getUser();
  const isRecruiter = user?.userType !== 'personal';

  const [tab, setTab] = useState<'sent' | 'received'>(isRecruiter ? 'sent' : 'received');
  const [sentScouts, setSentScouts] = useState<Scout[]>([]);
  const [receivedScouts, setReceivedScouts] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    document.title = '스카우트 제안 — 이력서공방';
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` as string };

    Promise.all([
      fetchScouts().catch(() => []),
      isRecruiter
        ? fetch(`${API_URL}/api/social/scouts/sent`, { headers }).then(r => r.ok ? r.json() : []).catch(() => [])
        : Promise.resolve([]),
    ])
      .then(([received, sent]) => {
        setReceivedScouts(received);
        setSentScouts(sent);
      })
      .finally(() => setLoading(false));

    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  const scouts = tab === 'sent' ? sentScouts : receivedScouts;
  const unreadCount = receivedScouts.filter(s => !s.read).length;

  const markRead = async (id: string) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/api/social/scouts/${id}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    setReceivedScouts(prev => prev.map(s => s.id === id ? { ...s, read: true } : s));
  };

  const respondToScout = async (id: string, response: 'accepted' | 'rejected') => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/api/social/scouts/${id}/respond`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: response }),
      });
      setReceivedScouts(prev => prev.map(s => s.id === id ? { ...s, status: response } : s));
    } catch { /* silent */ }
  };

  const handleSelect = (id: string) => {
    if (bulkMode) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
      return;
    }
    setSelectedId(id);
    if (tab === 'received') {
      const scout = receivedScouts.find(s => s.id === id);
      if (scout && !scout.read) markRead(id);
    }
  };

  const selected = scouts.find(s => s.id === selectedId);

  const handleBulkSend = async () => {
    if (!bulkMessage.trim() || selectedIds.size === 0) return;
    setSendingBulk(true);
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/api/social/scouts/bulk`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetIds: Array.from(selectedIds),
          message: bulkMessage,
          company: user?.companyName || '',
        }),
      });
      setBulkMode(false);
      setSelectedIds(new Set());
      setBulkMessage('');
    } catch { /* silent */ }
    setSendingBulk(false);
  };

  const addTemplate = useCallback(() => {
    if (!newTemplateName.trim() || !newTemplateMessage.trim()) return;
    const tpl: ScoutTemplate = { id: Date.now().toString(), name: newTemplateName, message: newTemplateMessage };
    const updated = [...templates, tpl];
    setTemplates(updated);
    saveTemplates(updated);
    setNewTemplateName('');
    setNewTemplateMessage('');
  }, [newTemplateName, newTemplateMessage, templates]);

  const deleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
  };

  const applyTemplate = (message: string) => {
    setBulkMessage(message);
    setShowTemplates(false);
  };

  const getStatusBadge = (status?: string) => {
    const info = STATUS_BADGE[status || 'pending'] || STATUS_BADGE.pending;
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${info.className}`}>
        {info.label}
      </span>
    );
  };

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              스카우트 제안
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">{unreadCount}</span>
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
                  onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }}
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

        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          {([
            { key: 'received' as const, label: '받은 스카우트' },
            ...(isRecruiter ? [{ key: 'sent' as const, label: '보낸 스카우트' }] : []),
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelectedId(null); }}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                tab === t.key
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-medium'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              {t.label}
              {t.key === 'received' && unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full">{unreadCount}</span>
              )}
              {t.key === 'sent' && <span className="ml-1.5 text-xs text-slate-400">({sentScouts.length})</span>}
            </button>
          ))}
        </div>

        {/* Template Manager */}
        {showTemplates && (
          <div className="mb-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">스카우트 메시지 템플릿</h3>
            {templates.length > 0 && (
              <div className="space-y-2 mb-4">
                {templates.map(tpl => (
                  <div key={tpl.id} className="flex items-start justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{tpl.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{tpl.message}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => applyTemplate(tpl.message)} className="text-[10px] px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 transition-colors">
                        사용
                      </button>
                      <button onClick={() => deleteTemplate(tpl.id)} className="text-[10px] px-2 py-1 rounded bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 transition-colors">
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
                onChange={e => setNewTemplateName(e.target.value)}
                placeholder="템플릿 이름 (예: 프론트엔드 스카우트)"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100"
              />
              <textarea
                value={newTemplateMessage}
                onChange={e => setNewTemplateMessage(e.target.value)}
                placeholder="메시지 내용..."
                rows={3}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 resize-none"
              />
              <button
                onClick={addTemplate}
                disabled={!newTemplateName.trim() || !newTemplateMessage.trim()}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                템플릿 저장
              </button>
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
              {templates.length > 0 && (
                <select
                  onChange={e => { if (e.target.value) applyTemplate(e.target.value); }}
                  className="text-xs px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  defaultValue=""
                >
                  <option value="" disabled>템플릿 선택...</option>
                  {templates.map(t => <option key={t.id} value={t.message}>{t.name}</option>)}
                </select>
              )}
            </div>
            <textarea
              value={bulkMessage}
              onChange={e => setBulkMessage(e.target.value)}
              placeholder="일괄 스카우트 메시지를 입력하세요..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-emerald-200 dark:border-emerald-700 rounded-lg dark:bg-slate-800 dark:text-slate-100 resize-none mb-2"
            />
            <button
              onClick={handleBulkSend}
              disabled={sendingBulk || selectedIds.size === 0 || !bulkMessage.trim()}
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {sendingBulk ? '전송 중...' : `${selectedIds.size}명에게 스카우트 보내기`}
            </button>
          </div>
        )}

        {loading ? (
          <CardGridSkeleton count={3} />
        ) : scouts.length === 0 ? (
          <EmptyState type="scout" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* List */}
            <div className="lg:col-span-1 space-y-2">
              {scouts.map(s => (
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
                        <span className={`inline-flex w-4 h-4 rounded border mr-1.5 items-center justify-center text-[10px] ${
                          selectedIds.has(s.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {selectedIds.has(s.id) && '\u2713'}
                        </span>
                      )}
                      {!bulkMode && tab === 'received' && !s.read && <span className="w-2 h-2 bg-blue-500 rounded-full inline-block mr-1.5" />}
                      {tab === 'sent' ? (s.receiver?.name || '익명') : s.sender.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {getStatusBadge(s.status)}
                      <span className="text-xs text-slate-400">{timeAgo(s.createdAt)}</span>
                    </div>
                  </div>
                  {s.company && <p className="text-xs text-slate-600 dark:text-slate-400">{s.company} · {s.position}</p>}
                  <p className="text-xs text-slate-400 truncate mt-1">{s.message}</p>
                </button>
              ))}
            </div>

            {/* Detail */}
            <div className="lg:col-span-2">
              {selected && !bulkMode ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {tab === 'sent' ? (selected.receiver?.name || '익명') : selected.sender.name}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {tab === 'sent' ? (selected.receiver?.email || '') : selected.sender.email}
                      </p>
                      {selected.company && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">{selected.company}</span>
                          <span className="text-sm text-slate-600 dark:text-slate-400">{selected.position}</span>
                          {getStatusBadge(selected.status)}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{new Date(selected.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
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
