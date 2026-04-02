import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fetchScouts } from '@/lib/api';
import { timeAgo } from '@/lib/time';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Scout {
  id: string;
  sender: { id: string; name: string; email: string };
  company: string;
  position: string;
  message: string;
  resumeId?: string;
  read: boolean;
  createdAt: string;
}

export default function ScoutsPage() {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    document.title = '스카우트 제안 — 이력서공방';
    fetchScouts()
      .then(setScouts)
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  const markRead = async (id: string) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_URL}/api/social/scouts/${id}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    setScouts(prev => prev.map(s => s.id === id ? { ...s, read: true } : s));
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const scout = scouts.find(s => s.id === id);
    if (scout && !scout.read) markRead(id);
  };

  const selected = scouts.find(s => s.id === selectedId);
  const unreadCount = scouts.filter(s => !s.read).length;

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
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">기업 관계자로부터 받은 제안</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">불러오는 중...</div>
        ) : scouts.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-500 dark:text-slate-400 mb-2">아직 스카우트 제안이 없습니다</p>
            <p className="text-xs text-slate-400">이력서를 공개하면 기업 관계자가 제안을 보낼 수 있습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* List */}
            <div className="lg:col-span-1 space-y-2">
              {scouts.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                    selectedId === s.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : s.read
                        ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                      {!s.read && <span className="w-2 h-2 bg-blue-500 rounded-full inline-block mr-1.5" />}
                      {s.sender.name}
                    </span>
                    <span className="text-xs text-slate-400 shrink-0 ml-2">{timeAgo(s.createdAt)}</span>
                  </div>
                  {s.company && <p className="text-xs text-slate-600 dark:text-slate-400">{s.company} · {s.position}</p>}
                  <p className="text-xs text-slate-400 truncate mt-1">{s.message}</p>
                </button>
              ))}
            </div>

            {/* Detail */}
            <div className="lg:col-span-2">
              {selected ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{selected.sender.name}</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{selected.sender.email}</p>
                      {selected.company && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">{selected.company}</span>
                          <span className="text-sm text-slate-600 dark:text-slate-400">{selected.position}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{new Date(selected.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link
                      to={`/messages`}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      답장하기
                    </Link>
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
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500">
                  <p className="text-sm">스카우트 제안을 선택하세요</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
