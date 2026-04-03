import { useState, useEffect, useCallback } from 'react';
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
    const oldArr = Array.isArray(oldSnap[key]) ? oldSnap[key] as unknown[] : [];
    const newArr = Array.isArray(newSnap[key]) ? newSnap[key] as unknown[] : [];
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
    added: { label: '추가', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    removed: { label: '삭제', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    changed: { label: '변경', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    unchanged: { label: '동일', color: 'bg-slate-100 text-slate-500' },
  };
  const c = config[type];
  return <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${c.color}`}>{c.label}</span>;
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
      {diffs.map((d, i) => (
        <div key={i} className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{d.label}</span>
            <DiffBadge type={d.type} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(d.type === 'removed' || d.type === 'changed') && (
              <div className="p-1.5 bg-red-50 dark:bg-red-900/10 rounded border border-red-100 dark:border-red-900/20">
                <p className="text-red-700 dark:text-red-400 line-through break-words">
                  {d.oldValue && d.oldValue.length > 100 ? d.oldValue.substring(0, 100) + '...' : d.oldValue}
                </p>
              </div>
            )}
            {d.type === 'added' && <div />}
            {(d.type === 'added' || d.type === 'changed') && (
              <div className="p-1.5 bg-green-50 dark:bg-green-900/10 rounded border border-green-100 dark:border-green-900/20">
                <p className="text-green-700 dark:text-green-400 break-words">
                  {d.newValue && d.newValue.length > 100 ? d.newValue.substring(0, 100) + '...' : d.newValue}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
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
  const [diffTargetSnapshot, setDiffTargetSnapshot] = useState<Record<string, unknown> | null>(null);
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

  useEffect(() => { load(); }, [load]);

  const fetchSnapshot = async (versionId: string): Promise<Record<string, unknown> | null> => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}/versions/${versionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const snapshot = typeof data.snapshot === 'string' ? JSON.parse(data.snapshot) : data.snapshot;
        return snapshot;
      }
    } catch { /* empty */ }
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
      const snapshot = typeof selectedVersion.snapshot === 'string'
        ? JSON.parse(selectedVersion.snapshot as string)
        : selectedVersion.snapshot;
      if (!snapshot) return <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mt-2"><p className="text-xs text-slate-400">데이터 없음</p></div>;
      const s = snapshot as Record<string, unknown>;
      const experiences = Array.isArray(s.experiences) ? s.experiences : [];
      const educations = Array.isArray(s.educations) ? s.educations : [];
      const skills = Array.isArray(s.skills) ? s.skills : [];
      const projects = Array.isArray(s.projects) ? s.projects : [];
      const personalInfo = (s.personalInfo || {}) as Record<string, unknown>;
      return (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mt-2">
          <h4 className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">버전 미리보기</h4>
          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
            <p>제목: <strong>{(s.title as string) || '—'}</strong></p>
            <p>이름: {(personalInfo.name as string) || '—'}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {experiences.length > 0 && <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-700 dark:text-blue-300">경력 {experiences.length}</span>}
              {educations.length > 0 && <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 rounded text-green-700 dark:text-green-300">학력 {educations.length}</span>}
              {skills.length > 0 && <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded text-purple-700 dark:text-purple-300">기술 {skills.length}</span>}
              {projects.length > 0 && <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded text-amber-700 dark:text-amber-300">프로젝트 {projects.length}</span>}
            </div>
          </div>
        </div>
      );
    } catch {
      return <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mt-2"><p className="text-xs text-slate-400">미리보기 불가</p></div>;
    }
  };

  const getVersionLabel = (id: string) => {
    const v = versions.find(v => v.id === id);
    return v ? `v${v.versionNumber}` : '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-label="버전 관리">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-lg sm:rounded-xl max-h-[85vh] flex flex-col rounded-t-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">버전 관리</h2>
            {versions.length >= 2 && (
              <button
                onClick={toggleDiffMode}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  diffMode
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Diff mode instructions */}
        {diffMode && (
          <div className="px-4 sm:px-6 py-2 bg-purple-50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-900/20">
            <p className="text-xs text-purple-700 dark:text-purple-400">
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
            <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div role="status" className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>
          )}

          {loading ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8" aria-live="polite">불러오는 중...</p>
          ) : versions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400 mb-1">저장된 버전이 없습니다</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">이력서를 수정하면 자동으로 버전이 생성됩니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {!diffMode && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">이력서 수정 시 자동으로 이전 상태가 저장됩니다. 항목을 클릭하면 미리보기를 확인할 수 있습니다.</p>
              )}
              {versions.map((v, idx) => (
                <div key={v.id}>
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                      diffMode && (diffBaseId === v.id || diffTargetId === v.id)
                        ? diffBaseId === v.id
                          ? 'border-purple-400 dark:border-purple-500 bg-purple-50/50 dark:bg-purple-900/10'
                          : 'border-orange-400 dark:border-orange-500 bg-orange-50/50 dark:bg-orange-900/10'
                        : activeVersionId === v.id
                        ? 'border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                    onClick={() => handlePreview(v.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePreview(v.id); } }}
                    aria-expanded={activeVersionId === v.id}
                    aria-label={`버전 ${v.versionNumber} 미리보기`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                          diffMode && diffBaseId === v.id
                            ? 'bg-purple-100 text-purple-700'
                            : diffMode && diffTargetId === v.id
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          v{v.versionNumber}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {idx === 0 ? '최신 버전' : `버전 ${v.versionNumber}`}
                            </p>
                            {diffMode && diffBaseId === v.id && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">기준</span>
                            )}
                            {diffMode && diffTargetId === v.id && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">비교</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400" title={new Date(v.createdAt).toLocaleString('ko-KR')}>
                            {timeAgo(v.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {!diffMode && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRestore(v.id, v.versionNumber); }}
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
                <div className="mt-4 border border-purple-200 dark:border-purple-800 rounded-xl overflow-hidden">
                  <div className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800 flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-purple-700 dark:text-purple-400">
                      {getVersionLabel(diffBaseId)} &rarr; {getVersionLabel(diffTargetId)} 변경사항
                    </h4>
                    <span className="text-xs text-purple-500 dark:text-purple-500">
                      {diffs.length}개 차이
                    </span>
                  </div>
                  <div className="p-3">
                    {diffLoading ? (
                      <p className="text-center text-xs text-slate-400 py-4">비교 분석 중...</p>
                    ) : (
                      <DiffViewer diffs={diffs} />
                    )}
                  </div>
                  {/* Restore button for target version */}
                  {diffTargetId && (
                    <div className="px-3 py-2 border-t border-purple-100 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
                      <button
                        onClick={() => {
                          const targetVersion = versions.find(v => v.id === diffTargetId);
                          if (targetVersion) handleRestore(diffTargetId, targetVersion.versionNumber);
                        }}
                        disabled={!!restoring}
                        className="w-full px-3 py-2 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
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
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
