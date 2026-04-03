import { useState, useEffect, useMemo, useRef } from 'react';
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
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = '쪽지 — 이력서공방';
    loadConversations();
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleBack = () => {
    setSelectedPartnerId(null);
    setMessages([]);
  };

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(c =>
      c.partner.name.toLowerCase().includes(q) ||
      c.partner.email.toLowerCase().includes(q) ||
      c.lastMessage.content.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const selectedConv = conversations.find(c => c.partner.id === selectedPartnerId);
  const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8" role="main">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
          쪽지
          {totalUnread > 0 && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
              {totalUnread}
            </span>
          )}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[500px]">
          {/* Conversations list - hidden on mobile when a conversation is selected */}
          <div className={`lg:col-span-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col ${
            selectedPartnerId ? 'hidden lg:flex' : 'flex'
          }`}>
            <div className="p-3 border-b border-slate-100 dark:border-slate-700 space-y-2">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">대화 ({conversations.length})</h2>
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="이름, 이메일, 내용 검색..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <CardGridSkeleton count={3} />
              ) : filteredConversations.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  {search.trim() ? '검색 결과가 없습니다' : '대화가 없습니다'}
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredConversations.map(conv => (
                    <button
                      key={conv.partner.id}
                      onClick={() => loadMessages(conv.partner.id)}
                      className={`w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        selectedPartnerId === conv.partner.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative shrink-0">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                            {conv.partner.name?.charAt(0) || '?'}
                          </div>
                          {conv.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center leading-none">
                              {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm truncate ${
                              conv.unreadCount > 0
                                ? 'font-semibold text-slate-900 dark:text-slate-100'
                                : 'font-medium text-slate-700 dark:text-slate-300'
                            }`}>{conv.partner.name}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 ml-1">{timeAgo(conv.lastMessage.createdAt)}</span>
                          </div>
                          <p className={`text-xs truncate ${
                            conv.unreadCount > 0
                              ? 'text-slate-700 dark:text-slate-300 font-medium'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}>{conv.lastMessage.isMine ? '나: ' : ''}{conv.lastMessage.content}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat - full width on mobile when conversation selected */}
          <div className={`lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col ${
            selectedPartnerId ? 'flex' : 'hidden lg:flex'
          }`}>
            {selectedPartnerId ? (
              <>
                {/* Header with back button on mobile */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                  <button
                    onClick={handleBack}
                    className="lg:hidden p-1 -ml-1 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    aria-label="대화 목록으로 돌아가기"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {selectedConv?.partner.name?.charAt(0) || '?'}
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedConv?.partner.name}</span>
                </div>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
                  {messages.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">메시지가 없습니다. 대화를 시작하세요!</p>
                  ) : (
                    messages.map(msg => (
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
                    ))
                  )}
                  <div ref={messagesEndRef} />
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
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm">대화를 선택하세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
