import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import KoreanQualityBadge from '@/components/KoreanQualityBadge';
import StudyGroupQuestionAnswers from '@/components/StudyGroupQuestionAnswers';
import {
  fetchStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  deleteStudyGroup,
  updateStudyGroup,
  fetchStudyGroupQuestions,
  fetchStudyGroupPosts,
  createStudyGroupPost,
  likeStudyGroupPost,
  uploadStudyGroupPostAttachment,
  type StudyGroup,
  type StudyGroupPost,
} from '@/lib/api';
import { getUser } from '@/lib/auth';
import { processImageForUpload } from '@/lib/imageProcess';
import { ROUTES } from '@/lib/routes';
import { t, tx } from '@/lib/i18n';
import { formatDate } from '@/lib/time';
import { useConfirm } from '@/shared/ui/ConfirmProvider';

type StudyGroupDetail = StudyGroup & {
  companyTier?: string;
  cafeCategory?: string;
  experienceLevel?: string;
};

// fetchStudyGroupPosts 응답 — ['study-group-posts', id, category] 캐시 형태
type PostsCache = { items: StudyGroupPost[]; total: number; page: number; limit: number };

type PostAttachment = StudyGroupPost['attachments'][number];

// 첨부 정책 — 서버(study-groups.controller)와 동일: 이미지·PDF, 파일당 2MB.
// 이미지는 업로드 전 1600px 리사이즈로 캡 하위 보장. UI 는 글당 5개로 제한 (서버 상한 10).
const ATTACH_MAX_BYTES = 2 * 1024 * 1024;
const MAX_POST_ATTACHMENTS = 5;

const formatBytes = (n: number) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`;

/** 게시글 첨부 렌더 — 이미지는 썸네일, PDF 는 파일 칩. data: URL(개발 폴백)은 download 로 저장. */
function PostAttachmentList({ list }: { list: PostAttachment[] }) {
  if (!list?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {list.map((att) => {
        const isDataUrl = att.url.startsWith('data:');
        const download = isDataUrl ? att.name || 'attachment' : undefined;
        return att.type?.startsWith('image/') ? (
          <a
            key={att.url}
            href={att.url}
            target="_blank"
            rel="noreferrer"
            download={download}
            className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
          >
            <img
              src={att.url}
              alt={att.name}
              loading="lazy"
              className="h-20 w-20 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
            />
          </a>
        ) : (
          <a
            key={att.url}
            href={att.url}
            target="_blank"
            rel="noreferrer"
            download={download}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] text-slate-600 dark:text-slate-300 hover:border-blue-300 transition-colors"
          >
            <span aria-hidden>📄</span>
            <span className="max-w-[160px] truncate">{att.name || 'PDF'}</span>
            {att.size > 0 && <span className="text-slate-400">{formatBytes(att.size)}</span>}
          </a>
        );
      })}
    </div>
  );
}

export default function StudyGroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = getUser();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  // P2-5 — join/leave 직후 server 응답이 stale 일 수 있어 (members[] 빈 배열 race) 낙관적 상태 유지.
  const [localMembership, setLocalMembership] = useState<'joined' | 'left' | null>(null);

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

  // 첨부 — 업로드 완료된 { url, name, size, type } 목록 (게시 시 본문과 함께 전송)
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  const [attaching, setAttaching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // 같은 파일 재선택 허용
    if (!files.length || !id) return;
    if (attachments.length + files.length > MAX_POST_ATTACHMENTS) {
      toast(tx('study.attach.max', { max: MAX_POST_ATTACHMENTS }), 'info');
      return;
    }
    setAttaching(true);
    try {
      for (const original of files) {
        const isPdf = original.type === 'application/pdf';
        const isImage = original.type.startsWith('image/') || /\.(heic|heif)$/i.test(original.name);
        if (!isPdf && !isImage) {
          toast(tx('study.attach.unsupported', { name: original.name }), 'error');
          continue;
        }
        // 이미지는 업로드 전 1600px 리사이즈 + 압축 — 서버 2MB 캡 하위 보장.
        // GIF 는 재인코딩 시 애니메이션이 깨지므로 원본 그대로 (2MB 검사만).
        let file = original;
        if (isImage && original.type !== 'image/gif') {
          file = await processImageForUpload(original, {
            maxDim: 1600,
            maxSizeMB: 1.8,
            thresholdBytes: 0,
          });
        }
        if (file.size > ATTACH_MAX_BYTES) {
          toast(tx('study.attach.tooLarge', { name: original.name }), 'error');
          continue;
        }
        const uploaded = await uploadStudyGroupPostAttachment(id, file);
        setAttachments((prev) => [...prev, uploaded]);
      }
    } catch (err) {
      toast(err instanceof Error && err.message ? err.message : tx('study.attach.failed'), 'error');
    } finally {
      setAttaching(false);
    }
  };

  const removeAttachment = (url: string) =>
    setAttachments((prev) => prev.filter((a) => a.url !== url));

  const submitPost = async () => {
    if (!id) return;
    if (newPostTitle.trim().length < 2 || newPostContent.trim().length < 2) {
      toast(tx('study.titleContentRequired'), 'info');
      return;
    }
    setPosting(true);
    try {
      await createStudyGroupPost(id, {
        title: newPostTitle,
        content: newPostContent,
        category: newPostCategory,
        attachments,
      });
      toast(tx('toast.posted'), 'success');
      setNewPostTitle('');
      setNewPostContent('');
      setAttachments([]);
      setShowComposer(false);
      qc.invalidateQueries({ queryKey: ['study-group-posts', id] });
    } catch (e) {
      toast(e instanceof Error ? e.message : tx('toast.failed'), 'error');
    } finally {
      setPosting(false);
    }
  };

  // 좋아요 토글 — 낙관적 +1 즉시 반영 → 서버 응답(멱등 토글의 실제 likeCount)으로 보정,
  // 실패 시 스냅샷 롤백 + 에러 토스트, 종료 시 invalidate 로 서버 정합 회복
  const handleLike = async (postId: string) => {
    const postsKey = ['study-group-posts', id];
    await qc.cancelQueries({ queryKey: postsKey });
    const snapshots = qc.getQueriesData<PostsCache>({ queryKey: postsKey });
    const patchLikeCount = (next: (prev: number) => number) =>
      qc.setQueriesData<PostsCache>({ queryKey: postsKey }, (cache) =>
        cache
          ? {
              ...cache,
              items: cache.items.map((p) =>
                p.id === postId ? { ...p, likeCount: next(p.likeCount) } : p,
              ),
            }
          : cache,
      );
    patchLikeCount((prev) => prev + 1);
    try {
      const result = await likeStudyGroupPost(postId);
      patchLikeCount(() => result.likeCount);
    } catch {
      snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
      toast('좋아요 처리에 실패했습니다', 'error');
    } finally {
      qc.invalidateQueries({ queryKey: postsKey });
    }
  };

  useEffect(() => {
    if (group) document.title = `${group.name} — 스터디`;
  }, [group]);

  // P2-5 — isMember 계산:
  //   1) localMembership 이 'joined' / 'left' 인 경우 그대로 우선 (낙관 업데이트)
  //   2) localMembership 이 null 이면 server 응답의 members 배열로 판정
  // owner 는 별도 — 항상 member 권한 보유.
  const serverIsMember = !!user?.id && (group?.members?.some((m) => m.userId === user.id) ?? false);
  const isOwner = group?.ownerId === user?.id;
  const isMember =
    isOwner ||
    (localMembership === 'joined' ? true : localMembership === 'left' ? false : serverIsMember);

  // 서버 데이터에 local 상태가 반영되면 (members 가 일치) local 초기화
  useEffect(() => {
    if (localMembership === 'joined' && serverIsMember) setLocalMembership(null);
    if (localMembership === 'left' && !serverIsMember) setLocalMembership(null);
  }, [serverIsMember, localMembership]);

  const handleJoin = async () => {
    if (!user) {
      navigate(ROUTES.login);
      return;
    }
    if (!id) return;
    setBusy(true);
    try {
      await joinStudyGroup(id);
      setLocalMembership('joined');
      toast(tx('toast.joined'), 'success');
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
      setLocalMembership('left');
      toast(tx('toast.left'), 'info');
      qc.invalidateQueries({ queryKey: ['study-group', id] });
    } catch (err) {
      toast(err instanceof Error ? err.message : '탈퇴 실패', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!(await confirm({ title: tx('confirm.deleteStudy'), danger: true, confirmText: '삭제' })))
      return;
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

  const handleTogglePrivacy = async () => {
    if (!id || !group) return;
    const next = !group.isPrivate;
    const msg = next
      ? '비공개로 전환하면 검색에 노출되지 않고 초대받은 멤버만 볼 수 있습니다. 진행할까요?'
      : '공개로 전환하면 누구나 그룹을 검색하고 가입할 수 있습니다. 진행할까요?';
    if (!(await confirm({ title: msg }))) return;
    setBusy(true);
    try {
      await updateStudyGroup(id, { isPrivate: next });
      toast(next ? '🔒 비공개로 전환됨' : '🌐 공개로 전환됨', 'success');
      qc.invalidateQueries({ queryKey: ['study-group', id] });
    } catch (err) {
      toast(err instanceof Error ? err.message : '변경 실패', 'error');
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
            <h1 className="text-lg font-semibold mb-2">{tx('study.notFound')}</h1>
            <p className="text-sm text-slate-500 mb-4">{tx('study.notFoundDesc')}</p>
            <button
              onClick={() => navigate(ROUTES.interview.studyGroups)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              {tx('study.backToList')}
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
          ← {tx('study.backToList')}
        </button>

        <div className="imp-card p-5 sm:p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="heading-accent text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
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

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {isOwner ? (
                <>
                  <button
                    onClick={handleTogglePrivacy}
                    disabled={busy}
                    className="px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
                    title={
                      group.isPrivate
                        ? '공개로 전환 — 누구나 검색/가입 가능'
                        : '비공개로 전환 — 초대받은 멤버만 가입 가능'
                    }
                  >
                    {group.isPrivate ? '🌐 공개로 전환' : '🔒 비공개로 전환'}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={busy}
                    className="px-3 py-2 text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50"
                  >
                    그룹 삭제
                  </button>
                </>
              ) : isMember ? (
                <button
                  onClick={handleLeave}
                  disabled={busy}
                  className="px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
                >
                  {tx('study.leave')}
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={busy || group.memberCount >= group.maxMembers}
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {group.memberCount >= group.maxMembers ? tx('study.full') : tx('study.join')}
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
            <div className="flex flex-wrap gap-2 mb-3">
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
                    {isOwner && <option value="notice">📢 {tx('study.category.notice')}</option>}
                    <option value="free">💬 {tx('study.category.free')}</option>
                    <option value="question">❓ {tx('study.category.question')}</option>
                    <option value="resource">📎 {tx('study.category.resource')}</option>
                    <option value="study-log">📝 {tx('study.category.studyLog')}</option>
                  </select>
                  <input
                    type="text"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value.slice(0, 100))}
                    placeholder={tx('study.titlePlaceholder')}
                    className="flex-1 text-sm px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                  />
                </div>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value.slice(0, 20000))}
                  rows={4}
                  placeholder={tx('study.contentPlaceholder')}
                  className="w-full text-sm px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 resize-y"
                />

                {/* 첨부 — 이미지(1600px 자동 리사이즈)·PDF, 파일당 2MB */}
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.heic,.heif,application/pdf"
                    className="hidden"
                    onChange={handlePickFiles}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={attaching || attachments.length >= MAX_POST_ATTACHMENTS}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300 disabled:opacity-50 transition-colors"
                  >
                    📎 {attaching ? tx('study.attach.uploading') : tx('study.attach.add')}
                  </button>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {tx('study.attach.hint', { max: MAX_POST_ATTACHMENTS })}
                  </span>
                </div>
                {attachments.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {attachments.map((a) => (
                      <li
                        key={a.url}
                        className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                      >
                        {a.type.startsWith('image/') ? (
                          <img src={a.url} alt="" className="w-6 h-6 rounded object-cover" />
                        ) : (
                          <span aria-hidden className="text-sm">
                            📄
                          </span>
                        )}
                        <span className="text-[10px] text-slate-600 dark:text-slate-300 max-w-[140px] truncate">
                          {a.name}
                        </span>
                        <span className="text-[9px] text-slate-400">{formatBytes(a.size)}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(a.url)}
                          aria-label={tx('study.attach.remove')}
                          className="w-4 h-4 inline-flex items-center justify-center rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex items-center justify-end gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mr-auto">
                    {newPostContent.length}/20,000
                  </span>
                  <KoreanQualityBadge text={newPostContent} label="스터디 글" minLength={100} />
                  <button
                    onClick={submitPost}
                    disabled={posting || attaching}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {posting ? tx('common.loading') : tx('study.newPost')}
                  </button>
                </div>
              </div>
            )}

            {/* 게시글 목록 */}
            {posts.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                {tx('study.posts')} — {tx('common.empty')}
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
                        <PostAttachmentList list={p.attachments} />
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                          <span>{p.user?.name || '익명'}</span>
                          <span>·</span>
                          <span>{formatDate(p.createdAt)}</span>
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
              {tx('study.questions')} ({questions.length})
            </h2>
            {questions.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                {tx('study.questions')} — {tx('common.empty')}
              </p>
            ) : (
              <ul className="space-y-2">
                {questions.map((q) => (
                  <li
                    key={q.id}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1">
                        {q.question}
                      </p>
                      <span
                        className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold shrink-0"
                        aria-label={`추천 ${q.upvotes}회`}
                      >
                        👍 {q.upvotes}
                      </span>
                    </div>
                    {q.sampleAnswer && (
                      <div className="mt-1.5 p-2 rounded bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
                        <span className="text-[9px] font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                          예시 답변
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap">
                          {q.sampleAnswer}
                        </p>
                      </div>
                    )}
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      {q.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300">
                          {q.category}
                        </span>
                      )}
                      {q.difficulty && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {q.difficulty}
                        </span>
                      )}
                      {typeof q.answerCount === 'number' && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          답변 {q.answerCount}개
                        </span>
                      )}
                    </div>
                    {/* 답변 리스트 + 작성 폼 */}
                    <StudyGroupQuestionAnswers questionId={q.id} groupOwnerId={group.ownerId} />
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
