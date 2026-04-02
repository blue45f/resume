import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function OnboardingBanner() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('onboarding-dismissed') === 'true');

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem('onboarding-dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 sm:p-6 text-white animate-fade-in-up relative overflow-hidden">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
        aria-label="닫기"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h2 className="text-lg font-bold mb-2">시작하기 가이드</h2>
      <p className="text-blue-100 text-sm mb-4">이력서공방을 처음 사용하시나요? 3단계로 시작하세요.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/resumes/new" className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur rounded-xl hover:bg-white/20 transition-colors">
          <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">1</span>
          <div>
            <p className="text-sm font-medium">이력서 작성</p>
            <p className="text-xs text-blue-200">9개 섹션 편집</p>
          </div>
        </Link>
        <Link to="/explore" className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur rounded-xl hover:bg-white/20 transition-colors">
          <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">2</span>
          <div>
            <p className="text-sm font-medium">공개 이력서 탐색</p>
            <p className="text-xs text-blue-200">참고 & 벤치마크</p>
          </div>
        </Link>
        <Link to="/tutorial" className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur rounded-xl hover:bg-white/20 transition-colors">
          <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">3</span>
          <div>
            <p className="text-sm font-medium">AI 기능 활용</p>
            <p className="text-xs text-blue-200">변환 · 분석 · 피드백</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
