import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import FeatureDisabledBanner from '@/components/FeatureDisabledBanner';
import Footer from '@/components/Footer';
import { CardGridSkeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import { toast } from '@/components/Toast';
import { timeAgo } from '@/lib/time';
import { API_URL } from '@/lib/config';
import { useConversations, useMessages } from '@/hooks/useResources';
import { tx } from '@/lib/i18n';

const replyComposeSchema = z.object({
  content: z.string().max(2000, '메시지는 2000자 이내로 입력해주세요'),
});
type ReplyComposeValues = z.infer<typeof replyComposeSchema>;

interface Conversation {
  partner: { id: string; name: string; email: string; avatar?: string; lastSeen?: string };
  lastMessage: { content: string; createdAt: string; isMine: boolean };
  unreadCount: number;
  pinned?: boolean;
  category?: 'general' | 'scout';
}

function isOnline(lastSeen?: string): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

function lastSeenText(lastSeen?: string): string {
  if (!lastSeen) return '오프라인';
  const diffMs = Date.now() - new Date(lastSeen).getTime();
  if (diffMs < 5 * 60 * 1000) return '온라인';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `마지막 접속: ${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `마지막 접속: ${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `마지막 접속: ${days}일 전`;
}

function formatDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return '오늘';
  if (date.toDateString() === yesterday.toDateString()) return '어제';
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  read?: boolean;
  reactions?: string[];
  fileUrl?: string;
  fileName?: string;
}

type ReactionType = '👍' | '🙏' | '✅';
const REACTIONS: { emoji: ReactionType; label: string }[] = [
  { emoji: '👍', label: '좋아요' },
  { emoji: '🙏', label: '감사' },
  { emoji: '✅', label: '확인' },
];

type CategoryFilter = '전체' | '스카우트' | '일반' | '고정';

const PINNED_KEY = 'pinned_conversations';
function loadPinned(): Set<string> {
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}
function savePinned(pinned: Set<string>) {
  localStorage.setItem(PINNED_KEY, JSON.stringify([...pinned]));
}

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(searchParams.get('to'));
  const conversationsQuery = useConversations();
  const conversations: Conversation[] =
    (conversationsQuery.data as Conversation[] | undefined) ?? [];
  const messagesQuery = useMessages(selectedPartnerId ?? undefined);
  const messages: Message[] = ((messagesQuery.data as Message[] | undefined) ?? []).map((m) => ({
    ...m,
    read: true,
  }));
  const replyForm = useForm<ReplyComposeValues>({
    resolver: zodResolver(replyComposeSchema),
    defaultValues: { content: '' },
  });
  const newMessage = replyForm.watch('content') ?? '';
  const loading = conversationsQuery.isLoading;
  const [search, setSearch] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('전체');
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(loadPinned);
  const [messageReactions, setMessageReactions] = useState<Record<string, string[]>>({});
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [, setShowFileUpload] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = '쪽지 — 이력서공방';
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate typing indicator when sending
  useEffect(() => {
    if (!selectedPartnerId) return;
    // Mock typing indicator: show briefly after partner's message
    const timer = setTimeout(() => setIsTyping(false), 3000);
    return () => clearTimeout(timer);
  }, [messages, selectedPartnerId]);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  };

  const loadMessages = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    setShowMessageSearch(false);
    setMessageSearch('');
    queryClient.invalidateQueries({ queryKey: ['messages', partnerId] });
  };

  const onSend = async (data: ReplyComposeValues) => {
    if (!selectedPartnerId) return;
    if (!data.content.trim() && !attachedFile) return;
    try {
      const body: Record<string, unknown> = { content: data.content };
      if (attachedFile) {
        body.fileName = attachedFile.name;
        body.fileType = attachedFile.type;
      }
      await fetch(`${API_URL}/api/social/messages/${selectedPartnerId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      replyForm.reset();
      setAttachedFile(null);
      queryClient.invalidateQueries({ queryKey: ['messages', selectedPartnerId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      // Show typing indicator briefly
      setTimeout(() => setIsTyping(true), 1000);
    } catch {
      toast('전송에 실패했습니다', 'error');
    }
  };

  const handleBack = () => {
    setSelectedPartnerId(null);
    setShowMessageSearch(false);
    setMessageSearch('');
  };

  const togglePin = useCallback((partnerId: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(partnerId)) next.delete(partnerId);
      else next.add(partnerId);
      savePinned(next);
      return next;
    });
  }, []);

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    setMessageReactions((prev) => {
      const current = prev[messageId] || [];
      const has = current.includes(emoji);
      return {
        ...prev,
        [messageId]: has ? current.filter((r) => r !== emoji) : [...current, emoji],
      };
    });
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)}MB`
        : `${(file.size / 1024).toFixed(0)}KB`;
    setAttachedFile({ name: file.name, size: sizeStr, type: file.type });
    setShowFileUpload(false);
  };

  const filteredConversations = useMemo(() => {
    let result = conversations.map((c) => ({
      ...c,
      pinned: pinnedIds.has(c.partner.id),
    }));

    // Category filter
    if (categoryFilter === '고정') {
      result = result.filter((c) => c.pinned);
    } else if (categoryFilter === '스카우트') {
      result = result.filter((c) => c.category === 'scout');
    } else if (categoryFilter === '일반') {
      result = result.filter((c) => c.category !== 'scout');
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.partner.name.toLowerCase().includes(q) ||
          c.partner.email.toLowerCase().includes(q) ||
          c.lastMessage.content.toLowerCase().includes(q),
      );
    }

    // Sort: pinned first, then by date
    result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (
        new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
      );
    });

    return result;
  }, [conversations, search, categoryFilter, pinnedIds]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    let filtered = messages;
    if (messageSearch.trim()) {
      const q = messageSearch.toLowerCase();
      filtered = messages.filter((m) => m.content.toLowerCase().includes(q));
    }

    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    for (const msg of filtered) {
      const date = new Date(msg.createdAt).toDateString();
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date: msg.createdAt, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  }, [messages, messageSearch]);

  const selectedConv = conversations.find((c) => c.partner.id === selectedPartnerId);
  const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const isPinned = selectedPartnerId ? pinnedIds.has(selectedPartnerId) : false;

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        <h1 className="heading-accent text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
          {tx('messages.title')}
          {totalUnread > 0 && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
              {totalUnread}
            </span>
          )}
        </h1>

        <FeatureDisabledBanner feature="messaging" label="메시지">
          <div className="stagger-children grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[500px]">
            {/* Conversations list */}
            <div
              className={`lg:col-span-1 imp-card overflow-hidden flex flex-col ${
                selectedPartnerId ? 'hidden lg:flex' : 'flex'
              }`}
            >
              <div className="p-3 border-b border-slate-100 dark:border-slate-700 space-y-2">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  대화 ({conversations.length})
                </h2>

                {/* Category Filter */}
                <div className="flex gap-1">
                  {(['전체', '스카우트', '일반', '고정'] as CategoryFilter[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2 py-1 text-[10px] rounded-lg transition-colors ${
                        categoryFilter === cat
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                      {cat === '고정' && pinnedIds.size > 0 && (
                        <span className="ml-0.5 text-[9px]">({pinnedIds.size})</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative">
                  <svg
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="이름, 이메일, 내용 검색..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <CardGridSkeleton count={3} />
                ) : filteredConversations.length === 0 ? (
                  search.trim() || categoryFilter !== '전체' ? (
                    <p className="text-sm text-slate-400 text-center py-8">검색 결과가 없습니다</p>
                  ) : (
                    <EmptyState type="message" />
                  )
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {filteredConversations.map((conv) => {
                      const convPinned = pinnedIds.has(conv.partner.id);
                      return (
                        <button
                          key={conv.partner.id}
                          onClick={() => loadMessages(conv.partner.id)}
                          className={`w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                            selectedPartnerId === conv.partner.id
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : ''
                          } ${convPinned ? 'bg-amber-50/50 dark:bg-amber-900/5' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="relative shrink-0">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                                {conv.partner.name?.charAt(0) || '?'}
                              </div>
                              <span
                                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 ${
                                  isOnline(conv.partner.lastSeen)
                                    ? 'bg-green-500'
                                    : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                              />
                              {conv.unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center leading-none">
                                  {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-sm truncate flex items-center gap-1 ${
                                    conv.unreadCount > 0
                                      ? 'font-semibold text-slate-900 dark:text-slate-100'
                                      : 'font-medium text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {convPinned && (
                                    <svg
                                      className="w-3 h-3 text-amber-500 shrink-0"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  )}
                                  {conv.partner.name}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 ml-1">
                                  {timeAgo(conv.lastMessage.createdAt)}
                                </span>
                              </div>
                              <p
                                className={`text-[10px] ${
                                  isOnline(conv.partner.lastSeen)
                                    ? 'text-green-500 dark:text-green-400'
                                    : 'text-slate-400 dark:text-slate-500'
                                }`}
                              >
                                {lastSeenText(conv.partner.lastSeen)}
                              </p>
                              <p
                                className={`text-xs truncate ${
                                  conv.unreadCount > 0
                                    ? 'text-slate-700 dark:text-slate-300 font-medium'
                                    : 'text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {conv.lastMessage.isMine ? '나: ' : ''}
                                {conv.lastMessage.content}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Chat */}
            <div
              className={`lg:col-span-2 imp-card flex flex-col ${
                selectedPartnerId ? 'flex' : 'hidden lg:flex'
              }`}
            >
              {selectedPartnerId ? (
                <>
                  {/* Header */}
                  <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <button
                      onClick={handleBack}
                      className="lg:hidden p-1 -ml-1 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      aria-label="대화 목록으로 돌아가기"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <div className="relative shrink-0">
                      <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {selectedConv?.partner.name?.charAt(0) || '?'}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border-[1.5px] border-white dark:border-slate-800 ${
                          isOnline(selectedConv?.partner.lastSeen)
                            ? 'bg-green-500'
                            : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
                        {selectedConv?.partner.name}
                      </span>
                      <span
                        className={`text-[10px] ${
                          isOnline(selectedConv?.partner.lastSeen)
                            ? 'text-green-500'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {lastSeenText(selectedConv?.partner.lastSeen)}
                      </span>
                    </div>
                    {/* Chat actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setShowMessageSearch(!showMessageSearch)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="대화 내 검색"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => togglePin(selectedPartnerId)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isPinned
                            ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                        title={isPinned ? '고정 해제' : '대화 고정'}
                      >
                        <svg
                          className="w-4 h-4"
                          fill={isPinned ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Message Search Bar */}
                  {showMessageSearch && (
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                      <div className="relative">
                        <svg
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        <input
                          type="text"
                          value={messageSearch}
                          onChange={(e) => setMessageSearch(e.target.value)}
                          placeholder="대화 내용 검색..."
                          autoFocus
                          className="w-full pl-8 pr-8 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-1 focus:ring-blue-500"
                        />
                        {messageSearch && (
                          <button
                            onClick={() => setMessageSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                      {messageSearch && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          {groupedMessages.reduce((sum, g) => sum + g.messages.length, 0)}개의
                          메시지 검색됨
                        </p>
                      )}
                    </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-1 max-h-[400px]">
                    {messages.length === 0 ? (
                      <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">
                        메시지가 없습니다. 대화를 시작하세요!
                      </p>
                    ) : (
                      groupedMessages.map((group, gi) => (
                        <div key={gi}>
                          {/* Date separator */}
                          <div className="flex items-center justify-center my-3">
                            <span className="px-3 py-1 text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full">
                              {formatDateGroup(group.date)}
                            </span>
                          </div>
                          {group.messages.map((msg) => {
                            const isMine = msg.senderId === userId;
                            const reactions = messageReactions[msg.id] || [];
                            const isHighlighted =
                              messageSearch &&
                              msg.content.toLowerCase().includes(messageSearch.toLowerCase());
                            return (
                              <div
                                key={msg.id}
                                className={`flex mb-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                                onMouseEnter={() => setHoveredMessageId(msg.id)}
                                onMouseLeave={() => setHoveredMessageId(null)}
                              >
                                <div className="relative group max-w-[70%]">
                                  <div
                                    className={`px-3 py-2 rounded-2xl text-sm ${
                                      isMine
                                        ? 'bg-blue-600 text-white rounded-br-sm'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm'
                                    } ${isHighlighted ? 'ring-2 ring-yellow-400' : ''}`}
                                  >
                                    {/* File attachment preview */}
                                    {msg.fileUrl && (
                                      <div
                                        className={`mb-1.5 p-2 rounded-lg ${isMine ? 'bg-blue-500/30' : 'bg-slate-200 dark:bg-slate-600'}`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <svg
                                            className="w-4 h-4 shrink-0"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                            />
                                          </svg>
                                          <span className="text-xs truncate">
                                            {msg.fileName || '첨부파일'}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                    <p>{msg.content}</p>
                                    <div
                                      className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : ''}`}
                                    >
                                      {/* Timestamp on hover */}
                                      <p
                                        className={`text-[10px] ${isMine ? 'text-blue-200' : 'text-slate-400'} ${
                                          hoveredMessageId === msg.id
                                            ? 'opacity-100'
                                            : 'opacity-0 group-hover:opacity-100'
                                        } transition-opacity`}
                                      >
                                        {formatTime(msg.createdAt)}
                                      </p>
                                      {/* Read indicator (double check) for sent messages */}
                                      {isMine && (
                                        <span
                                          className={`text-[10px] ${msg.read !== false ? 'text-blue-200' : 'text-blue-400'}`}
                                        >
                                          {msg.read !== false ? (
                                            <svg
                                              className="w-3.5 h-3.5 inline"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth={2.5}
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M2 12l5 5L12 12m3-3l5 5"
                                              />
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M7 12l5 5L22 7"
                                              />
                                            </svg>
                                          ) : (
                                            <svg
                                              className="w-3.5 h-3.5 inline"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth={2.5}
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M5 13l4 4L19 7"
                                              />
                                            </svg>
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Reactions display */}
                                  {reactions.length > 0 && (
                                    <div
                                      className={`flex gap-0.5 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}
                                    >
                                      {reactions.map((r, i) => (
                                        <span
                                          key={i}
                                          onClick={() => toggleReaction(msg.id, r)}
                                          className="text-xs bg-slate-100 dark:bg-slate-700 rounded-full px-1.5 py-0.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                        >
                                          {r}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {/* Reaction buttons on hover */}
                                  {hoveredMessageId === msg.id && (
                                    <div
                                      className={`absolute ${isMine ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} top-0 flex gap-0.5 px-1`}
                                    >
                                      {REACTIONS.map((r) => (
                                        <button
                                          key={r.emoji}
                                          onClick={() => toggleReaction(msg.id, r.emoji)}
                                          className={`text-xs p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                                            reactions.includes(r.emoji)
                                              ? 'bg-blue-50 dark:bg-blue-900/20'
                                              : ''
                                          }`}
                                          title={r.label}
                                        >
                                          {r.emoji}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))
                    )}

                    {/* Typing indicator */}
                    {isTyping && (
                      <div className="flex justify-start mb-2">
                        <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-slate-100 dark:bg-slate-700">
                          <div className="flex items-center gap-1">
                            <span
                              className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                              style={{ animationDelay: '0ms' }}
                            />
                            <span
                              className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                              style={{ animationDelay: '150ms' }}
                            />
                            <span
                              className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                              style={{ animationDelay: '300ms' }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">상대방이 입력 중...</p>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Attached file preview */}
                  {attachedFile && (
                    <div className="mx-3 mb-1 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <svg
                          className="w-4 h-4 text-blue-500 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          />
                        </svg>
                        <span className="text-xs text-blue-700 dark:text-blue-400 truncate">
                          {attachedFile.name}
                        </span>
                        <span className="text-[10px] text-blue-500 shrink-0">
                          ({attachedFile.size})
                        </span>
                      </div>
                      <button
                        onClick={() => setAttachedFile(null)}
                        className="text-blue-400 hover:text-blue-600 shrink-0 ml-2"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Input */}
                  <form
                    onSubmit={replyForm.handleSubmit(onSend)}
                    className="p-3 border-t border-slate-100 dark:border-slate-700 flex gap-2 items-end"
                  >
                    {/* File upload button */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                      accept="image/*,.pdf,.doc,.docx,.hwp"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                      title="파일 첨부"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                    </button>
                    <input
                      type="text"
                      {...replyForm.register('content')}
                      placeholder="메시지 입력..."
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() && !attachedFile}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
                    >
                      전송
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex items-center justify-center flex-1 text-slate-400 dark:text-slate-500">
                  <div className="text-center">
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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <p className="text-sm">대화를 선택하세요</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </FeatureDisabledBanner>
      </main>
      <Footer />
    </>
  );
}
