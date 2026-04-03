import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CardGridSkeleton } from '@/components/Skeleton';
import { toast } from '@/components/Toast';
import { timeAgo } from '@/lib/time';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Conversation {
  partner: { id: string; name: string; email: string; avatar?: string };
  lastMessage: { content: string; createdAt: string; isMine: boolean };
  unreadCount: number;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = '쪽지 — 이력서공방';
    loadConversations();
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  };

  const loadConversations = () => {
    fetch(`${API_URL}/api/social/messages`, { headers: getHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadMessages = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    fetch(`${API_URL}/api/social/messages/${partnerId}`, { headers: getHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(setMessages)
      .catch(() => {});
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartnerId) return;
    try {
      await fetch(`${API_URL}/api/social/messages/${selectedPartnerId}`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ content: newMessage }),
      });
      setNewMessage('');
      loadMessages(selectedPartnerId);
      loadConversations();
    } catch {
      toast('전송에 실패했습니다', 'error');
    }
  };

  const selectedConv = conversations.find(c => c.partner.id === selectedPartnerId);
  const userId = JSON.parse(localStorage.getItem('user') || '{}').id;

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">쪽지</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[500px]">
          {/* Conversations list */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-3 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">대화 ({conversations.length})</h2>
            </div>
            {loading ? (
              <CardGridSkeleton count={3} />
            ) : conversations.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">대화가 없습니다</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {conversations.map(conv => (
                  <button
                    key={conv.partner.id}
                    onClick={() => loadMessages(conv.partner.id)}
                    className={`w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      selectedPartnerId === conv.partner.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {conv.partner.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{conv.partner.name}</span>
                          {conv.unreadCount > 0 && (
                            <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center shrink-0">{conv.unreadCount}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{conv.lastMessage.content}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col">
            {selectedPartnerId ? (
              <>
                {/* Header */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedConv?.partner.name}</span>
                </div>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                        msg.senderId === userId
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm'
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-0.5 ${msg.senderId === userId ? 'text-blue-200' : 'text-slate-400'}`}>{timeAgo(msg.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Input */}
                <form onSubmit={handleSend} className="p-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="메시지 입력..."
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="submit" disabled={!newMessage.trim()} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0">
                    전송
                  </button>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center flex-1 text-slate-400 dark:text-slate-500">
                <p className="text-sm">대화를 선택하세요</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
