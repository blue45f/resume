import { useState, useRef } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';

interface Props {
  url: string;
  title: string;
  onClose: () => void;
}

export default function QrCodeModal({ url, title, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const qrRef = useRef<HTMLImageElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = async () => {
    setDownloading(true);
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `qr-${title.replace(/[^a-zA-Z0-9가-힣]/g, '_').slice(0, 30)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(qrImageUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=1e293b`;

  return (
    <RadixDialog.Root
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[90] bg-black/50 animate-fade-in" />
        <RadixDialog.Content
          aria-describedby={undefined}
          className="fixed z-[91] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto focus:outline-none"
        >
          <div className="flex items-center justify-between mb-4">
            <RadixDialog.Title className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              QR 코드 공유
            </RadixDialog.Title>
            <RadixDialog.Close asChild>
              <button
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xl"
                aria-label="닫기"
              >
                &times;
              </button>
            </RadixDialog.Close>
          </div>

          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 truncate">{title}</p>

          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-sm">
              <img
                ref={qrRef}
                src={qrImageUrl}
                alt="QR Code"
                className="w-48 h-48"
                loading="lazy"
              />
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={handleDownloadQr}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {downloading ? '다운로드 중...' : 'QR 이미지 저장'}
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={url}
              readOnly
              className="flex-1 px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-600 dark:text-neutral-300 truncate"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? '복사됨!' : '복사'}
            </button>
          </div>

          <div className="flex gap-2">
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 text-center text-sm bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
            >
              Twitter
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 text-center text-sm bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
            >
              LinkedIn
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`}
              className="flex-1 py-2 text-center text-sm bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
            >
              이메일
            </a>
          </div>

          <p className="text-xs text-neutral-400 text-center mt-3">
            모바일 카메라로 QR 코드를 스캔하면 이력서를 바로 볼 수 있습니다
          </p>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
