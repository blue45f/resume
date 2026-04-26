import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Ad {
  id: string;
  title: string;
  description: string;
  link: string;
  linkText: string;
  bgColor: string;
  textColor: string;
  position: 'sidebar' | 'inline' | 'footer';
}

const DEFAULT_ADS: Ad[] = [
  {
    id: 'pricing-promo',
    title: '프로 플랜 첫 달 50% 할인',
    description: '무제한 AI 분석, 15종 프리미엄 테마, 우선 지원',
    link: '/pricing',
    linkText: '업그레이드',
    bgColor: 'from-blue-600 to-sky-700',
    textColor: 'text-white',
    position: 'inline',
  },
  {
    id: 'recruiter-promo',
    title: '채용담당자를 위한 비즈니스 플랜',
    description: '무제한 스카우트, 후보자 검색, 파이프라인 관리',
    link: '/pricing',
    linkText: '자세히 보기',
    bgColor: 'from-emerald-600 to-teal-600',
    textColor: 'text-white',
    position: 'sidebar',
  },
];

interface AdBannerProps {
  position?: 'sidebar' | 'inline' | 'footer';
  className?: string;
}

export default function AdBanner({ position = 'inline', className = '' }: AdBannerProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 관리자 설정 광고 확인
    try {
      const stored = localStorage.getItem('admin-ads');
      if (stored) {
        const ads: Ad[] = JSON.parse(stored);
        const matched = ads.find((a) => a.position === position);
        if (matched) {
          setAd(matched);
          return;
        }
      }
    } catch {}
    // 기본 광고
    const matched = DEFAULT_ADS.find((a) => a.position === position);
    if (matched) setAd(matched);
  }, [position]);

  if (!ad || dismissed) return null;

  const dismissedKey = `ad-dismissed-${ad.id}`;
  if (localStorage.getItem(dismissedKey)) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(dismissedKey, '1');
  };

  return (
    <div
      className={`relative bg-gradient-to-r ${ad.bgColor} rounded-xl p-4 ${ad.textColor} overflow-hidden ${className}`}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:opacity-70 transition-opacity"
        aria-label="광고 닫기"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <p className="text-sm font-bold mb-1">{ad.title}</p>
      <p className="text-xs opacity-90 mb-2">{ad.description}</p>
      <Link
        to={ad.link}
        className="inline-block px-3 py-1 bg-white/20 hover:bg-white/30 text-xs font-medium rounded-lg transition-colors"
      >
        {ad.linkText} →
      </Link>
      <span className="absolute bottom-1 right-2 text-[9px] opacity-40">AD</span>
    </div>
  );
}
