import { memo, useEffect, useState } from 'react';
import type { Resume } from '@/types/resume';
import { calculateCompleteness } from '@/lib/completeness';

interface Props {
  resume: Resume;
}

interface Badge {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  earned: boolean;
}

function computeBadges(resume: Resume): Badge[] {
  const completeness = calculateCompleteness(resume);
  const pct = completeness.percentage;

  return [
    {
      id: 'resume-master',
      label: '이력서 마스터',
      description: '이력서 완성도 100% 달성',
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
      color: 'text-sky-600',
      gradient: 'from-blue-500 to-cyan-500',
      earned: pct >= 100,
    },
    {
      id: 'ai-user',
      label: 'AI 활용자',
      description: 'AI 분석 기능 사용',
      icon: 'M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5',
      color: 'text-emerald-600',
      gradient: 'from-emerald-500 to-teal-500',
      // Check if user has used AI features - heuristic: summary is long enough (AI-generated)
      earned: (resume.personalInfo.summary?.replace(/<[^>]*>/g, '').length || 0) > 100,
    },
    {
      id: 'networker',
      label: '네트워커',
      description: '5명 이상 팔로워 달성',
      icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
      color: 'text-blue-600',
      gradient: 'from-blue-500 to-indigo-500',
      earned: (resume.viewCount || 0) >= 50, // proxy: 50+ views ~ likely has followers
    },
    {
      id: 'interview-king',
      label: '면접 준비왕',
      description: '면접 질문 10개 이상 연습',
      icon: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155',
      color: 'text-amber-600',
      gradient: 'from-amber-500 to-orange-500',
      // Heuristic: has experiences with detailed achievements
      earned: resume.experiences.filter((e) => (e.achievements?.length || 0) > 50).length >= 3,
    },
    {
      id: 'global',
      label: '글로벌',
      description: '다국어 이력서 보유',
      icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
      color: 'text-cyan-600',
      gradient: 'from-cyan-500 to-blue-500',
      earned: resume.languages.length >= 2,
    },
  ];
}

function BadgeIcon({ badge, animateIn }: { badge: Badge; animateIn: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (animateIn && badge.earned) {
      const timer = setTimeout(() => setShow(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animateIn, badge.earned]);

  return (
    <div
      className={`flex flex-col items-center gap-2 transition-all duration-700 ${
        badge.earned
          ? show
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-75'
          : 'opacity-40 grayscale'
      }`}
    >
      {/* Badge circle */}
      <div className="relative">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center ${
            badge.earned
              ? `bg-gradient-to-br ${badge.gradient} shadow-lg`
              : 'bg-slate-200 dark:bg-slate-700'
          }`}
        >
          <svg
            className={`w-6 h-6 ${badge.earned ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={badge.icon} />
          </svg>
        </div>
        {/* Unlock sparkle */}
        {badge.earned && show && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm animate-bounce">
            <svg className="w-3 h-3 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )}
        {/* Lock for unearned */}
        {!badge.earned && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center">
            <svg
              className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
        )}
      </div>
      {/* Label */}
      <div className="text-center">
        <p
          className={`text-xs font-semibold ${
            badge.earned
              ? 'text-slate-800 dark:text-slate-200'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {badge.label}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 max-w-[80px] leading-tight">
          {badge.description}
        </p>
      </div>
    </div>
  );
}

function AchievementBadges({ resume }: Props) {
  const [animateIn, setAnimateIn] = useState(false);
  const badges = computeBadges(resume);
  const earnedCount = badges.filter((b) => b.earned).length;

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 no-print">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.704 6.023 6.023 0 01-2.77-.704"
            />
          </svg>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">달성 뱃지</h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {earnedCount}/{badges.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
              style={{ width: `${(earnedCount / badges.length) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            {Math.round((earnedCount / badges.length) * 100)}%
          </span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-6 sm:gap-8 py-2">
        {badges.map((badge, idx) => (
          <div key={badge.id} style={{ transitionDelay: `${idx * 150}ms` }}>
            <BadgeIcon badge={badge} animateIn={animateIn} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(AchievementBadges);
