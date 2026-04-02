import { useState } from 'react';

interface Props {
  url: string;
  title: string;
  onClose: () => void;
}

// Simple QR-like share modal with URL display and copy
export default function QrCodeModal({ url, title, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate a simple QR code using a public API (Google Charts)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=1e293b`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">공유하기</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl">&times;</button>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 truncate">{title}</p>

        {/* QR Code */}
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <img src={qrImageUrl} alt="QR Code" className="w-48 h-48" loading="lazy" />
          </div>
        </div>

        {/* URL */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={url}
            readOnly
            className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 truncate"
          />
          <button
            onClick={handleCopy}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {copied ? '복사됨!' : '복사'}
          </button>
        </div>

        {/* Share buttons */}
        <div className="flex gap-2">
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 text-center text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Twitter
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 text-center text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            LinkedIn
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`}
            className="flex-1 py-2 text-center text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            이메일
          </a>
        </div>
      </div>
    </div>
  );
}
