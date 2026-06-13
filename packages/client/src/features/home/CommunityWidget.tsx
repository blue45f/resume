import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { usePublicGet } from '@/hooks/useResources';

interface CommunityWidgetPost {
  id: string;
  title: string;
  category: string;
  likeCount: number;
  createdAt: string;
}

interface CommunityWidgetResponse {
  items?: CommunityWidgetPost[];
}

export default function CommunityWidget() {
  const { data } = usePublicGet<CommunityWidgetResponse>(
    ['home-community'],
    '/api/community?limit=5&page=1',
    {
      staleTime: 60_000,
    },
  );
  const posts = data?.items ? data.items.slice(0, 5) : [];

  if (!posts.length) return null;

  const CAT_COLORS: Record<string, string> = {
    notice: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    free: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    tips: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    resume: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'cover-letter': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    question: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };
  const CAT_LABELS: Record<string, string> = {
    notice: '공지',
    free: '자유',
    tips: '취업팁',
    resume: '이력서피드백',
    'cover-letter': '자소서',
    question: '질문',
  };

  return (
    <div className="mb-6 imp-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span className="w-5 h-5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded-md flex items-center justify-center text-xs">
            💬
          </span>
          커뮤니티 최신 글
        </h3>
        <Link to={ROUTES.community.list} className="home-subtle-link text-xs">
          더보기 →
        </Link>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {posts.map((post) => (
          <Link
            key={post.id}
            to={ROUTES.community.post(post.id)}
            className="home-list-row flex items-center gap-3"
          >
            <span
              className={`shrink-0 text-xs px-1.5 py-0.5 rounded-md font-medium ${CAT_COLORS[post.category] || CAT_COLORS.free}`}
            >
              {CAT_LABELS[post.category] || '자유'}
            </span>
            <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">
              {post.title}
            </span>
            <span className="shrink-0 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {post.likeCount}
            </span>
          </Link>
        ))}
      </div>
      <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700">
        <Link to={ROUTES.community.write} className="home-subtle-link text-xs font-medium">
          + 새 글 작성하기
        </Link>
      </div>
    </div>
  );
}
