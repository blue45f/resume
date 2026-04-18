import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getUser } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import FollowButton from '@/components/FollowButton';
import ShareMenu from '@/components/ShareMenu';
import SendMessageButton from '@/components/SendMessageButton';
import { usePublicGet } from '@/hooks/useResources';

interface PortfolioResume {
  id: string;
  title: string;
  viewCount: number;
  updatedAt: string;
  name: string;
  summary: string;
  github: string;
  website: string;
  photo: string;
  experiences: {
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
  }[];
  tags: { id: string; name: string; color: string }[];
  topSkills: string[];
}

interface PortfolioData {
  user: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    isOpenToWork: boolean;
    openToWorkRoles: string;
    companyName: string;
    companyTitle: string;
    userType: string;
  };
  stats: {
    publicResumeCount: number;
    followerCount: number;
    followingCount: number;
    totalViews: number;
    totalExperiences: number;
  };
  topSkills: string[];
  resumes: PortfolioResume[];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return '오늘';
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}

function calcYearsExp(experiences: PortfolioResume['experiences']): number {
  if (!experiences.length) return 0;
  const totalDays = experiences.reduce((sum, e) => {
    const start = new Date(e.startDate + '-01').getTime();
    const end = e.current
      ? Date.now()
      : e.endDate
        ? new Date(e.endDate + '-01').getTime()
        : Date.now();
    return sum + Math.max(0, (end - start) / 86400000);
  }, 0);
  return Math.floor(totalDays / 365);
}

export default function PortfolioPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const currentUser = getUser();
  const {
    data,
    isLoading: loading,
    isError,
  } = usePublicGet<PortfolioData>(['portfolio', username], `/api/auth/u/${username}`, {
    enabled: !!username,
    staleTime: 60_000,
  });
  const notFound = !loading && (isError || !data);

  useEffect(() => {
    if (data) {
      document.title = `${data.user.name || data.user.username}의 포트폴리오 — 이력서공방`;
    }
    return () => {
      document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼';
    };
  }, [data]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="space-y-2">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-40 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (notFound || !data) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4 animate-fade-in">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
              포트폴리오를 찾을 수 없습니다
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              @{username} 사용자가 존재하지 않거나, 공개된 이력서가 없습니다.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              돌아가기
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { user, stats, topSkills, resumes } = data;
  const isOwn = currentUser?.id === user.id;
  const totalYears = resumes.reduce((max, r) => Math.max(max, calcYearsExp(r.experiences)), 0);
  const portfolioUrl = `${window.location.origin}/u/${user.username}`;

  return (
    <>
      <Header />
      <main className="flex-1 bg-slate-50 dark:bg-slate-900/50" id="main-content">
        {/* Hero section */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-md">
                    <span className="text-3xl font-bold text-white">
                      {(user.name || user.username || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                {user.isOpenToWork && (
                  <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full shadow-sm">
                    구직중
                  </span>
                )}
              </div>

              {/* Profile info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {user.name || user.username}
                  </h1>
                  {user.isOpenToWork && (
                    <span className="text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                      채용 오픈
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  @{user.username}
                </p>
                {(user.companyName || user.companyTitle) && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
                    {[user.companyTitle, user.companyName].filter(Boolean).join(' @ ')}
                  </p>
                )}
                {user.isOpenToWork && user.openToWorkRoles && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    관심 직무: {user.openToWorkRoles}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <ShareMenu
                  url={portfolioUrl}
                  title={`${user.name || user.username}의 포트폴리오`}
                  description={`이력서공방에서 확인하세요`}
                />
                {!isOwn && user.id && (
                  <>
                    <SendMessageButton
                      targetUserId={user.id}
                      targetUserName={user.name}
                      variant="button"
                    />
                    <FollowButton userId={user.id} />
                  </>
                )}
                {isOwn && (
                  <Link
                    to={ROUTES.settings}
                    className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
                  >
                    프로필 수정
                  </Link>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: '공개 이력서', value: stats.publicResumeCount, icon: '📄' },
                { label: '팔로워', value: stats.followerCount, icon: '👥' },
                { label: '팔로잉', value: stats.followingCount, icon: '🤝' },
                { label: '총 조회수', value: stats.totalViews, icon: '👀' },
                {
                  label: '경력 연수',
                  value: totalYears > 0 ? `${totalYears}년` : '-',
                  icon: '💼',
                  raw: true,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center"
                >
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {s.raw
                      ? s.value
                      : typeof s.value === 'number'
                        ? s.value.toLocaleString()
                        : s.value}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Skills */}
          {topSkills.length > 0 && (
            <section className="animate-fade-in">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <span>⚡</span> 보유 기술
              </h2>
              <div className="flex flex-wrap gap-2">
                {topSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Public resumes */}
          <section className="animate-fade-in">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <span>📄</span> 공개 이력서 ({stats.publicResumeCount})
            </h2>

            {resumes.length === 0 ? (
              <div className="py-12 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-4xl mb-3">📂</div>
                <p className="text-slate-500 dark:text-slate-400">공개된 이력서가 없습니다</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resumes.map((resume, i) => (
                  <Link
                    key={resume.id}
                    to={`/resumes/${resume.id}/preview`}
                    className={`block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-200 stagger-${i + 1} animate-fade-in group`}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      {resume.photo ? (
                        <img
                          src={resume.photo}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center shrink-0">
                          <span className="text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                            {(resume.name || resume.title || '?')[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                          {resume.title}
                        </h3>
                        {resume.experiences[0] && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {resume.experiences[0].position} @ {resume.experiences[0].company}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        {resume.viewCount || 0}
                      </span>
                    </div>

                    {/* Summary */}
                    {resume.summary && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                        {resume.summary.replace(/<[^>]*>/g, '')}
                      </p>
                    )}

                    {/* Skills */}
                    {resume.topSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {resume.topSkills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Tags + time */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {resume.tags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag.id}
                            className="px-1.5 py-0.5 text-[10px] rounded-full"
                            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {timeAgo(resume.updatedAt)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
