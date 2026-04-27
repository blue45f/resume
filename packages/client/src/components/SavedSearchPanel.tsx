import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchSavedJobSearches,
  createSavedJobSearch,
  toggleSavedJobSearchNotify,
  deleteSavedJobSearch,
  type SavedJobSearch,
} from '@/lib/api';
import { toast } from '@/components/Toast';

interface Props {
  /** 현재 검색 컨텍스트 — '이 검색 저장' 버튼 prefill 용 */
  currentSearch?: {
    query?: string;
    skills?: string;
    locations?: string;
    jobTypes?: string;
  };
}

/**
 * 저장된 채용 검색 패널 (Wanted / 잡코리아 패턴).
 * - 사용자당 max 10개
 * - notify on/off toggle — 매일 08 UTC cron 으로 새 매칭 공고 알림
 * - 클릭 시 해당 필터로 검색 (query string deeplink)
 */
export default function SavedSearchPanel({ currentSearch }: Props) {
  const [searches, setSearches] = useState<SavedJobSearch[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refresh = () => {
    fetchSavedJobSearches()
      .then((rows) => setSearches(rows || []))
      .catch(() => setSearches([]))
      .finally(() => setLoaded(true));
  };

  useEffect(() => {
    refresh();
  }, []);

  const hasFilter =
    !!currentSearch?.query ||
    !!currentSearch?.skills ||
    !!currentSearch?.locations ||
    !!currentSearch?.jobTypes;

  const handleSave = async () => {
    if (!hasFilter) {
      toast('저장할 검색 조건이 없어요. 키워드/스킬/지역 중 하나를 선택해주세요', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await createSavedJobSearch({
        name: name.trim() || currentSearch?.query || currentSearch?.skills || '내 검색',
        ...currentSearch,
        notifyOn: true,
      });
      toast('검색을 저장했어요. 새 공고가 올라오면 알림 발송됩니다', 'success');
      setShowSaveDialog(false);
      setName('');
      refresh();
    } catch (err: any) {
      toast(err?.message || '저장 실패', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (s: SavedJobSearch) => {
    try {
      await toggleSavedJobSearchNotify(s.id, !s.notifyOn);
      refresh();
    } catch (err: any) {
      toast(err?.message || '변경 실패', 'error');
    }
  };

  const handleDelete = async (s: SavedJobSearch) => {
    if (!confirm(`'${s.name || s.query}' 저장된 검색을 삭제할까요?`)) return;
    try {
      await deleteSavedJobSearch(s.id);
      toast('삭제됨', 'success');
      refresh();
    } catch (err: any) {
      toast(err?.message || '삭제 실패', 'error');
    }
  };

  const buildQueryString = (s: SavedJobSearch) => {
    const params = new URLSearchParams();
    if (s.query) params.set('q', s.query);
    if (s.skills) params.set('skills', s.skills);
    if (s.locations) params.set('locations', s.locations);
    if (s.jobTypes) params.set('types', s.jobTypes);
    return params.toString();
  };

  if (!loaded) return null;

  return (
    <section className="imp-card p-4 mb-4" aria-label="저장된 검색">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <span aria-hidden="true">🔖</span>
          저장된 검색
          {searches.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-full">
              {searches.length}
            </span>
          )}
        </h3>
        {hasFilter && searches.length < 10 && (
          <button
            onClick={() => setShowSaveDialog(true)}
            className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors inline-flex items-center gap-1"
          >
            ＋ 이 검색 저장
          </button>
        )}
      </div>

      {/* Save dialog inline */}
      {showSaveDialog && (
        <div className="mb-3 p-3 rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10 space-y-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 100))}
            placeholder="검색 이름 (예: 서울 React 시니어)"
            className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex flex-wrap gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            {currentSearch?.query && <span>키워드: {currentSearch.query}</span>}
            {currentSearch?.skills && <span>· 스킬: {currentSearch.skills}</span>}
            {currentSearch?.locations && <span>· 지역: {currentSearch.locations}</span>}
            {currentSearch?.jobTypes && <span>· 형태: {currentSearch.jobTypes}</span>}
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setName('');
              }}
              className="text-xs px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-700"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={submitting}
              className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? '저장 중...' : '저장 + 알림 켜기'}
            </button>
          </div>
        </div>
      )}

      {searches.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-3">
          {hasFilter
            ? '이 검색 조건을 저장하면 새 공고 시 알림 받을 수 있어요'
            : '검색 후 "이 검색 저장" 으로 새 공고 알림을 받아보세요'}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {searches.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-colors"
            >
              <Link
                to={`/jobs?${buildQueryString(s)}`}
                className="flex-1 min-w-0 hover:text-blue-600"
              >
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                  {s.name || s.query || '(이름 없음)'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {[s.query, s.skills, s.locations, s.jobTypes].filter(Boolean).join(' · ') ||
                    '필터 없음'}
                </p>
              </Link>
              <button
                onClick={() => handleToggle(s)}
                className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full transition-colors ${
                  s.notifyOn
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
                title={s.notifyOn ? '알림 끄기' : '알림 켜기'}
              >
                {s.notifyOn ? '🔔 ON' : '🔕 OFF'}
              </button>
              <button
                onClick={() => handleDelete(s)}
                className="shrink-0 text-slate-400 hover:text-rose-600 transition-colors px-1"
                title="삭제"
                aria-label="삭제"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
