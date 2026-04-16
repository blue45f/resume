import { useState, useEffect } from 'react';

const WHATS_NEW_VERSION = '2.8.0';
const STORAGE_KEY = 'whats-new-seen-v';

interface Feature {
  icon: string;
  title: string;
  desc: string;
  badge?: string;
}

const NEW_FEATURES: Feature[] = [
  {
    icon: '🗺️',
    title: '이력서 완성도 로드맵',
    desc: '편집기에서 섹션별 점수 향상 액션 리스트를 실시간 확인. 예상 점수 증가량도 표시됩니다.',
    badge: 'NEW',
  },
  {
    icon: '⚡',
    title: '파워 동사 클릭 복사',
    desc: '경력 작성 시 리더십·성과·협업 등 카테고리별 강력한 동사를 클릭 한 번으로 삽입하세요.',
    badge: 'NEW',
  },
  {
    icon: '✅',
    title: '이력서 감사(Audit) 패널',
    desc: '30+ 체크리스트로 수치화 표현, 클리셰, ATS 호환성 등 자동 진단. 미리보기 페이지에서 확인하세요.',
    badge: 'NEW',
  },
  {
    icon: '✍️',
    title: '자기소개서 빠른 연동',
    desc: '이력서 미리보기에서 자소서 버튼을 누르면 해당 이력서가 자동으로 선택됩니다.',
    badge: 'NEW',
  },
  {
    icon: '🔔',
    title: '알림 타입별 아이콘',
    desc: '프로필 조회, 팔로우, 스카우트 등 알림 유형별 이모지와 색상으로 빠르게 구분하세요.',
  },
  {
    icon: '⚠️',
    title: '오래된 이력서 경고',
    desc: '30일/60일 이상 업데이트되지 않은 이력서에 배지가 표시됩니다.',
  },
];

export default function WhatsNewModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen !== WHATS_NEW_VERSION) {
      // Small delay so it doesn't block initial render
      const t = setTimeout(() => setOpen(true), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, WHATS_NEW_VERSION);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="새로운 기능 안내"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-fade-in-up overflow-hidden">
        {/* Header gradient */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">What's New</span>
                <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">v{WHATS_NEW_VERSION}</span>
              </div>
              <h2 className="text-xl font-bold">새로운 기능이 추가됐어요! 🎉</h2>
              <p className="text-sm text-white/80 mt-0.5">이력서공방 최신 업데이트를 확인하세요</p>
            </div>
            <button
              onClick={handleClose}
              className="ml-4 shrink-0 p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              aria-label="닫기"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Feature list */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-3">
          {NEW_FEATURES.map((f, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 stagger-${i + 1} animate-fade-in`}
            >
              <span className="text-2xl shrink-0 mt-0.5">{f.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{f.title}</span>
                  {f.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-600 text-white rounded-full uppercase tracking-wide">
                      {f.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <a
            href="/notices"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            onClick={handleClose}
          >
            전체 공지사항 보기 →
          </a>
          <button
            onClick={handleClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            확인했어요
          </button>
        </div>
      </div>
    </div>
  );
}
