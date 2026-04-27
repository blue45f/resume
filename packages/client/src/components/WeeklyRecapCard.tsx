import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchMyJobApplications,
  fetchInterviewScoreHistory,
  fetchCoffeeChats,
  fetchNotifications,
} from '@/lib/api';

interface Recap {
  applications: number; // 이번 주 신규 지원
  pendingApplications: number; // 진행 중 (interested/contacted/interview)
  interviewAvg: number | null; // 이번 주 분석 평균 점수
  interviewCount: number;
  coffeeChats: number; // 이번 주 신규 커피챗 (sent + received pending)
  unreadNotifs: number;
  loaded: boolean;
}

const startOfWeek = () => {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1); // 월요일 시작
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * 주간 활동 요약 — Wanted Connect / LinkedIn weekly digest 패턴.
 * HomePage 상단에 노출. 데이터 0건이면 자동 hide.
 */
export default function WeeklyRecapCard() {
  const [recap, setRecap] = useState<Recap>({
    applications: 0,
    pendingApplications: 0,
    interviewAvg: null,
    interviewCount: 0,
    coffeeChats: 0,
    unreadNotifs: 0,
    loaded: false,
  });

  useEffect(() => {
    const monday = startOfWeek();
    Promise.allSettled([
      fetchMyJobApplications(),
      fetchInterviewScoreHistory(),
      fetchCoffeeChats('all'),
      fetchNotifications(),
    ]).then(([apps, scores, chats, notifs]) => {
      const a = apps.status === 'fulfilled' ? apps.value : [];
      const s = scores.status === 'fulfilled' ? scores.value : [];
      const c = chats.status === 'fulfilled' ? chats.value : [];
      const n = notifs.status === 'fulfilled' ? notifs.value : [];

      const thisWeekApps = a.filter((app) => new Date(app.createdAt) >= monday);
      const pending = a.filter((app) =>
        ['interested', 'contacted', 'interview'].includes(app.stage),
      );
      const thisWeekScores = s.filter((p) => new Date(p.createdAt) >= monday);
      const avg =
        thisWeekScores.length > 0
          ? Math.round(
              thisWeekScores.reduce((sum, p) => sum + p.analysisScore, 0) / thisWeekScores.length,
            )
          : null;
      const thisWeekChats = c.filter(
        (ch: any) =>
          new Date(ch.createdAt) >= monday &&
          ['pending', 'accepted', 'completed'].includes(ch.status),
      );
      const unread = (n as any[]).filter((nt) => !nt.read).length;

      setRecap({
        applications: thisWeekApps.length,
        pendingApplications: pending.length,
        interviewAvg: avg,
        interviewCount: thisWeekScores.length,
        coffeeChats: thisWeekChats.length,
        unreadNotifs: unread,
        loaded: true,
      });
    });
  }, []);

  if (!recap.loaded) return null;

  // 데이터 모두 0 — 신규 사용자 / 비활성 → hide
  const totalActivity =
    recap.applications +
    recap.pendingApplications +
    recap.interviewCount +
    recap.coffeeChats +
    recap.unreadNotifs;
  if (totalActivity === 0) return null;

  const cards = [
    {
      icon: '📥',
      label: '이번 주 신규 지원',
      value: recap.applications,
      to: '/applications',
      tone: 'text-blue-600 dark:text-blue-400',
      show: recap.applications > 0 || recap.pendingApplications > 0,
      sub: recap.pendingApplications > 0 ? `진행 중 ${recap.pendingApplications}` : '',
    },
    {
      icon: '🎤',
      label: '면접 답변 분석',
      value: recap.interviewCount,
      to: '/interview-prep',
      tone: 'text-sky-600 dark:text-sky-400',
      show: recap.interviewCount > 0,
      sub: recap.interviewAvg !== null ? `평균 ${recap.interviewAvg}점` : '',
    },
    {
      icon: '☕',
      label: '커피챗',
      value: recap.coffeeChats,
      to: '/coffee-chats',
      tone: 'text-amber-600 dark:text-amber-400',
      show: recap.coffeeChats > 0,
      sub: '',
    },
    {
      icon: '🔔',
      label: '미읽은 알림',
      value: recap.unreadNotifs,
      to: '/notifications',
      tone: 'text-rose-600 dark:text-rose-400',
      show: recap.unreadNotifs > 0,
      sub: '',
    },
  ].filter((c) => c.show);

  if (cards.length === 0) return null;

  return (
    <section
      aria-label="이번 주 활동"
      className="mb-6 imp-card p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-blue-900/10"
    >
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <span aria-hidden="true">📊</span>
          이번 주 활동
        </h2>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          weekly recap
        </span>
      </div>
      <div className="stagger-children grid grid-cols-2 sm:grid-cols-4 gap-2">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="group flex flex-col items-start gap-0.5 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
          >
            <span className="text-base" aria-hidden="true">
              {c.icon}
            </span>
            <span className={`text-xl font-bold tabular-nums ${c.tone}`}>{c.value}</span>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
              {c.label}
            </span>
            {c.sub && <span className="text-[10px] text-slate-400">{c.sub}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}
