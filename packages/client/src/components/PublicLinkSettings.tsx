import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/components/Toast';
import { updateResumeSlug } from '@/lib/api';
import { getUser } from '@/lib/auth';

interface Props {
  resumeId: string;
  currentSlug?: string;
  ownerName?: string;
  onSlugUpdated?: (newSlug: string) => void;
}

export default function PublicLinkSettings({
  resumeId,
  currentSlug,
  ownerName,
  onSlugUpdated,
}: Props) {
  const [slug, setSlug] = useState(currentSlug || '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  useEffect(() => {
    if (currentSlug) setSlug(currentSlug);
  }, [currentSlug]);

  const user = getUser();
  const username = ownerName || user?.name || 'user';
  const shortCode = resumeId.slice(0, 8);
  const shortUrl = `${window.location.origin}/r/${shortCode}`;
  const previewUrl = slug
    ? `${window.location.origin}/@${encodeURIComponent(username)}/${encodeURIComponent(slug)}`
    : window.location.href;

  const generateSlug = useCallback(() => {
    const base = (ownerName || 'resume')
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 30);
    const suffix = Math.random().toString(36).slice(2, 6);
    setSlug(`${base}-${suffix}`);
    setEditing(true);
  }, [ownerName]);

  const handleSave = async () => {
    if (!slug.trim()) {
      toast('슬러그를 입력해 주세요', 'error');
      return;
    }
    const sanitized = slug
      .toLowerCase()
      .replace(/[^a-z0-9가-힣-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (!sanitized) {
      toast('유효한 슬러그를 입력해 주세요', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateResumeSlug(resumeId, sanitized);
      setSlug(sanitized);
      setEditing(false);
      onSlugUpdated?.(sanitized);
      toast('공개 링크가 업데이트되었습니다', 'success');
    } catch (err: any) {
      toast(err?.message || '슬러그 저장 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(previewUrl).then(() => {
      setCopied(true);
      toast('공개 링크가 복사되었습니다', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const embedCode = `<iframe src="${previewUrl}" width="100%" height="900" style="border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.12);" title="이력서" loading="lazy"></iframe>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setEmbedCopied(true);
      toast('임베드 코드가 복사되었습니다', 'success');
      setTimeout(() => setEmbedCopied(false), 2000);
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          공개 링크 설정
        </h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
          >
            편집
          </button>
        )}
      </div>

      {/* Short URL — main[--preview-theme-accent] 컨텍스트에서 이력서 테마 색 따라감 */}
      <div className="mb-2 px-3 py-2 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800 resume-theme-accent-soft-bg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-sky-700 dark:text-sky-400 font-semibold uppercase tracking-[0.15em] mb-0.5">
              숏링크
            </p>
            <p className="text-sm text-sky-900 dark:text-sky-200 font-mono font-medium break-all">
              {shortUrl}
            </p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(shortUrl);
              toast('숏링크가 복사되었습니다', 'success');
            }}
            className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            복사
          </button>
        </div>
      </div>

      {/* Full URL */}
      <div className="mb-3 px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <p className="text-[11px] text-slate-400 mb-0.5">전체 공개 URL</p>
        <p className="text-xs text-blue-600 dark:text-blue-400 break-all font-mono">{previewUrl}</p>
      </div>

      {editing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono">/@{username}/</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9가-힣-]/g, ''))
              }
              placeholder="my-resume"
              className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
              maxLength={60}
            />
            <button
              onClick={generateSlug}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              title="자동 생성"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={() => {
                setSlug(currentSlug || '');
                setEditing(false);
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
            {copied ? '복사됨!' : '링크 복사'}
          </button>
          {!slug && (
            <button
              onClick={generateSlug}
              className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              슬러그 생성
            </button>
          )}
        </div>
      )}

      {/* Embed Code Section */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={() => setShowEmbed(!showEmbed)}
          className="w-full flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <span className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            임베드 코드
          </span>
          <svg
            className={`w-3.5 h-3.5 transition-transform ${showEmbed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showEmbed && (
          <div className="mt-2 space-y-2">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              다른 웹사이트나 블로그에 이력서를 삽입하세요
            </p>
            <div className="relative">
              <code className="block px-3 py-2 text-[10px] font-mono bg-slate-900 dark:bg-slate-950 text-green-400 rounded-lg overflow-x-auto whitespace-nowrap border border-slate-700">
                {embedCode}
              </code>
            </div>
            <button
              onClick={handleCopyEmbed}
              className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                embedCopied
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-700 text-white hover:bg-slate-600'
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              {embedCopied ? '복사됨!' : '임베드 코드 복사'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
