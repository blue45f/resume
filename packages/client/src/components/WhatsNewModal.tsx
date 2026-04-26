import { useState, useEffect } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { API_URL } from '@/lib/config';

const STORAGE_KEY = 'whats-new-seen-v';

interface Feature {
  icon: string;
  title: string;
  desc: string;
  badge?: string;
}

interface WhatsNewData {
  version: string;
  title?: string;
  subtitle?: string;
  features: Feature[];
}

const FALLBACK: WhatsNewData = {
  version: '2.9.0',
  title: '✨ 새로운 기능이 추가됐어요',
  subtitle: '2026년 4월 사이클 — 8개 신규 기능',
  features: [
    {
      icon: '📸',
      title: '사진/PDF 만으로 이력서 자동 생성',
      desc: '기존 종이 이력서를 사진 찍거나 PDF 업로드 → AI 가 텍스트 추출 + 구조화 이력서 생성. iPhone HEIC 자동 변환.',
      badge: 'NEW',
    },
    {
      icon: '🔗',
      title: '채용공고 URL 만으로 자동 채움',
      desc: '원티드/잡코리아/사람인 등 공고 URL 붙여넣기 → 회사·포지션·요구사항 자동 입력. 자기소개서/지원/이력서 생성 모두.',
      badge: 'NEW',
    },
    {
      icon: '🔒',
      title: '선택 사용자만 공개',
      desc: '특정 코치·헤드헌터에게만 이력서를 공개. 7일/30일/90일 만료일 설정 가능.',
      badge: 'NEW',
    },
    {
      icon: '☕',
      title: '커피챗 + WebRTC 통화',
      desc: '코치/시니어와 1:1 만남 신청. 음성·화상 P2P 통화 (서버 거치지 않음).',
      badge: 'NEW',
    },
    {
      icon: '🎤',
      title: 'AI 면접 답변 분석',
      desc: '모의 면접 답변을 STAR 구조/정량/필러 기준 자동 채점. 심층 분석으로 강점·약점·리라이트 답변까지.',
      badge: 'NEW',
    },
    {
      icon: '💡',
      title: '주간 AI 코칭 알림',
      desc: '매주 일요일 이력서 분석 → 가장 영향 큰 개선 1개 알림. Pro 플랜은 LLM 개인화.',
    },
    {
      icon: '🎨',
      title: '프로필 아바타',
      desc: '직접 업로드 (자동 face crop) 또는 12개 preset 선택. HEIC 자동 변환.',
    },
    {
      icon: '🔍',
      title: '버전 비교 word-level diff',
      desc: '두 이력서 버전을 단어 단위 추가/삭제 색상 표시. LCS 알고리즘.',
    },
  ],
};

export default function WhatsNewModal() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<WhatsNewData | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/system-config/content/whats_new`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const content: WhatsNewData = d && d.version ? d : FALLBACK;
        if (!content.features?.length) return;
        const seen = localStorage.getItem(STORAGE_KEY);
        if (seen !== content.version) {
          setData(content);
          const t = setTimeout(() => setOpen(true), 2000);
          return () => clearTimeout(t);
        }
      })
      .catch(() => {});
  }, []);

  const handleClose = () => {
    if (data) localStorage.setItem(STORAGE_KEY, data.version);
    setOpen(false);
  };

  if (!data || !data.features?.length) return null;

  return (
    <RadixDialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[100] bg-black/50 animate-fade-in" />
        <RadixDialog.Content
          aria-label="새로운 기능 안내"
          className="fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl animate-fade-in-up overflow-hidden max-h-[90dvh] focus:outline-none flex flex-col"
        >
          <div className="relative px-6 pt-6 pb-4 bg-sky-700 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                    What's New
                  </span>
                  <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                    v{data.version}
                  </span>
                </div>
                <RadixDialog.Title className="text-xl font-bold">
                  {data.title || '새로운 기능이 추가됐어요!'}
                </RadixDialog.Title>
                <RadixDialog.Description className="text-sm text-white/80 mt-0.5">
                  {data.subtitle || '이력서공방 최신 업데이트를 확인하세요'}
                </RadixDialog.Description>
              </div>
              <RadixDialog.Close asChild>
                <button
                  className="ml-4 shrink-0 p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  aria-label="닫기"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </RadixDialog.Close>
            </div>
          </div>

          <div className="px-6 py-4 overflow-y-auto space-y-3">
            {data.features.map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 animate-fade-in"
              >
                <span className="text-2xl shrink-0 mt-0.5">{f.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      {f.title}
                    </span>
                    {f.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-600 text-white rounded-full uppercase tracking-wide">
                        {f.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-between gap-2">
            <a
              href="/tutorial?guide=new-features"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
              onClick={handleClose}
            >
              📖 전체 가이드 보기 →
            </a>
            <div className="flex items-center gap-2">
              <a
                href="/notices"
                className="text-xs text-slate-500 dark:text-slate-400 hover:underline whitespace-nowrap hidden sm:inline"
                onClick={handleClose}
              >
                공지 전체
              </a>
              <button
                onClick={handleClose}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm whitespace-nowrap"
              >
                확인했어요
              </button>
            </div>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
