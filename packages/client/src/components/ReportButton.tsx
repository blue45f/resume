import { useState } from 'react';
import { toast } from '@/components/Toast';
import { API_URL } from '@/lib/config';

export type ReportReason = 'spam' | 'inappropriate' | 'fake' | 'copyright' | 'other';

interface Props {
  /** POST 엔드포인트 (예: `/api/resumes/:id/report`). 전체 URL 로 변환됨 */
  endpoint: string;
  /** 신고 대상 라벨 (모달 문구용) — "이력서" / "게시물" 등 */
  targetLabel: string;
  /** 버튼 className 커스터마이즈 */
  buttonClassName?: string;
  /** 버튼 텍스트 (기본: "🚩 신고") */
  buttonText?: string;
}

/**
 * 공용 신고 버튼 + 모달 — Resume, CommunityPost 등 다양한 컨텐츠 재사용.
 * endpoint 로 POST 하고 reason/detail 를 JSON body 로 전달.
 * 서버 응답의 reportCount / autoHidden / threshold 를 토스트로 노출.
 */
export default function ReportButton({
  endpoint,
  targetLabel,
  buttonClassName = '',
  buttonText = '🚩 신고',
}: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('inappropriate');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast('로그인이 필요합니다', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason, detail }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: '신고 실패' }));
        throw new Error(err.message || '신고 실패');
      }
      const data = await res.json();
      toast(
        data.autoHidden
          ? `신고 접수 — 누적 ${data.reportCount}건으로 자동 비공개 전환됨`
          : `신고 접수 완료 (누적 ${data.reportCount}/${data.threshold})`,
        'success',
      );
      setOpen(false);
      setDetail('');
    } catch (e) {
      toast(e instanceof Error ? e.message : '신고 실패', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const defaultButtonClass =
    'inline-flex items-center gap-1.5 min-h-[36px] px-3 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 rounded-md hover:border-red-300 dark:hover:border-red-700 transition-colors';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClassName || defaultButtonClass}
        title={`부적절한 ${targetLabel} 신고`}
        aria-label="신고"
      >
        {buttonText}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {targetLabel} 신고
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              동일 {targetLabel}을(를) 여러 사용자가 신고하면 자동으로 공개에서 제외됩니다. 잘못된
              신고는 관리자가 기각할 수 있습니다.
            </p>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                신고 사유
              </span>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                className="mt-1 w-full h-9 px-3 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                disabled={submitting}
              >
                <option value="inappropriate">부적절한 내용</option>
                <option value="spam">스팸/광고</option>
                <option value="fake">허위 정보</option>
                <option value="copyright">저작권 침해</option>
                <option value="other">기타</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                상세 설명 (선택, 500자 이내)
              </span>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="구체적인 내용을 알려주시면 심사에 도움이 됩니다."
                className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none"
                disabled={submitting}
              />
              <span className="text-[10px] text-slate-400 mt-1 block text-right">
                {detail.length}/500
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="px-3 h-9 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="px-3 h-9 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? '제출 중...' : '신고 제출'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
