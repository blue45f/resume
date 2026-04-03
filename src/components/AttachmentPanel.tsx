import { useState, useEffect, useRef } from 'react';
import { API_URL } from '@/lib/config';


interface Attachment {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  description: string;
  downloadUrl: string;
  createdAt: string;
}

const CATEGORIES = [
  { value: 'certificate', label: '자격증/증명서' },
  { value: 'portfolio', label: '포트폴리오' },
  { value: 'document', label: '제출 서류' },
  { value: 'reference', label: '참고자료' },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📕';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
  return '📎';
}

interface Props {
  resumeId: string;
  onClose: () => void;
}

export default function AttachmentPanel({ resumeId, onClose }: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('document');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/resumes/${resumeId}/attachments`);
      if (res.ok) setAttachments(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [resumeId]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('description', description);

      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_URL}/api/resumes/${resumeId}/attachments`, {
          method: 'POST',
          headers,
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err.message || '업로드에 실패했습니다');
        }
      } catch {
        setError('업로드에 실패했습니다');
      }
    }

    setDescription('');
    if (fileRef.current) fileRef.current.value = '';
    setUploading(false);
    load();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 파일을 삭제하시겠습니까?`)) return;
    await fetch(`${API_URL}/api/attachments/${id}`, { method: 'DELETE' });
    load();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-label="첨부파일 관리">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-xl sm:rounded-xl max-h-[90vh] flex flex-col rounded-t-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">첨부파일</h2>
          <button onClick={onClose} className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg" aria-label="닫기">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {/* Upload area */}
          <div
            className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">파일을 드래그하거나 클릭하여 업로드</p>
            <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100"
                aria-label="파일 분류"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="설명 (선택)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 dark:text-slate-100"
              />
              <label className={`px-4 py-1.5 text-white text-sm font-medium rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 transition-colors ${uploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'}`}>
                {uploading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    업로드 중...
                  </span>
                ) : '파일 선택'}
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={e => handleUpload(e.target.files)}
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">PDF, 이미지, 문서 (최대 10MB)</p>
          </div>

          {error && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {/* File list */}
          {loading ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-4">불러오는 중...</p>
          ) : attachments.length === 0 ? (
            <p className="text-center text-slate-400 dark:text-slate-500 py-4 text-sm">첨부된 파일이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {attachments.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <span className="text-xl shrink-0" aria-hidden="true">{fileIcon(a.mimeType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{a.originalName}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">
                        {CATEGORIES.find(c => c.value === a.category)?.label || a.category}
                      </span>
                      <span>{formatSize(a.size)}</span>
                      {a.description && <span>· {a.description}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <a
                      href={a.downloadUrl.startsWith('http') ? a.downloadUrl : `${API_URL}${a.downloadUrl}`}
                      className="px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      download
                    >
                      다운로드
                    </a>
                    <button
                      onClick={() => handleDelete(a.id, a.originalName)}
                      className="px-2 py-1 text-xs text-red-600 bg-red-50 rounded hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label={`${a.originalName} 삭제`}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500">닫기</button>
        </div>
      </div>
    </div>
  );
}
