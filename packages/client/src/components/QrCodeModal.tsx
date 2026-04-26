import { useRef, useState } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';

interface Props {
  url: string;
  title: string;
  onClose: () => void;
}

/**
 * QrCodeModal — 업그레이드된 QR 공유 다이얼로그.
 * Sapphire 그라디언트 프레임 + subtle ambient glow + 동선 명확한 CTA 재배치.
 * 기능: 다운로드 / URL 복사 / SNS 공유 (Twitter, LinkedIn, Email).
 */
export default function QrCodeModal({ url, title, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const qrRef = useRef<HTMLImageElement>(null);

  // Monochrome QR using sapphire color for foreground — matches Impeccable system.
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    url,
  )}&bgcolor=ffffff&color=0c4a6e&margin=2`;

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

  return (
    <RadixDialog.Root
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[90] bg-slate-900/60 animate-fade-in" />
        <RadixDialog.Content
          aria-describedby={undefined}
          className="fixed z-[91] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto focus:outline-none border border-slate-200 dark:border-neutral-700 relative"
        >
          {/* Ambient sapphire glow */}
          <div
            aria-hidden
            className="absolute -top-24 -left-16 w-56 h-56 rounded-full opacity-20 dark:opacity-25 blur-3xl pointer-events-none bg-[radial-gradient(circle,#38bdf8,transparent_70%)]"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -right-10 w-48 h-48 rounded-full opacity-15 dark:opacity-20 blur-3xl pointer-events-none bg-[radial-gradient(circle,#2563eb,transparent_70%)]"
          />

          <div className="flex items-center justify-between mb-4 relative">
            <RadixDialog.Title className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-lg text-white text-xs font-bold flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 60%, #0c4a6e 100%)',
                }}
                aria-hidden
              >
                ◼
              </span>
              QR 코드 공유
            </RadixDialog.Title>
            <RadixDialog.Close asChild>
              <button
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xl focus-ring-accent rounded-md px-1"
                aria-label="닫기"
              >
                &times;
              </button>
            </RadixDialog.Close>
          </div>

          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 truncate relative">
            {title}
          </p>

          {/* QR frame with sapphire gradient border */}
          <div className="flex justify-center mb-5 relative">
            <div
              className="p-[2px] rounded-2xl shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 55%, #0c4a6e 100%)',
              }}
            >
              <div className="p-4 bg-white rounded-[14px]">
                <img
                  ref={qrRef}
                  src={qrImageUrl}
                  alt="QR Code"
                  className="w-56 h-56"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-4 relative">
            <button
              onClick={handleDownloadQr}
              disabled={downloading}
              className="imp-btn flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 focus-ring-accent"
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

          <div className="flex gap-2 mb-4 relative">
            <input
              type="text"
              value={url}
              readOnly
              aria-label="이력서 URL"
              className="flex-1 px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-600 dark:text-neutral-300 truncate focus-ring-accent"
            />
            <button
              onClick={handleCopy}
              aria-label="URL 복사"
              className={`imp-btn px-4 py-2 text-sm font-medium rounded-lg transition-colors focus-ring-accent ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
              }`}
            >
              {copied ? '복사됨!' : '복사'}
            </button>
          </div>

          <div className="flex gap-2 relative">
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

          <p className="text-xs text-neutral-400 text-center mt-4 relative">
            모바일 카메라로 QR 코드를 스캔하면 이력서를 바로 볼 수 있습니다
          </p>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
