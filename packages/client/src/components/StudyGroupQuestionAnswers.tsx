import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchStudyGroupQuestionAnswers,
  createStudyGroupQuestionAnswer,
  deleteStudyGroupQuestionAnswer,
  upvoteStudyGroupQuestionAnswer,
  type StudyGroupQuestionAnswer,
} from '@/lib/api';
import { getUser } from '@/lib/auth';
import { toast } from '@/components/Toast';
import { useConfirm } from '@/shared/ui/ConfirmProvider';
import { tx } from '@/lib/i18n';

interface Props {
  questionId: string;
  /** 그룹 owner — 다른 사람 답변 삭제 가능 */
  groupOwnerId?: string;
}

/**
 * 스터디 문제 답변 리스트 — 멤버가 답변을 작성·공유·추천.
 * 1단계 답글 지원 (parentId).
 *
 * 사용 예: <StudyGroupQuestionAnswers questionId={q.id} groupOwnerId={group.ownerId} />
 */
export default function StudyGroupQuestionAnswers({ questionId, groupOwnerId }: Props) {
  const user = getUser();
  const qc = useQueryClient();
  const [sort, setSort] = useState<'upvotes' | 'recent'>('upvotes');
  const [composing, setComposing] = useState(false);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: answers = [], isLoading } = useQuery({
    queryKey: ['study-group-answers', questionId, sort],
    queryFn: () => fetchStudyGroupQuestionAnswers(questionId, { sort }),
    enabled: !!questionId,
    retry: 1,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['study-group-answers', questionId] });

  const submit = async () => {
    const trimmed = body.trim();
    if (trimmed.length < 2) {
      toast(tx('study.answerMin') || '답변은 2자 이상 입력하세요', 'info');
      return;
    }
    setSubmitting(true);
    try {
      await createStudyGroupQuestionAnswer(questionId, { body: trimmed, parentId: replyTo });
      setBody('');
      setReplyTo(null);
      setComposing(false);
      invalidate();
      toast(tx('toast.posted'), 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : tx('toast.failed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirm = useConfirm();

  const remove = async (id: string) => {
    if (!(await confirm({ title: '답변을 삭제하시겠습니까?', confirmText: '삭제', danger: true })))
      return;
    try {
      await deleteStudyGroupQuestionAnswer(id);
      invalidate();
      toast(tx('toast.deleted'), 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : tx('toast.failed'), 'error');
    }
  };

  const toggleUpvote = async (id: string) => {
    try {
      await upvoteStudyGroupQuestionAnswer(id);
      invalidate();
    } catch (e) {
      toast(e instanceof Error ? e.message : tx('toast.failed'), 'error');
    }
  };

  // parentId 가 같은 답글끼리 묶기 (top-level + replies)
  const topLevel = answers.filter((a) => !a.parentId);
  const repliesByParent = new Map<string, StudyGroupQuestionAnswer[]>();
  for (const a of answers) {
    if (a.parentId) {
      const arr = repliesByParent.get(a.parentId) || [];
      arr.push(a);
      repliesByParent.set(a.parentId, arr);
    }
  }

  const canDelete = (answer: StudyGroupQuestionAnswer) =>
    !!user && (answer.userId === user.id || groupOwnerId === user.id);

  return (
    <section
      className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700"
      aria-label="문제 답변"
    >
      <header className="flex items-center justify-between mb-2 gap-2">
        <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          💡 {tx('study.answers') || '답변'} ({topLevel.length})
        </h4>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'upvotes' | 'recent')}
            className="text-[11px] px-1.5 py-1 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
            aria-label="정렬"
          >
            <option value="upvotes">추천순</option>
            <option value="recent">최신순</option>
          </select>
          {user && (
            <button
              onClick={() => {
                setReplyTo(null);
                setComposing((v) => !v);
              }}
              className="text-[11px] px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {composing && !replyTo
                ? tx('common.cancel')
                : `+ ${tx('study.newAnswer') || '답변 작성'}`}
            </button>
          )}
        </div>
      </header>

      {composing && !replyTo && (
        <div className="mb-3 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 5000))}
            rows={3}
            placeholder="답변을 입력하세요 (2~5000자)"
            className="w-full text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 resize-y"
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mr-auto">
              {body.length}/5000
            </span>
            <button
              onClick={submit}
              disabled={submitting}
              className="text-[11px] px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? tx('common.loading') : tx('common.submit') || '제출'}
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <p className="text-xs text-slate-500 dark:text-slate-400 py-2">{tx('common.loading')}</p>
      )}

      {!isLoading && topLevel.length === 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-3">
          {tx('study.noAnswers') || '아직 답변이 없습니다. 첫 번째 답변을 남겨보세요!'}
        </p>
      )}

      <ul className="space-y-2">
        {topLevel.map((a) => {
          const replies = repliesByParent.get(a.id) || [];
          return (
            <li
              key={a.id}
              className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-start gap-2">
                {a.user?.avatar ? (
                  <img src={a.user.avatar} alt="" className="w-6 h-6 rounded-full shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-600 text-[10px] flex items-center justify-center shrink-0">
                    {(a.user?.name || '?').charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {a.user?.name || tx('common.anonymous') || '익명'}
                    </span>
                    <span>·</span>
                    <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {a.body}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3 text-[10px]">
                    <button
                      onClick={() => toggleUpvote(a.id)}
                      disabled={!user || a.userId === user.id}
                      className={`flex items-center gap-1 transition-colors ${
                        a.upvoted
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-500 dark:text-slate-400 hover:text-amber-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      aria-label={a.upvoted ? '추천 취소' : '추천'}
                    >
                      <span aria-hidden>👍</span>
                      <span>{a.upvotes}</span>
                    </button>
                    {user && (
                      <button
                        onClick={() => {
                          setReplyTo(a.id);
                          setComposing(true);
                          setBody('');
                        }}
                        className="text-slate-500 dark:text-slate-400 hover:text-blue-600"
                      >
                        답글
                      </button>
                    )}
                    {canDelete(a) && (
                      <button
                        onClick={() => remove(a.id)}
                        className="text-slate-500 dark:text-slate-400 hover:text-rose-600"
                      >
                        {tx('common.delete')}
                      </button>
                    )}
                  </div>

                  {/* 답글 폼 */}
                  {composing && replyTo === a.id && (
                    <div className="mt-2 p-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value.slice(0, 5000))}
                        rows={2}
                        placeholder="답글을 입력하세요"
                        className="w-full text-[11px] px-2 py-1 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 resize-y"
                      />
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <button
                          onClick={() => {
                            setReplyTo(null);
                            setComposing(false);
                            setBody('');
                          }}
                          className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded"
                        >
                          {tx('common.cancel')}
                        </button>
                        <button
                          onClick={submit}
                          disabled={submitting}
                          className="text-[10px] px-2 py-0.5 bg-blue-600 text-white rounded disabled:opacity-50"
                        >
                          {submitting ? tx('common.loading') : '답글'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 답글 목록 */}
                  {replies.length > 0 && (
                    <ul className="mt-2 pl-3 space-y-1.5 border-l-2 border-slate-200 dark:border-slate-700">
                      {replies.map((r) => (
                        <li key={r.id} className="text-[11px]">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {r.user?.name || tx('common.anonymous') || '익명'}
                            </span>
                            <span>·</span>
                            <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                            {r.body}
                          </p>
                          {canDelete(r) && (
                            <button
                              onClick={() => remove(r.id)}
                              className="mt-0.5 text-[10px] text-slate-400 hover:text-rose-600"
                            >
                              {tx('common.delete')}
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
