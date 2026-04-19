import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FormSkeleton } from '@/components/Skeleton';
import { toast } from '@/components/Toast';
import { getUser } from '@/lib/auth';
import { timeAgo } from '@/lib/time';
import { t } from '@/lib/i18n';

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

const TYPE_CONFIG = {
  bug: {
    label: '버그 신고',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: '🐛',
  },
  feature: {
    label: '기능 제안',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: '💡',
  },
  opinion: {
    label: '의견',
    color: 'bg-sky-100 text-purple-700 dark:bg-sky-900/30 dark:text-sky-400',
    icon: '💬',
  },
  question: {
    label: '질문',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    icon: '❓',
  },
};

const STATUS_CONFIG = {
  open: {
    label: '접수',
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  },
  'in-progress': {
    label: '처리 중',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  resolved: {
    label: '해결됨',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  closed: {
    label: '종료',
    color: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
  },
};

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'opinion', 'question']),
  title: z
    .string()
    .min(2, '제목은 최소 2자 이상이어야 합니다')
    .max(100, '제목은 최대 100자까지 입력 가능합니다'),
  content: z
    .string()
    .min(10, '내용은 최소 10자 이상이어야 합니다')
    .max(2000, '내용은 최대 2000자까지 입력 가능합니다'),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const user = getUser();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: 'opinion',
      title: '',
      content: '',
    },
  });

  const formType = watch('type');

  useEffect(() => {
    document.title = '피드백 — 이력서공방';
    loadItems();
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, []);

  const loadItems = () => {
    // localStorage 기반 (백엔드 API 추가 시 교체)
    try {
      const stored = JSON.parse(localStorage.getItem('feedback-items') || '[]');
      setItems(stored);
    } catch {}
    setLoading(false);
  };

  const onSubmit = async (data: FeedbackFormValues) => {
    try {
      const newItem: FeedbackItem = {
        id: Date.now().toString(),
        type: data.type,
        title: data.title.trim(),
        content: data.content.trim(),
        status: 'open',
        votes: 0,
        authorName: user?.name || '익명',
        createdAt: new Date().toISOString(),
        replies: 0,
      };
      const updated = [newItem, ...items];
      localStorage.setItem('feedback-items', JSON.stringify(updated));
      setItems(updated);
      reset();
      setShowForm(false);
      toast('피드백이 등록되었습니다', 'success');
    } catch {
      toast('피드백 등록에 실패했습니다', 'error');
    }
  };

  const handleVote = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, votes: item.votes + 1 } : item,
    );
    localStorage.setItem('feedback-items', JSON.stringify(updated));
    setItems(updated);
  };

  const filtered = filterType === 'all' ? items : items.filter((i) => i.type === filterType);

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        role="main"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {t('page.feedback')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              버그 신고, 기능 제안, 의견을 남겨주세요
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 글쓰기
          </button>
        </div>

        {/* 글쓰기 폼 */}
        {showForm && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mb-6 imp-card p-4 sm:p-6 animate-fade-in"
          >
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              새 피드백
            </h2>
            <div className="flex gap-2 mb-3">
              {(Object.entries(TYPE_CONFIG) as [string, any][]).map(([key, cfg]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() =>
                    setValue('type', key as FeedbackFormValues['type'], { shouldValidate: true })
                  }
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${formType === key ? cfg.color + ' font-medium' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                >
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>
            {errors.type && <p className="text-xs text-red-500 mt-1 mb-2">{errors.type.message}</p>}
            <input
              {...register('title')}
              placeholder="제목"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            <textarea
              {...register('content')}
              placeholder="내용을 자세히 작성해주세요..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 mt-3 focus:ring-2 focus:ring-blue-500 resize-none"
            />
            {errors.content && (
              <p className="text-xs text-red-500 mt-1">{errors.content.message}</p>
            )}
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  reset();
                  setShowForm(false);
                }}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </form>
        )}

        {/* 필터 */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto py-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${filterType === 'all' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
          >
            전체 ({items.length})
          </button>
          {(Object.entries(TYPE_CONFIG) as [string, any][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${filterType === key ? cfg.color + ' font-medium' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
            >
              {cfg.icon} {cfg.label} ({items.filter((i) => i.type === key).length})
            </button>
          ))}
        </div>

        {/* 목록 */}
        {loading ? (
          <div className="py-8">
            <FormSkeleton />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <p className="text-4xl mb-4">📝</p>
            <p className="text-slate-500 dark:text-slate-400 mb-2">등록된 피드백이 없습니다</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              첫 번째 피드백을 남겨주세요!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const typeCfg = TYPE_CONFIG[item.type];
              const statusCfg = STATUS_CONFIG[item.status];
              return (
                <div key={item.id} className="card-hover imp-card p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleVote(item.id)}
                      className="flex flex-col items-center gap-0.5 pt-1 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                      title="추천"
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
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                      <span className="text-xs font-medium">{item.votes}</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${typeCfg.color}`}
                        >
                          {typeCfg.icon} {typeCfg.label}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${statusCfg.color}`}
                        >
                          {statusCfg.label}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {item.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span>{item.authorName}</span>
                        <span>{timeAgo(item.createdAt)}</span>
                      </div>
                    </div>
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
