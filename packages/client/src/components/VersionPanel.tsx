import { useState, useEffect, useCallback, type ReactNode } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { fetchVersions, restoreVersion } from '@/lib/api';
import { timeAgo } from '@/lib/time';
import { API_URL } from '@/lib/config';

interface Version {
  id: string;
  versionNumber: number;
  description: string;
  createdAt: string;
}

interface Props {
  resumeId: string;
  onClose: () => void;
  onRestore: () => void;
}

type DiffChangeType = 'added' | 'removed' | 'changed' | 'unchanged';

interface DiffItem {
  field: string;
  label: string;
  type: DiffChangeType;
  oldValue?: string;
  newValue?: string;
}

function diffSnapshots(
  oldSnap: Record<string, unknown> | null,
  newSnap: Record<string, unknown> | null,
): DiffItem[] {
  if (!oldSnap || !newSnap) return [];

  const fieldLabels: Record<string, string> = {
    title: '제목',
    'personalInfo.name': '이름',
    'personalInfo.email': '이메일',
    'personalInfo.phone': '전화번호',
    'personalInfo.address': '주소',
    'personalInfo.website': '웹사이트',
    'personalInfo.summary': '자기소개',
    'personalInfo.github': 'GitHub',
    'personalInfo.birthYear': '생년',
    'personalInfo.military': '병역사항',
  };

  const getDeep = (obj: Record<string, unknown>, path: string): unknown => {
    return path.split('.').reduce((acc: unknown, key) => {
      if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
      return undefined;
    }, obj);
  };

  const stripHtml = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return s.replace(/<[^>]*>/g, '').trim();
  };

  const diffs: DiffItem[] = [];

  // Compare scalar fields
  for (const [path, label] of Object.entries(fieldLabels)) {
    const oldVal = stripHtml(getDeep(oldSnap, path));
    const newVal = stripHtml(getDeep(newSnap, path));
    if (oldVal === newVal) continue;
    if (!oldVal && newVal) {
      diffs.push({ field: path, label, type: 'added', newValue: newVal });
    } else if (oldVal && !newVal) {
      diffs.push({ field: path, label, type: 'removed', oldValue: oldVal });
    } else {
      diffs.push({ field: path, label, type: 'changed', oldValue: oldVal, newValue: newVal });
    }
  }

  // Compare array sections by count and content hash
  const arraySections: [string, string][] = [
    ['experiences', '경력'],
    ['educations', '학력'],
    ['skills', '기술'],
    ['projects', '프로젝트'],
    ['certifications', '자격증'],
    ['languages', '어학'],
    ['awards', '수상'],
    ['activities', '활동'],
  ];

  for (const [key, label] of arraySections) {
    const oldArr = Array.isArray(oldSnap[key]) ? (oldSnap[key] as unknown[]) : [];
    const newArr = Array.isArray(newSnap[key]) ? (newSnap[key] as unknown[]) : [];
    const oldJson = JSON.stringify(oldArr);
    const newJson = JSON.stringify(newArr);
    if (oldJson === newJson) continue;

    if (oldArr.length === 0 && newArr.length > 0) {
      diffs.push({ field: key, label, type: 'added', newValue: `${newArr.length}건 추가` });
    } else if (oldArr.length > 0 && newArr.length === 0) {
      diffs.push({ field: key, label, type: 'removed', oldValue: `${oldArr.length}건 삭제` });
    } else {
      const countDiff = newArr.length - oldArr.length;
      const countText = countDiff > 0 ? `(+${countDiff})` : countDiff < 0 ? `(${countDiff})` : '';
      diffs.push({
        field: key,
        label,
        type: 'changed',
        oldValue: `${oldArr.length}건`,
        newValue: `${newArr.length}건 ${countText}`,
      });
    }
  }

  return diffs;
}

function DiffBadge({ type }: { type: DiffChangeType }) {
  const config = {
    added: {
      label: '추가',
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    removed: {
      label: '삭제',
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
    changed: {
      label: '변경',
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
    unchanged: { label: '동일', color: 'bg-slate-100 text-slate-500' },
  };
  const c = config[type];
  return <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${c.color}`}>{c.label}</span>;
}

/**
 * LCS (Longest Common Subsequence) 기반 word-level diff.
 *
 * Set 기반 휴리스틱과 달리 토큰 순서/중복을 정확히 처리.
 * 예: '나는 카카오 다녔다' vs '카카오 나는 다녔다' — Set 은 차이 없다고 판단하지만
 * LCS 는 '나는' / '카카오' 위치 변경을 인식.
 *
 * O(N*M) 시간 — 이력서 문장(수백 토큰)에서 충분히 빠름.
 */
function wordDiff(oldText: string, newText: string): { old: ReactNode; nw: ReactNode } {
  const oldTokens = oldText.split(/(\s+)/);
  const newTokens = newText.split(/(\s+)/);
  const N = oldTokens.length;
  const M = newTokens.length;

  // dp[i][j] = LCS length of oldTokens[0..i) vs newTokens[0..j)
  const dp: number[][] = Array.from({ length: N + 1 }, () => new Array(M + 1).fill(0));
  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= M; j++) {
      if (oldTokens[i - 1] === newTokens[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // backtrack — 각 토큰을 'common' / 'removed' / 'added' 로 분류
  const oldFlags: Array<'common' | 'removed'> = new Array(N).fill('removed');
  const newFlags: Array<'common' | 'added'> = new Array(M).fill('added');
  let i = N;
  let j = M;
  while (i > 0 && j > 0) {
    if (oldTokens[i - 1] === newTokens[j - 1]) {
      oldFlags[i - 1] = 'common';
      newFlags[j - 1] = 'common';
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  const oldRendered = oldTokens.map((t, idx) =>
    oldFlags[idx] === 'removed' && t.trim() ? (
      <mark
        key={idx}
        className="bg-red-200/70 dark:bg-red-900/40 text-red-800 dark:text-red-300 rounded px-0.5"
      >
        {t}
      </mark>
    ) : (
      <span key={idx}>{t}</span>
    ),
  );
  const newRendered = newTokens.map((t, idx) =>
    newFlags[idx] === 'added' && t.trim() ? (
      <mark
        key={idx}
        className="bg-emerald-200/70 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded px-0.5"
      >
        {t}
      </mark>
    ) : (
      <span key={idx}>{t}</span>
    ),
  );
  return { old: oldRendered, nw: newRendered };
}

function DiffValue({ text, kind }: { text: string; kind: 'old' | 'new' }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 100;
  const display = long && !expanded ? text.substring(0, 100) + '…' : text;
  const cls =
    kind === 'old'
      ? 'text-red-700 dark:text-red-400 line-through break-words whitespace-pre-wrap'
      : 'text-green-700 dark:text-green-400 break-words whitespace-pre-wrap';
  return (
    <>
      <p className={cls}>{display}</p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline"
        >
          {expanded ? '접기' : `전체 보기 (+${text.length - 100}자)`}
        </button>
      )}
    </>
  );
}

function DiffViewer({ diffs }: { diffs: DiffItem[] }) {
  if (diffs.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-slate-400 dark:text-slate-500">
        두 버전 간 차이가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {diffs.map((d, i) => {
        const wordHighlight =
          d.type === 'changed' && d.oldValue && d.newValue && d.oldValue.length < 500
            ? wordDiff(d.oldValue, d.newValue)
            : null;
        return (
          <div
            key={i}
            className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {d.label}
              </span>
              <DiffBadge type={d.type} />
            </div>
            <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {(d.type === 'removed' || d.type === 'changed') && (
                <div className="p-1.5 bg-red-50 dark:bg-red-900/10 rounded border border-red-100 dark:border-red-900/20">
                  {wordHighlight ? (
                    <p className="text-red-700 dark:text-red-400 line-through break-words whitespace-pre-wrap">
                      {wordHighlight.old}
                    </p>
                  ) : (
                    <DiffValue text={d.oldValue || ''} kind="old" />
                  )}
                </div>
              )}
              {d.type === 'added' && <div className="hidden sm:block" />}
              {(d.type === 'added' || d.type === 'changed') && (
                <div className="p-1.5 bg-green-50 dark:bg-green-900/10 rounded border border-green-100 dark:border-green-900/20">
                  {wordHighlight ? (
                    <p className="text-green-700 dark:text-green-400 break-words whitespace-pre-wrap">
                      {wordHighlight.nw}
                    </p>
                  ) : (
                    <DiffValue text={d.newValue || ''} kind="new" />
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function VersionPanel({ resumeId, onClose, onRestore }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<Record<string, unknown> | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

  // Diff mode state
  const [diffMode, setDiffMode] = useState(false);
  const [diffBaseId, setDiffBaseId] = useState<string | null>(null);
  const [diffTargetId, setDiffTargetId] = useState<string | null>(null);
  const [diffBaseSnapshot, setDiffBaseSnapshot] = useState<Record<string, unknown> | null>(null);
  const [, setDiffTargetSnapshot] = useState<Record<string, unknown> | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffs, setDiffs] = useState<DiffItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchVersions(resumeId);
      setVersions(data);
    } catch {
      setError('버전 목록을 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [resumeId]);

  useEffect(() => {
    load();
  }, [load]);

  const fetchSnapshot = async (versionId: string): Promise<Record<string, unknown> | null> => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}/versions/${versionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const snapshot =
          typeof data.snapshot === 'string' ? JSON.parse(data.snapshot) : data.snapshot;
        return snapshot;
      }
    } catch {
      /* empty */
    }
    return null;
  };

  const handlePreview = async (versionId: string) => {
    if (diffMode) {
      // In diff mode, handle selection of base/target
      if (!diffBaseId) {
        setDiffBaseId(versionId);
        return;
      }
      if (diffBaseId === versionId) {
        setDiffBaseId(null);
        setDiffBaseSnapshot(null);
        setDiffs([]);
        return;
      }
      if (diffTargetId === versionId) {
        setDiffTargetId(null);
        setDiffTargetSnapshot(null);
        setDiffs([]);
        return;
      }
      setDiffTargetId(versionId);
      setDiffLoading(true);
      try {
        const [baseSnap, targetSnap] = await Promise.all([
          diffBaseSnapshot || fetchSnapshot(diffBaseId),
          fetchSnapshot(versionId),
        ]);
        setDiffBaseSnapshot(baseSnap);
        setDiffTargetSnapshot(targetSnap);
        if (baseSnap && targetSnap) {
          setDiffs(diffSnapshots(baseSnap, targetSnap));
        }
      } finally {
        setDiffLoading(false);
      }
      return;
    }

    // Normal preview mode
    if (activeVersionId === versionId) {
      setSelectedVersion(null);
      setActiveVersionId(null);
      return;
    }
    setPreviewLoading(true);
    setActiveVersionId(versionId);
    try {
      const snapshot = await fetchSnapshot(versionId);
      setSelectedVersion(snapshot ? { snapshot } : null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRestore = async (versionId: string, versionNumber: number) => {
    if (!confirm(`버전 ${versionNumber}으로 복원하시겠습니까? 현재 내용이 덮어씌워집니다.`)) return;
    setRestoring(versionId);
    setError('');
    setSuccess('');
    try {
      const result = await restoreVersion(resumeId, versionId);
      setSuccess(`버전 ${result.restoredVersion}으로 복원되었습니다`);
      setSelectedVersion(null);
      setActiveVersionId(null);
      setDiffMode(false);
      setDiffBaseId(null);
      setDiffTargetId(null);
      setDiffs([]);
      onRestore();
      await load();
    } catch {
      setError('복원에 실패했습니다');
    } finally {
      setRestoring(null);
    }
  };

  const toggleDiffMode = () => {
    const next = !diffMode;
    setDiffMode(next);
    if (!next) {
      setDiffBaseId(null);
      setDiffTargetId(null);
      setDiffBaseSnapshot(null);
      setDiffTargetSnapshot(null);
      setDiffs([]);
    } else {
      setSelectedVersion(null);
      setActiveVersionId(null);
    }
  };

  const renderPreview = () => {
    if (!selectedVersion) return null;
    if (previewLoading) {
      return (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mt-2">
          <p className="text-xs text-slate-500">불러오는 중...</p>
        </div>
      );
    }
    try {
      const snapshot =
        typeof selectedVersion.snapshot === 'string'
          ? JSON.parse(selectedVersion.snapshot as string)
          : selectedVersion.snapshot;
      if (!snapshot)
        return (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">데이터 없음</p>
          </div>
        );
      const s = snapshot as Record<string, unknown>;
      const experiences = Array.isArray(s.experiences) ? s.experiences : [];
      const educations = Array.isArray(s.educations) ? s.educations : [];
      const skills = Array.isArray(s.skills) ? s.skills : [];
      const projects = Array.isArray(s.projects) ? s.projects : [];
      const personalInfo = (s.personalInfo || {}) as Record<string, unknown>;
      return (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mt-2">
          <h4 className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">
            버전 미리보기
          </h4>
          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <p>
              제목: <strong>{(s.title as string) || '—'}</strong>
            </p>
            <p>이름: {(personalInfo.name as string) || '—'}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {experiences.length > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-700 dark:text-blue-300">
                  경력 {experiences.length}
                </span>
              )}
              {educations.length > 0 && (
                <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 rounded text-green-700 dark:text-green-300">
                  학력 {educations.length}
                </span>
              )}
              {skills.length > 0 && (
                <span className="px-1.5 py-0.5 bg-sky-100 dark:bg-sky-900/30 rounded text-sky-700 dark:text-sky-300">
                  기술 {skills.length}
                </span>
              )}
              {projects.length > 0 && (
                <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded text-amber-700 dark:text-amber-300">
                  프로젝트 {projects.length}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    } catch {
      return (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">미리보기 불가</p>
        </div>
      );
    }
  };

  const getVersionLabel = (id: string) => {
    const v = versions.find((v) => v.id === id);
    return v ? `v${v.versionNumber}` : '';
  };

  return (
    <RadixDialog.Root
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[90] bg-black/40 animate-fade-in" />
        <RadixDialog.Content
          aria-label="버전 관리"
          aria-describedby={undefined}
          className="fixed z-[91] left-1/2 bottom-0 sm:top-1/2 sm:-translate-y-1/2 -translate-x-1/2 w-full sm:max-w-lg bg-white dark:bg-neutral-800 sm:rounded-xl max-h-[90dvh] flex flex-col rounded-t-xl overflow-hidden focus:outline-none animate-fade-in-up"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              <RadixDialog.Title className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                버전 관리
              </RadixDialog.Title>
              {versions.length >= 2 && (
                <button
                  onClick={toggleDiffMode}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    diffMode
                      ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {diffMode ? '비교 중' : '버전 비교'}
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
              aria-label="닫기"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
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

          {/* Diff mode instructions */}
          {diffMode && (
            <div className="px-4 sm:px-6 py-2 bg-sky-50 dark:bg-sky-900/10 border-b border-blue-100 dark:border-sky-900/20">
              <p className="text-xs text-sky-700 dark:text-sky-400">
                {!diffBaseId
                  ? '비교할 기준 버전을 선택하세요.'
                  : !diffTargetId
                    ? `기준: ${getVersionLabel(diffBaseId)} 선택됨. 비교 대상 버전을 선택하세요.`
                    : `${getVersionLabel(diffBaseId)} vs ${getVersionLabel(diffTargetId)} 비교 결과`}
              </p>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            {error && (
              <div
                role="alert"
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
              >
                {error}
              </div>
            )}
            {success && (
              <div
                role="status"
                className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700"
              >
                {success}
              </div>
            )}

            {loading ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8" aria-live="polite">
                불러오는 중...
              </p>
            ) : versions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 dark:text-slate-400 mb-1">저장된 버전이 없습니다</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  이력서를 수정하면 자동으로 버전이 생성됩니다
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {!diffMode && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    이력서 수정 시 자동으로 이전 상태가 저장됩니다. 항목을 클릭하면 미리보기를
                    확인할 수 있습니다.
                  </p>
                )}
                {versions.map((v, idx) => (
                  <div key={v.id}>
                    <div
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                        diffMode && (diffBaseId === v.id || diffTargetId === v.id)
                          ? diffBaseId === v.id
                            ? 'border-sky-400 dark:border-sky-500 bg-sky-50/50 dark:bg-sky-900/10'
                            : 'border-orange-400 dark:border-orange-500 bg-orange-50/50 dark:bg-orange-900/10'
                          : activeVersionId === v.id
                            ? 'border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                      onClick={() => handlePreview(v.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handlePreview(v.id);
                        }
                      }}
                      aria-expanded={activeVersionId === v.id}
                      aria-label={`버전 ${v.versionNumber} 미리보기`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                              diffMode && diffBaseId === v.id
                                ? 'bg-sky-100 text-sky-700'
                                : diffMode && diffTargetId === v.id
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            v{v.versionNumber}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                {idx === 0 ? '최신 버전' : `버전 ${v.versionNumber}`}
                              </p>
                              {diffMode && diffBaseId === v.id && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                                  기준
                                </span>
                              )}
                              {diffMode && diffTargetId === v.id && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                                  비교
                                </span>
                              )}
                            </div>
                            <p
                              className="text-xs text-slate-500 dark:text-slate-400"
                              title={new Date(v.createdAt).toLocaleString('ko-KR')}
                            >
                              {timeAgo(v.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {!diffMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(v.id, v.versionNumber);
                          }}
                          disabled={restoring === v.id}
                          className="ml-3 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shrink-0"
                          aria-label={`버전 ${v.versionNumber}으로 복원`}
                        >
                          {restoring === v.id ? '복원 중...' : '복원'}
                        </button>
                      )}
                    </div>
                    {!diffMode && activeVersionId === v.id && renderPreview()}
                  </div>
                ))}

                {/* Diff Result */}
                {diffMode && diffBaseId && diffTargetId && (
                  <div className="mt-4 border border-sky-200 dark:border-sky-800 rounded-xl overflow-hidden">
                    <div className="px-3 py-2 bg-sky-50 dark:bg-sky-900/20 border-b border-sky-200 dark:border-sky-800 flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                        {getVersionLabel(diffBaseId)} &rarr; {getVersionLabel(diffTargetId)}{' '}
                        변경사항
                      </h4>
                      <span className="text-xs text-sky-500 dark:text-sky-500">
                        {diffs.length}개 차이
                      </span>
                    </div>
                    <div className="p-3">
                      {diffLoading ? (
                        <p className="text-center text-xs text-slate-500 dark:text-slate-400 py-4">
                          비교 분석 중...
                        </p>
                      ) : (
                        <DiffViewer diffs={diffs} />
                      )}
                    </div>
                    {/* Restore button for target version */}
                    {diffTargetId && (
                      <div className="px-3 py-2 border-t border-blue-100 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-900/10">
                        <button
                          onClick={() => {
                            const targetVersion = versions.find((v) => v.id === diffTargetId);
                            if (targetVersion)
                              handleRestore(diffTargetId, targetVersion.versionNumber);
                          }}
                          disabled={!!restoring}
                          className="w-full px-3 py-2 text-xs font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors"
                        >
                          {restoring ? '복원 중...' : `${getVersionLabel(diffTargetId)}으로 복원`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 border-t border-neutral-200 dark:border-neutral-700">
            <RadixDialog.Close asChild>
              <button className="w-full px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
                닫기
              </button>
            </RadixDialog.Close>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
