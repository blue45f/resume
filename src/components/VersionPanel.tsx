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

export default function VersionPanel({ resumeId, onClose, onRestore }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<Record<string, unknown> | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

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

  const handlePreview = async (versionId: string) => {
    if (activeVersionId === versionId) {
      setSelectedVersion(null);
      setActiveVersionId(null);
      return;
    }
    setPreviewLoading(true);
    setActiveVersionId(versionId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}/versions/${versionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedVersion(data);
      } else {
        setSelectedVersion(null);
      }
    } catch {
      setSelectedVersion(null);
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
      onRestore();
      await load();
    } catch {
      setError('복원에 실패했습니다');
    } finally {
      setRestoring(null);
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-label="버전 관리">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-lg sm:rounded-xl max-h-[85vh] flex flex-col rounded-t-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">버전 관리</h2>
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
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">이력서 수정 시 자동으로 이전 상태가 저장됩니다. 항목을 클릭하면 미리보기를 확인할 수 있습니다.</p>
              {versions.map((v, idx) => (
                <div key={v.id}>
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                      activeVersionId === v.id
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
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0">
                          v{v.versionNumber}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {idx === 0 ? '최신 버전' : `버전 ${v.versionNumber}`}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400" title={new Date(v.createdAt).toLocaleString('ko-KR')}>
                            {timeAgo(v.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRestore(v.id, v.versionNumber); }}
                      disabled={restoring === v.id}
                      className="ml-3 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shrink-0"
                      aria-label={`버전 ${v.versionNumber}으로 복원`}
                    >
                      {restoring === v.id ? '복원 중...' : '복원'}
                    </button>
                  </div>
                  {activeVersionId === v.id && renderPreview()}
                </div>
              ))}
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
