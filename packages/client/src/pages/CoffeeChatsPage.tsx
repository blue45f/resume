import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fetchCoffeeChats, respondCoffeeChat, cancelCoffeeChat, type CoffeeChat } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { toast } from '@/components/Toast';
import { timeAgo } from '@/lib/time';

type Tab = 'received' | 'sent';

const STATUS_BADGE: Record<CoffeeChat['status'], { label: string; cls: string }> = {
  pending: {
    label: '대기',
    cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  },
  accepted: {
    label: '수락됨',
    cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  },
  rejected: {
    label: '거절됨',
    cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
  },
  completed: {
    label: '완료',
    cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  },
  cancelled: {
    label: '취소됨',
    cls: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
  },
};

const MODALITY_ICON = { video: '📹', voice: '🎙️', chat: '💬' };

export default function CoffeeChatsPage() {
  const navigate = useNavigate();
  const me = getUser();
  const [tab, setTab] = useState<Tab>('received');
  const [chats, setChats] = useState<CoffeeChat[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchCoffeeChats(tab)
      .then(setChats)
      .catch((e) => toast(e instanceof Error ? e.message : '불러오기 실패', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = '커피챗 — 이력서공방';
    load();
    return () => {
      document.title = '이력서공방';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleRespond = async (id: string, decision: 'accepted' | 'rejected') => {
    try {
      await respondCoffeeChat(id, decision);
      toast(decision === 'accepted' ? '수락했습니다' : '거절했습니다', 'success');
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : '실패', 'error');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('이 신청을 취소할까요?')) return;
    try {
      await cancelCoffeeChat(id);
      toast('취소했습니다', 'success');
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : '실패', 'error');
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="heading-accent text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
          ☕ 커피챗
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          1:1 만남으로 커리어 조언 / 이직 상담 / 멘토링. 음성/화상은 P2P 직접 연결.
        </p>

        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-5 max-w-xs">
          {(['received', 'sent'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === t
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {t === 'received' ? '받은 신청' : '보낸 신청'}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-sm text-slate-500 py-12">불러오는 중...</p>
        ) : chats.length === 0 ? (
          <div className="text-center py-16 imp-card">
            <p className="text-3xl mb-2">☕</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {tab === 'received' ? '받은 신청이 없습니다' : '보낸 신청이 없습니다'}
            </p>
            {tab === 'sent' && (
              <Link
                to="/coaches"
                className="text-xs text-blue-600 hover:underline mt-2 inline-block"
              >
                코치 찾아보기 →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map((c) => {
              const counterpart = tab === 'received' ? c.requester : c.host;
              const badge = STATUS_BADGE[c.status];
              const isHost = c.hostId === me?.id;
              return (
                <div key={c.id} className="imp-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {counterpart.avatar ? (
                        <img
                          src={counterpart.avatar}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover bg-slate-100 dark:bg-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-sky-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {(counterpart.name || '?').slice(0, 1)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {counterpart.name || '익명'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {MODALITY_ICON[c.modality]} {c.durationMin}분 · {timeAgo(c.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  {c.topic && (
                    <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {c.topic}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {c.message}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.status === 'pending' && tab === 'received' && (
                      <>
                        <button
                          onClick={() => handleRespond(c.id, 'accepted')}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          수락
                        </button>
                        <button
                          onClick={() => handleRespond(c.id, 'rejected')}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          거절
                        </button>
                      </>
                    )}
                    {c.status === 'pending' && tab === 'sent' && (
                      <button
                        onClick={() => handleCancel(c.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        신청 취소
                      </button>
                    )}
                    {c.status === 'accepted' && c.roomId && (
                      <button
                        onClick={() => navigate(`/coffee-chats/${c.id}/room`)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      >
                        {isHost ? '통화 시작' : '통화 입장'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
