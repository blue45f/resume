import { useRef, useState } from 'react';
import { uploadAvatar, setPresetAvatar, deleteAvatar } from '@/lib/api';
import { processImageForUpload } from '@/lib/imageProcess';
import { toast } from '@/components/Toast';

interface Props {
  current: string;
  fallbackInitial: string;
  onChange: (newAvatar: string) => void;
  className?: string;
}

/**
 * Dicebear 무료 SVG 아바타 — 12개 preset (다양한 스타일/시드).
 * 외부 fetch 없음 (img src 로 직접 로드). 256x256 최적화 size.
 */
const PRESETS: { id: string; url: string; alt: string }[] = [
  { id: 'p1', url: 'https://api.dicebear.com/9.x/notionists/svg?seed=hana&size=128', alt: '꽃' },
  { id: 'p2', url: 'https://api.dicebear.com/9.x/notionists/svg?seed=hojun&size=128', alt: '학생' },
  { id: 'p3', url: 'https://api.dicebear.com/9.x/notionists/svg?seed=mira&size=128', alt: '안경' },
  {
    id: 'p4',
    url: 'https://api.dicebear.com/9.x/notionists/svg?seed=jihoon&size=128',
    alt: '청년',
  },
  { id: 'p5', url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ari&size=128', alt: '카툰1' },
  { id: 'p6', url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=tj&size=128', alt: '카툰2' },
  { id: 'p7', url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=yura&size=128', alt: '여성' },
  { id: 'p8', url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=minho&size=128', alt: '남성' },
  { id: 'p9', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=robo&size=128', alt: '로봇' },
  {
    id: 'p10',
    url: 'https://api.dicebear.com/9.x/bottts/svg?seed=cyber&size=128',
    alt: '사이버',
  },
  {
    id: 'p11',
    url: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=happy&size=128',
    alt: '이모지1',
  },
  {
    id: 'p12',
    url: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=cool&size=128',
    alt: '이모지2',
  },
];

type Mode = 'view' | 'edit';

export default function AvatarEditor({ current, fallbackInitial, onChange, className }: Props) {
  const [mode, setMode] = useState<Mode>('view');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setBusy(true);
    try {
      // HEIC (iPhone 기본 포맷) → JPEG 변환 + 큰 파일 자동 압축
      const processed = await processImageForUpload(file);
      const res = await uploadAvatar(processed);
      onChange(res.avatar);
      setMode('view');
      toast('프로필 사진을 업데이트했습니다', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : '업로드 실패', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handlePreset = async (url: string) => {
    setBusy(true);
    try {
      const res = await setPresetAvatar(url);
      onChange(res.avatar);
      setMode('view');
      toast('프로필 사진을 변경했습니다', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : '변경 실패', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('프로필 사진을 삭제할까요?')) return;
    setBusy(true);
    try {
      await deleteAvatar();
      onChange('');
      setMode('view');
      toast('프로필 사진을 삭제했습니다', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : '삭제 실패', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-start gap-4">
        {current ? (
          <img
            src={current}
            alt=""
            className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600 shrink-0 bg-white"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-sky-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {fallbackInitial}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            📤 업로드
          </button>
          <button
            type="button"
            onClick={() => setMode((m) => (m === 'edit' ? 'view' : 'edit'))}
            disabled={busy}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            🎨 기본 아바타
          </button>
          {current && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
            >
              🗑️ 삭제
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = ''; // 같은 파일 재선택 가능
            }}
            className="hidden"
          />
        </div>
      </div>

      {mode === 'edit' && (
        <div className="mt-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
            기본 아바타 선택
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePreset(p.url)}
                disabled={busy}
                className={`relative aspect-square rounded-full border-2 overflow-hidden transition-all hover:scale-105 disabled:opacity-50 ${
                  current === p.url
                    ? 'border-blue-500 ring-2 ring-blue-300 dark:ring-blue-800'
                    : 'border-slate-200 dark:border-slate-600 hover:border-blue-400'
                }`}
                title={p.alt}
              >
                <img
                  src={p.url}
                  alt={p.alt}
                  className="w-full h-full object-cover bg-white"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
            ⓘ Dicebear 무료 SVG 아바타. 5MB 이하 이미지 업로드도 가능.
          </p>
        </div>
      )}
    </div>
  );
}
