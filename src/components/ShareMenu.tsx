import { useState, useRef, useEffect } from 'react';
import { toast } from '@/components/Toast';

interface ShareMenuProps {
  url: string;
  title: string;
  description?: string;
}

export default function ShareMenu({ url, title, description }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast('링크가 복사되었습니다', 'success');
    setOpen(false);
  };

  const shareKakaoTalk = () => {
    // 카카오톡 공유 (모바일: scheme, 웹: 링크 복사 안내)
    const kakaoUrl = `https://story.kakao.com/share?url=${encodeURIComponent(url)}`;
    window.open(kakaoUrl, '_blank', 'width=600,height=500');
    setOpen(false);
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=500');
    setOpen(false);
  };

  const shareInstagram = () => {
    // 인스타그램은 직접 공유 API가 없으므로 링크 복사 후 안내
    navigator.clipboard.writeText(url);
    toast('링크가 복사되었습니다. 인스타그램 스토리나 DM에 붙여넣기하세요.', 'success');
    setOpen(false);
  };

  const shareLine = () => {
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=500');
    setOpen(false);
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=500');
    setOpen(false);
  };

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=500');
    setOpen(false);
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${description || title}\n\n${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    setOpen(false);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description || title, url });
      } catch {}
    }
    setOpen(false);
  };

  const btnClass = 'w-full px-3 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 transition-colors';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
        aria-label="공유"
        title="공유"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 py-1 animate-scale-in">
          {/* 링크 복사 */}
          <button onClick={copyLink} className={btnClass}>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            링크 복사
          </button>

          {/* 기기 공유 (모바일) */}
          {navigator.share && (
            <button onClick={nativeShare} className={btnClass}>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              기기 공유
            </button>
          )}

          <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

          {/* 카카오톡 */}
          <button onClick={shareKakaoTalk} className={btnClass}>
            <span className="w-4 h-4 bg-yellow-400 rounded-sm flex items-center justify-center">
              <span className="text-[10px] font-black text-yellow-900">K</span>
            </span>
            카카오톡
          </button>

          {/* LINE */}
          <button onClick={shareLine} className={btnClass}>
            <span className="w-4 h-4 bg-green-500 rounded-sm flex items-center justify-center">
              <span className="text-[10px] font-black text-white">L</span>
            </span>
            LINE
          </button>

          {/* Facebook */}
          <button onClick={shareFacebook} className={btnClass}>
            <span className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
              <span className="text-[10px] font-black text-white">f</span>
            </span>
            Facebook
          </button>

          {/* Instagram */}
          <button onClick={shareInstagram} className={btnClass}>
            <span className="w-4 h-4 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-sm flex items-center justify-center">
              <span className="text-[10px] font-black text-white">ig</span>
            </span>
            Instagram
          </button>

          <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

          {/* X (Twitter) */}
          <button onClick={shareTwitter} className={btnClass}>
            <span className="w-4 h-4 bg-black dark:bg-white rounded-sm flex items-center justify-center">
              <span className="text-[10px] font-black text-white dark:text-black">X</span>
            </span>
            X (Twitter)
          </button>

          {/* LinkedIn */}
          <button onClick={shareLinkedIn} className={btnClass}>
            <span className="w-4 h-4 bg-blue-700 rounded-sm flex items-center justify-center">
              <span className="text-[9px] font-black text-white">in</span>
            </span>
            LinkedIn
          </button>

          {/* 이메일 */}
          <button onClick={shareEmail} className={btnClass}>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            이메일
          </button>
        </div>
      )}
    </div>
  );
}
