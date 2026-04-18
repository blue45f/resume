import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import {
  fetchStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  deleteStudyGroup,
  fetchStudyGroupQuestions,
  fetchStudyGroupPosts,
  createStudyGroupPost,
  likeStudyGroupPost,
  type StudyGroup,
  type StudyGroupPost,
} from '@/lib/api';
import { getUser } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import { t, tx } from '@/lib/i18n';

type StudyGroupDetail = StudyGroup & {
  companyTier?: string;
  cafeCategory?: string;
  experienceLevel?: string;
};

export default function StudyGroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = getUser();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data: group, isLoading } = useQuery({
    queryKey: ['study-group', id],
    queryFn: () => fetchStudyGroup(id!) as Promise<StudyGroupDetail>,
    enabled: !!id,
    retry: 1,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['study-group-questions', id],
    queryFn: () => fetchStudyGroupQuestions(id!),
    enabled: !!id && !!group,
    retry: 1,
  });

  const [postCategory, setPostCategory] = useState<'all' | StudyGroupPost['category']>('all');
  const { data: postsData } = useQuery({
    queryKey: ['study-group-posts', id, postCategory],
    queryFn: () =>
      fetchStudyGroupPosts(id!, { category: postCategory === 'all' ? undefined : postCategory }),
    enabled: !!id && !!group,
    retry: 1,
  });
  const posts = postsData?.items ?? [];

  const [showComposer, setShowComposer] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<StudyGroupPost['category']>('free');
  const [posting, setPosting] = useState(false);

  const submitPost = async () => {
    if (!id) return;
    if (newPostTitle.trim().length < 2 || newPostContent.trim().length < 2) {
      toast('제목·내용을 입력하세요', 'info');
      return;
    }
    setPosting(true);
    try {
      await createStudyGroupPost(id, {
        title: newPostTitle,
        content: newPostContent,
        category: newPostCategory,
      });
      toast('게시 완료', 'success');
      setNewPostTitle('');
      setNewPostContent('');
      setShowComposer(false);
      qc.invalidateQueries({ queryKey: ['study-group-posts', id] });
    } catch (e) {
      toast(e instanceof Error ? e.message : '게시 실패', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await likeStudyGroupPost(postId);
      qc.invalidateQueries({ queryKey: ['study-group-posts', id] });
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    if (group) document.title = `${group.name} — 스터디`;
  }, [group]);

  const isMember = group?.members?.some((m) => m.userId === user?.id);
  const isOwner = group?.ownerId === user?.id;

  const handleJoin = async () => {
    if (!user) {
      navigate(ROUTES.login);
      return;
    }
    if (!id) return;
    setBusy(true);
    try {
      await joinStudyGroup(id);
      toast('가입 완료', 'success');
      qc.invalidateQueries({ queryKey: ['study-group', id] });
    } catch (err) {
      toast(err instanceof Error ? err.message : '가입 실패', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await leaveStudyGroup(id);
      toast('탈퇴 완료', 'info');
      qc.invalidateQueries({ queryKey: ['study-group', id] });
    } catch (err) {
      toast(err instanceof Error ? err.message : '탈퇴 실패', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm(tx('confirm.deleteStudy'))) return;
    setBusy(true);
    try {
      await deleteStudyGroup(id);
      toast('그룹 삭제 완료', 'info');
      navigate(ROUTES.interview.studyGroups);
    } catch (err) {
      toast(err instanceof Error ? err.message : '삭제 실패', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
            <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!group) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-xl mx-auto w-full px-4 py-12 text-center">
          <div className="imp-card p-8">
            <p className="text-4xl mb-3">🔍</p>
            <h1 className="text-lg font-semibold mb-2">그룹을 찾을 수 없습니다</h1>
            <p className="text-sm text-slate-500 mb-4">삭제됐거나 비공개여서 접근할 수 없습니다.</p>
            <button
              onClick={() => navigate(ROUTES.interview.studyGroups)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              스터디 목록으로
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10"
        role="main"
      >
        <button
          onClick={() => navigate(ROUTES.interview.studyGroups)}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-3 inline-flex items-center gap-1"
        >
          ← 스터디 목록
        </button>

        <div className="imp-card p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {group.name}
                </h1>
                {group.isPrivate && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    🔒 비공개
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span>
                  👥 {group.memberCount}/{group.maxMembers}명
                </span>
                {group.companyName && <span>· {group.companyName}</span>}
                {group.position && <span>· {group.position}</span>}
                {group.companyTier && <span>· {group.companyTier}</span>}
              </div>
              {group.description && (
                <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {group.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isOwner ? (
                <button
                  onClick={handleDelete}
                  disabled={busy}
                  className="px-3 py-2 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50"
                >
                  그룹 삭제
                </button>
              ) : isMember ? (
                <button
                  onClick={handleLeave}
                  disabled={busy}
                  className="px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
                >
                  탈퇴
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={busy || group.memberCount >= group.maxMembers}
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {group.memberCount >= group.maxMembers ? '정원 초과' : '가입하기'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 멤버 목록 */}
        {group.members && group.members.length > 0 && (
          <div className="imp-card p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              멤버 {group.members.length}명
            </h2>
            <div className="flex flex-wrap gap-2">
              {group.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700"
                >
                  {m.user?.avatar ? (
                    <img src={m.user.avatar} alt="" className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600 text-[10px] flex items-center justify-center">
                      {(m.user?.name || '?').charAt(0)}
                    </div>
                  )}
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    {m.user?.name || '익명'}
                  </span>
                  {m.role === 'owner' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
                      OWNER
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 카페 게시판 (멤버만) */}
        {isMember && (
          <div className="imp-card p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                📌 {t('study.cafe')} ({postsData?.total ?? 0})
              </h2>
              <button
                onClick={() => setShowComposer((v) => !v)}
                className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {showComposer ? t('common.cancel') : `+ ${t('study.newPost')}`}
              </button>
            </div>

            {/* 카테고리 필터 */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(
                [
                  { k: 'all', label: t('study.category.all'), icon: '📋' },
                  { k: 'notice', label: t('study.category.notice'), icon: '📢' },
                  { k: 'free', label: t('study.category.free'), icon: '💬' },
                  { k: 'question', label: t('study.category.question'), icon: '❓' },
                  { k: 'resource', label: t('study.category.resource'), icon: '📎' },
                  { k: 'study-log', label: t('study.category.studyLog'), icon: '📝' },
                ] as const
              ).map((c) => (
                <button
                  key={c.k}
                  onClick={() => setPostCategory(c.k as any)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    postCategory === c.k
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-300'
                  }`}
                >
                  <span aria-hidden className="mr-0.5">
                    {c.icon}
                  </span>
                  {c.label}
                </button>
              ))}
            </div>

            {/* 글쓰기 폼 */}
            {showComposer && (
              <div className="mb-4 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 space-y-2">
                <div className="flex gap-2">
                  <select
                    value={newPostCategory}
                    onChange={(e) => setNewPostCategory(e.target.value as any)}
                    className="text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                  >
                    {isOwner && <option value="notice">📢 공지</option>}
                    <option value="free">💬 자유</option>
                    <option value="question">❓ 질문</option>
                    <option value="resource">📎 자료공유</option>
                    <option value="study-log">📝 학습일지</option>
                  </select>
                  <input
                    type="text"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value.slice(0, 100))}
                    placeholder="제목"
                    className="flex-1 text-sm px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                  />
                </div>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value.slice(0, 20000))}
                  rows={4}
                  placeholder="내용을 입력하세요"
                  className="w-full text-sm px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 resize-y"
                />
                <div className="flex items-center justify-end gap-2">
                  <span className="text-[10px] text-slate-400 mr-auto">
                    {newPostContent.length}/20,000
                  </span>
                  <button
                    onClick={submitPost}
                    disabled={posting}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {posting ? '게시 중...' : '게시하기'}
                  </button>
                </div>
              </div>
            )}

            {/* 게시글 목록 */}
            {posts.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                아직 게시글이 없습니다. 첫 글을 남겨보세요!
              </p>
            ) : (
              <ul className="space-y-2">
                {posts.map((p) => (
                  <li
                    key={p.id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      {p.isPinned && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-semibold shrink-0"
                          aria-label="고정"
                        >
                          📌 고정
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                          p.category === 'notice'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : p.category === 'question'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : p.category === 'resource'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : p.category === 'study-log'
                                  ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                                  : 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200'
                        }`}
                      >
                        {p.category === 'notice'
                          ? '공지'
                          : p.category === 'question'
                            ? '질문'
                            : p.category === 'resource'
                              ? '자료'
                              : p.category === 'study-log'
                                ? '학습'
                                : '자유'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {p.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed whitespace-pre-wrap">
                          {p.content}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                          <span>{p.user?.name || '익명'}</span>
                          <span>·</span>
                          <span>{new Date(p.createdAt).toLocaleDateString('ko-KR')}</span>
                          <span>·</span>
                          <span>👁 {p.viewCount}</span>
                          <button
                            onClick={() => handleLike(p.id)}
                            className="hover:text-red-500 transition-colors"
                          >
                            ♥ {p.likeCount}
                          </button>
                          {p.attachments?.length > 0 && <span>· 📎 {p.attachments.length}</span>}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 질문 목록 (멤버만) */}
        {isMember && (
          <div className="imp-card p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              공유된 질문 {questions.length}개
            </h2>
            {questions.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                아직 공유된 질문이 없습니다.
              </p>
            ) : (
              <ul className="space-y-2">
                {questions.map((q) => (
                  <li
                    key={q.id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700"
                  >
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {q.question}
                    </p>
                    {q.sampleAnswer && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                        {q.sampleAnswer}
                      </p>
                    )}
                    {q.category && (
                      <span className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
                        {q.category}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!isMember && !isOwner && !group.isPrivate && (
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            가입하면 공유된 질문·답변을 볼 수 있습니다.
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
