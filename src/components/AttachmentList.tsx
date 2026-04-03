import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/config';


interface Attachment {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  downloadUrl: string;
}

interface Props {
  resumeId: string;
}

const categoryLabels: Record<string, string> = {
  certificate: '자격증', portfolio: '포트폴리오', document: '서류', reference: '참고자료',
};

function fileIcon(mime: string) {
  if (mime.startsWith('image/')) return '🖼️';
  if (mime === 'application/pdf') return '📕';
  if (mime.includes('word')) return '📝';
  if (mime.includes('sheet') || mime.includes('excel')) return '📊';
  return '📎';
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function AttachmentList({ resumeId }: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/resumes/${resumeId}/attachments`)
      .then(r => r.ok ? r.json() : [])
      .then(setAttachments)
      .catch(() => {});
  }, [resumeId]);

  if (attachments.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 no-print">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
        첨부파일 ({attachments.length})
      </h3>
      <div className="space-y-2">
        {attachments.map(a => (
          <a
            key={a.id}
            href={a.downloadUrl.startsWith('http') ? a.downloadUrl : `${API_URL}${a.downloadUrl}`}
            download
            className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
          >
            <span className="text-lg shrink-0">{fileIcon(a.mimeType)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 dark:text-slate-300 truncate group-hover:text-blue-600">{a.originalName}</p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{categoryLabels[a.category] || a.category}</span>
                <span>·</span>
                <span>{formatSize(a.size)}</span>
              </div>
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
