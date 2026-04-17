import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import { getUser, setAuth, getToken, clearAuth } from '@/lib/auth';
import ProfileBadges from '@/components/ProfileBadges';
import { getPlan } from '@/lib/plans';
import { getTheme, setTheme } from '@/lib/theme';
import { API_URL } from '@/lib/config';
import { fetchDashboard, fetchUsage, changePassword as apiChangePassword, deleteAccount as apiDeleteAccount, updateProfile as apiUpdateProfile } from '@/lib/api';

/* ── Zod 스키마 ───────────────────────────────── */
const nameSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해주세요').max(50, '이름은 50자 이하여야 합니다'),
});
type NameFormData = z.infer<typeof nameSchema>;

const usernameSchema = z.object({
  username: z.string()
    .trim()
    .min(3, '3자 이상 입력해주세요')
    .max(20, '20자 이하여야 합니다')
    .regex(/^[a-z0-9_-]+$/, '영문 소문자, 숫자, -, _ 만 사용 가능합니다'),
});
type UsernameFormData = z.infer<typeof usernameSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(8, '현재 비밀번호는 8자 이상이어야 합니다'),
  newPassword: z.string().min(8, '새 비밀번호는 8자 이상이어야 합니다'),
  confirmPassword: z.string().min(8, '비밀번호 확인은 8자 이상이어야 합니다'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '새 비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: '새 비밀번호는 현재 비밀번호와 달라야 합니다',
  path: ['newPassword'],
});
type PasswordFormData = z.infer<typeof passwordSchema>;

/* ── 최근 활동 ───────────────────────────────────── */
function RecentActivityList() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetchDashboard()
      .then(data => {
        if (!data) return;
        const acts: any[] = [];
        for (const v of data.recentVersions || []) {
          acts.push({ type: 'edit', desc: `이력서 버전 ${v.versionNumber} 저장`, date: v.createdAt });
        }
        for (const r of data.resumes?.slice(0, 3) || []) {
          acts.push({ type: 'resume', desc: `"${r.title}" 조회 ${r.viewCount}회`, date: r.updatedAt });
        }
        acts.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setActivities(acts.slice(0, 8));
      })
      .catch(() => {});
  }, []);

  if (activities.length === 0)
    return <p className="text-sm text-slate-400 text-center py-4">최근 활동이 없습니다</p>;

  const icons: Record<string, string> = { edit: '✏️', resume: '📄', transform: '🤖' };

  return (
    <div className="space-y-2">
      {activities.map((a, i) => (
        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
          <span className="text-sm">{icons[a.type] || '📌'}</span>
          <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">{a.desc}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
            {new Date(a.date).toLocaleDateString('ko-KR')}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── 콜랩서블 섹션 ───────────────────────────────── */
interface SectionProps {
  id: string;
  icon: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  danger?: boolean;
}

function CollapsibleSection({ id, icon, title, open, onToggle, children, danger, hidden }: SectionProps & { hidden?: boolean }) {
  const contentRef = useRef<HTMLDivElement>(null);

  if (hidden) return null;

  return (
    <section
      id={id}
      className={`bg-white dark:bg-slate-800 rounded-2xl border mb-4 overflow-hidden transition-shadow ${
        danger
          ? 'border-2 border-red-200 dark:border-red-900/60'
          : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg" aria-hidden="true">{icon}</span>
          <h2 className={`text-base font-semibold ${danger ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
            {title}
          </h2>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        ref={contentRef}
        className={`transition-all duration-300 ease-out ${open ? 'opacity-100' : 'opacity-0 max-h-0 overflow-hidden'}`}
        style={open ? { maxHeight: contentRef.current ? contentRef.current.scrollHeight + 200 : 9999 } : { maxHeight: 0 }}
      >
        <div className="px-6 pb-6 pt-0 border-t border-slate-100 dark:border-slate-700/50">
          <div className="pt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

/* ── 빠른 탐색 ───────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'sec-profile', label: '프로필', keywords: '이름 이메일 아바타 프로필 사진 닉네임 username' },
  { id: 'sec-usertype', label: '유형', keywords: '채용 구직 담당자 개인 기업 회사 모드' },
  { id: 'sec-opento', label: '구직', keywords: '구직 중 open to work 포지션 역할' },
  { id: 'sec-subscription', label: '구독', keywords: '요금제 플랜 구독 무료 프리미엄 결제' },
  { id: 'sec-activity', label: '활동', keywords: '최근 활동 이력 기록 로그' },
  { id: 'sec-social', label: '소셜', keywords: '팔로워 팔로잉 소셜 연결 친구' },
  { id: 'sec-password', label: '비밀번호', keywords: '비밀번호 변경 보안 암호 password' },
  { id: 'sec-notifications', label: '알림', keywords: '알림 설정 이메일 스카우트 댓글 푸시' },
  { id: 'sec-theme', label: '테마', keywords: '테마 다크 라이트 모드 색상 dark light' },
  { id: 'sec-data', label: '데이터', keywords: '데이터 내보내기 다운로드 백업 export' },
  { id: 'sec-danger', label: '삭제', keywords: '계정 삭제 탈퇴 회원탈퇴 계정삭제' },
];

/* ══════════════════════════════════════════════════ */
export default function SettingsPage() {
  const navigate = useNavigate();
  const user = getUser();

  /* ── 상태 ── */
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['sec-profile', 'sec-usertype', 'sec-subscription'])
  );
  const [editingName, setEditingName] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);

  /* ── RHF: 이름 ── */
  const nameForm = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: user?.name || '' },
  });

  /* ── RHF: 사용자명 ── */
  const usernameForm = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: user?.username || '' },
  });

  /* ── RHF: 비밀번호 ── */
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const [usage, setUsage] = useState<{ feature: string; count: number }[]>([]);
  const [userType, setUserType] = useState(user?.userType || 'personal');
  const [switchingType, setSwitchingType] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(getTheme());
  const [isOpenToWork, setIsOpenToWork] = useState(user?.isOpenToWork || false);
  const [openToWorkRoles, setOpenToWorkRoles] = useState(user?.openToWorkRoles || '');
  const [savingOpenToWork, setSavingOpenToWork] = useState(false);

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notification-prefs');
    return saved ? JSON.parse(saved) : { email: true, scout: true, comment: true };
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [settingsSearch, setSettingsSearch] = useState('');

  /* ── 초기화 ── */
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user]);

  useEffect(() => {
    document.title = '설정 — 이력서공방';
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  useEffect(() => {
    if (getToken()) fetchUsage().then(setUsage).catch(() => {});
  }, []);

  /* ── 헬퍼 ── */
  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const isSectionVisible = (id: string) => {
    if (!settingsSearch.trim()) return true;
    const q = settingsSearch.toLowerCase();
    const item = NAV_ITEMS.find(n => n.id === id);
    return item ? (item.label.toLowerCase().includes(q) || item.keywords.toLowerCase().includes(q)) : true;
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // 닫혀 있으면 열기
      if (!openSections.has(id)) toggleSection(id);
    }
  };

  /* ── 핸들러 ── */
  const onSaveName = nameForm.handleSubmit(async (values) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: values.name.trim() }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      if (token) setAuth(token, updated);
      setEditingName(false);
      toast('이름이 변경되었습니다', 'success');
    } catch {
      toast('이름 변경에 실패했습니다', 'error');
    }
  });

  const onSaveUsername = usernameForm.handleSubmit(async (values) => {
    const cleaned = values.username.trim().toLowerCase();
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ username: cleaned }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || '사용자명 변경에 실패했습니다');
      }
      const updated = await res.json();
      if (token) setAuth(token, updated);
      usernameForm.reset({ username: cleaned });
      setEditingUsername(false);
      toast('포트폴리오 URL이 설정되었습니다', 'success');
    } catch (err: any) {
      usernameForm.setError('username', { message: err.message || '사용자명 변경에 실패했습니다' });
    }
  });

  const onChangePassword = passwordForm.handleSubmit(async (values) => {
    try {
      await apiChangePassword(values.currentPassword, values.newPassword);
      toast('비밀번호가 변경되었습니다', 'success');
      passwordForm.reset();
    } catch (err: any) {
      toast(err.message || '비밀번호 변경에 실패했습니다', 'error');
    }
  });

  const handleDeleteAccount = async () => {
    try {
      await apiDeleteAccount();
      clearAuth();
      toast('계정이 삭제되었습니다', 'info');
      navigate('/');
      window.location.reload();
    } catch (err: any) {
      toast(err.message || '계정 삭제에 실패했습니다', 'error');
    }
  };

  const handleNotificationToggle = (key: 'email' | 'scout' | 'comment') => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem('notification-prefs', JSON.stringify(updated));
    if (getToken()) apiUpdateProfile({ ...updated } as any).catch(() => {});
    toast('알림 설정이 저장되었습니다', 'success');
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setTheme(theme);
    setCurrentTheme(theme);
    toast(`${theme === 'light' ? '라이트' : theme === 'dark' ? '다크' : '시스템'} 테마가 적용되었습니다`, 'success');
  };

  const handleExportData = async () => {
    try {
      const { fetchResumes, fetchApplications } = await import('@/lib/api');
      const [resumes, apps] = await Promise.all([fetchResumes(), fetchApplications()]);
      const data = {
        exportDate: new Date().toISOString(),
        user: { name: user?.name, email: user?.email },
        resumes,
        applications: apps,
        notificationPreferences: notifications,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `이력서공방_데이터_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('데이터가 다운로드되었습니다', 'success');
    } catch {
      toast('다운로드에 실패했습니다', 'error');
    }
  };

  if (!user) return null;

  const inputClass = 'w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const isDark = currentTheme === 'dark' || (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8" role="main">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">설정</h1>
          <button
            onClick={() => setOpenSections(prev => prev.size > 0 ? new Set() : new Set(NAV_ITEMS.map(n => n.id)))}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            {openSections.size > 0 ? '모두 접기' : '모두 펼치기'}
          </button>
        </div>

        {/* 설정 검색 */}
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={settingsSearch}
            onChange={e => {
              setSettingsSearch(e.target.value);
              if (e.target.value.trim()) {
                const q = e.target.value.toLowerCase();
                const matching = NAV_ITEMS.filter(n =>
                  n.label.toLowerCase().includes(q) || n.keywords.toLowerCase().includes(q)
                );
                setOpenSections(new Set(matching.map(n => n.id)));
              }
            }}
            placeholder="설정 검색... (예: 비밀번호, 테마, 알림)"
            className="w-full pl-10 pr-8 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          {settingsSearch && (
            <button onClick={() => setSettingsSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 빠른 탐색 */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
          {NAV_ITEMS.filter(n => n.id !== 'sec-password' || user.provider === 'local').filter(n => {
            if (!settingsSearch.trim()) return true;
            const q = settingsSearch.toLowerCase();
            return n.label.toLowerCase().includes(q) || n.keywords.toLowerCase().includes(q);
          }).map(item => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${
                item.id === 'sec-danger'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* ── 프로필 ── */}
        <CollapsibleSection
          id="sec-profile" icon="👤" title="프로필"
          open={openSections.has('sec-profile')} onToggle={() => toggleSection('sec-profile')}
        >
          <div className="flex items-start gap-4">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-16 h-16 rounded-full border-2 border-slate-200 dark:border-slate-600 shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
                {(user.name || user.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {/* 이름 편집 */}
              {editingName ? (
                <form onSubmit={onSaveName} className="mb-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      {...nameForm.register('name')}
                      onKeyDown={e => { if (e.key === 'Escape') { setEditingName(false); nameForm.reset({ name: user.name || '' }); } }}
                      className="flex-1 px-3 py-1.5 border border-indigo-400 rounded-lg text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                    <button type="submit" disabled={nameForm.formState.isSubmitting} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                      {nameForm.formState.isSubmitting ? '저장 중' : '저장'}
                    </button>
                    <button type="button" onClick={() => { setEditingName(false); nameForm.reset({ name: user.name || '' }); }} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg">
                      취소
                    </button>
                  </div>
                  {nameForm.formState.errors.name && (
                    <p className="text-xs text-red-500 mt-1">{nameForm.formState.errors.name.message}</p>
                  )}
                </form>
              ) : (
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{user.name || '이름 없음'}</p>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    ✏️
                  </button>
                </div>
              )}
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {user.provider === 'local' ? '이메일 계정' : `${user.provider} 계정`}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {user.plan === 'premium' ? '💎 프리미엄' : user.plan === 'standard' ? '⭐ 스탠다드' : '🆓 무료'}
              </p>
              {/* 포트폴리오 URL (username) */}
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">포트폴리오 URL</span>
                  {!editingUsername && (
                    <button onClick={() => { setEditingUsername(true); usernameForm.reset({ username: user?.username || '' }); }} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                      {user?.username ? '변경' : '설정하기'}
                    </button>
                  )}
                </div>
                {editingUsername ? (
                  <form onSubmit={onSaveUsername}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 shrink-0">이력서공방.com/u/</span>
                      <input
                        type="text"
                        {...usernameForm.register('username', {
                          onChange: (e) => { e.target.value = e.target.value.toLowerCase(); },
                        })}
                        onKeyDown={e => { if (e.key === 'Escape') { setEditingUsername(false); usernameForm.clearErrors(); } }}
                        placeholder="my-username"
                        className="flex-1 px-2 py-1 border border-indigo-400 rounded-lg text-xs dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                      />
                      <button type="submit" disabled={usernameForm.formState.isSubmitting} className="px-2.5 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-50 shrink-0">
                        {usernameForm.formState.isSubmitting ? '...' : '저장'}
                      </button>
                      <button type="button" onClick={() => { setEditingUsername(false); usernameForm.clearErrors(); }} className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700">취소</button>
                    </div>
                    {usernameForm.formState.errors.username && (
                      <p className="text-xs text-red-500 mt-1">{usernameForm.formState.errors.username.message}</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">영문 소문자, 숫자, -, _ 만 사용 가능 (3-20자)</p>
                  </form>
                ) : user?.username ? (
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">
                      /u/{user.username}
                    </code>
                    <Link to={`/u/${user.username}`} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" target="_blank">
                      보기 →
                    </Link>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">설정하면 <strong>이력서공방.com/u/이름</strong>으로 포트폴리오 공유 가능</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 mt-3">
                <Link to="/bookmarks" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">내 북마크</Link>
                <Link to="/my-cover-letters" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">내 자소서</Link>
                <Link to="/messages" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">쪽지</Link>
                <Link to="/scouts" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">스카우트</Link>
              </div>
              <div className="mt-3">
                <ProfileBadges resumeCount={0} isAdmin={user?.role === 'admin' || user?.role === 'superadmin'} userType={user?.userType} />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── 사용자 유형 ── */}
        <CollapsibleSection
          id="sec-usertype" icon="🔄" title="사용자 유형"
          open={openSections.has('sec-usertype')} onToggle={() => toggleSection('sec-usertype')}
        >
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            개인(구직자)과 채용담당자 모드를 전환할 수 있습니다. 모드에 따라 메뉴와 기능이 달라집니다.
          </p>
          <div className="flex gap-3">
            {([
              { value: 'personal', label: '개인 (구직자)', desc: '이력서 관리, 지원, 자소서 작성',
                activeClass: 'border-green-500 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500', dotActive: 'bg-green-500' },
              { value: 'recruiter', label: '채용담당자', desc: '채용 대시보드, 스카우트, 채용공고',
                activeClass: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-500', dotActive: 'bg-purple-500' },
            ] as const).map(opt => {
              const isActive = userType === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={async () => {
                    if (isActive || switchingType) return;
                    setSwitchingType(true);
                    try {
                      const token = getToken();
                      const res = await fetch(`${API_URL}/api/auth/profile`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                        body: JSON.stringify({ userType: opt.value }),
                      });
                      if (!res.ok) throw new Error();
                      const updated = await res.json();
                      if (token) setAuth(token, updated);
                      setUserType(opt.value);
                      toast(`${opt.label} 모드로 전환되었습니다`, 'success');
                    } catch {
                      toast('모드 전환에 실패했습니다', 'error');
                    } finally {
                      setSwitchingType(false);
                    }
                  }}
                  disabled={switchingType}
                  className={`flex-1 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    isActive ? opt.activeClass : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${isActive ? opt.dotActive : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <span className={`text-sm font-medium ${isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                      {opt.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 pl-5">{opt.desc}</p>
                  {isActive && <p className="text-xs text-green-600 dark:text-green-400 mt-2 pl-5 font-medium">현재 모드</p>}
                </button>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* ── 구직 중 상태 ── */}
        {userType === 'personal' && (
          <CollapsibleSection
            id="sec-opento" icon="🟢" title="구직 중 상태 (Open to Work)"
            open={openSections.has('sec-opento')} onToggle={() => toggleSection('sec-opento')}
          >
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              구직 중 상태를 공개하면 채용 담당자가 내 이력서를 더 쉽게 발견할 수 있습니다. 이력서 탐색 페이지에서 초록색 배지로 표시됩니다.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${isOpenToWork ? 'bg-green-500' : 'bg-slate-400'}`} />
                    {isOpenToWork ? '구직 중 (공개)' : '구직 중 아님 (비공개)'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isOpenToWork ? '이력서 탐색에서 구직 중으로 표시됩니다' : '비공개 상태입니다'}
                  </p>
                </div>
                <button
                  onClick={() => setIsOpenToWork(prev => !prev)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    isOpenToWork ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                  aria-label="구직 중 상태 토글"
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                    isOpenToWork ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {isOpenToWork && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">희망 직무 (쉼표로 구분)</label>
                  <input
                    type="text"
                    value={openToWorkRoles}
                    onChange={e => setOpenToWorkRoles(e.target.value)}
                    placeholder="예: 프론트엔드 개발자, UI 디자이너, PM"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              <button
                onClick={async () => {
                  setSavingOpenToWork(true);
                  try {
                    const token = getToken();
                    const res = await fetch(`${API_URL}/api/auth/profile`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                      body: JSON.stringify({ isOpenToWork, openToWorkRoles }),
                    });
                    if (!res.ok) throw new Error();
                    const updated = await res.json();
                    if (token) setAuth(token, { ...user, ...updated });
                    toast(isOpenToWork ? '구직 중 상태로 설정되었습니다' : '구직 중 상태가 해제되었습니다', 'success');
                  } catch {
                    toast('저장에 실패했습니다', 'error');
                  } finally {
                    setSavingOpenToWork(false);
                  }
                }}
                disabled={savingOpenToWork}
                className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {savingOpenToWork ? '저장 중...' : '저장'}
              </button>
            </div>
          </CollapsibleSection>
        )}

        {/* ── 구독 관리 ── */}
        <CollapsibleSection
          id="sec-subscription" icon="💳" title="구독 관리"
          open={openSections.has('sec-subscription')} onToggle={() => toggleSection('sec-subscription')}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {user.plan === 'premium' ? '💎 프리미엄' : user.plan === 'standard' ? '⭐ 스탠다드' : '🆓 무료'} 플랜
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {user.plan === 'free' || !user.plan ? '무료로 사용 중' : '구독 중'}
              </p>
            </div>
            <Link to="/pricing" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200">
              {user.plan === 'free' || !user.plan ? '업그레이드' : '플랜 변경'}
            </Link>
          </div>
          {usage.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">이번 달 사용량</h3>
              {usage.map(u => {
                const featureLabels: Record<string, string> = { ai_transform: 'AI 변환', cover_letter: '자소서', translation: '번역', ai_coaching: 'AI 코칭' };
                const plan = getPlan(user?.plan || 'free');
                const limit = u.feature === 'ai_transform' ? plan.features.aiTransformsPerMonth : -1;
                const pct = limit > 0 ? Math.min(100, (u.count / limit) * 100) : 0;
                return (
                  <div key={u.feature}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-400">{featureLabels[u.feature] || u.feature}</span>
                      <span className="text-slate-400">{u.count}{limit > 0 ? ` / ${limit}` : ' (무제한)'}</span>
                    </div>
                    {limit > 0 && (
                      <div className="bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {/* AI 크레딧 */}
          {(!user?.plan || user.plan === 'free') && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">AI 크레딧 충전</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">월 한도 초과 시 추가 크레딧을 구매할 수 있습니다.</p>
              <div className="grid grid-cols-3 gap-3">
                {[{ credits: 10, price: 1900, popular: false }, { credits: 30, price: 4900, popular: true }, { credits: 100, price: 9900, popular: false }].map(pack => (
                  <button
                    key={pack.credits}
                    className={`p-3 rounded-xl border text-center transition-all duration-200 ${
                      pack.popular ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{pack.credits}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">크레딧</p>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">₩{pack.price.toLocaleString()}</p>
                    {pack.popular && <span className="text-xs text-blue-500">인기</span>}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">결제 시스템 준비 중입니다.</p>
            </div>
          )}
        </CollapsibleSection>

        {/* ── 최근 활동 ── */}
        <CollapsibleSection
          id="sec-activity" icon="📊" title="최근 활동"
          open={openSections.has('sec-activity')} onToggle={() => toggleSection('sec-activity')}
        >
          <RecentActivityList />
        </CollapsibleSection>

        {/* ── 소셜 계정 ── */}
        <CollapsibleSection
          id="sec-social" icon="🔗" title="소셜 계정 연동"
          open={openSections.has('sec-social')} onToggle={() => toggleSection('sec-social')}
        >
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">소셜 계정을 연동하면 해당 계정으로도 로그인할 수 있습니다.</p>
          <div className="space-y-3">
            {[
              { id: 'google', name: 'Google', color: 'border-slate-200 hover:border-blue-300' },
              { id: 'github', name: 'GitHub', color: 'border-slate-200 hover:border-slate-400' },
              { id: 'kakao', name: 'Kakao', color: 'border-slate-200 hover:border-yellow-300' },
            ].map(p => {
              const isLinked = user.provider === p.id;
              return (
                <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${p.color} dark:border-slate-600 transition-colors`}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{p.name}</span>
                    {isLinked && <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">연동됨</span>}
                  </div>
                  {!isLinked && (
                    <a href={`${API_URL}/api/auth/link/${p.id}`} className="text-sm px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                      연동하기
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </CollapsibleSection>

        {/* ── 비밀번호 변경 ── */}
        {user.provider === 'local' && (
          <CollapsibleSection
            id="sec-password" icon="🔐" title="비밀번호 변경"
            open={openSections.has('sec-password')} onToggle={() => toggleSection('sec-password')}
          >
            <form onSubmit={onChangePassword} className="space-y-3">
              <div>
                <input type="password" {...passwordForm.register('currentPassword')} placeholder="현재 비밀번호" className={inputClass} />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>
              <div>
                <input type="password" {...passwordForm.register('newPassword')} placeholder="새 비밀번호 (8자 이상)" className={inputClass} />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div>
                <input type="password" {...passwordForm.register('confirmPassword')} placeholder="새 비밀번호 확인" className={inputClass} />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <button type="submit" disabled={passwordForm.formState.isSubmitting} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all duration-200">
                {passwordForm.formState.isSubmitting ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          </CollapsibleSection>
        )}

        {/* ── 알림 설정 ── */}
        <CollapsibleSection
          id="sec-notifications" icon="🔔" title="알림 설정"
          open={openSections.has('sec-notifications')} onToggle={() => toggleSection('sec-notifications')}
        >
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">받고 싶은 알림 유형을 선택하세요.</p>
          <div className="space-y-3">
            {([
              { key: 'email' as const, label: '이메일 알림', desc: '이력서 변환 완료, 지원 현황 등의 이메일 알림' },
              { key: 'scout' as const, label: '스카우트 알림', desc: '채용담당자의 스카우트 제안 알림' },
              { key: 'comment' as const, label: '댓글 알림', desc: '내 이력서에 달린 댓글 및 피드백 알림' },
            ]).map(item => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-600">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => handleNotificationToggle(item.key)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${notifications[item.key] ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                  role="switch" aria-checked={notifications[item.key]} aria-label={item.label}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${notifications[item.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* ── 테마 설정 ── */}
        <CollapsibleSection
          id="sec-theme" icon="🎨" title="테마 설정"
          open={openSections.has('sec-theme')} onToggle={() => toggleSection('sec-theme')}
        >
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">인터페이스 테마를 선택하세요.</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {([
              { value: 'light' as const, label: '라이트', icon: '☀️' },
              { value: 'dark' as const, label: '다크', icon: '🌙' },
              { value: 'system' as const, label: '시스템', icon: '💻' },
            ]).map(opt => (
              <button
                key={opt.value}
                onClick={() => handleThemeChange(opt.value)}
                className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                  currentTheme === opt.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <span className="text-2xl block mb-1">{opt.icon}</span>
                <span className={`text-sm font-medium ${currentTheme === opt.value ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
          {/* 미리보기 */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
            <div className="text-xs text-slate-400 dark:text-slate-500 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
              미리보기 — {currentTheme === 'light' ? '라이트' : currentTheme === 'dark' ? '다크' : '시스템'} 모드
            </div>
            <div className={`p-4 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                <div className="flex-1 space-y-1.5">
                  <div className={`h-2.5 rounded-full w-24 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                  <div className={`h-2 rounded-full w-16 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className={`h-2 rounded-full w-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                <div className={`h-2 rounded-full w-3/4 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                <div className={`h-2 rounded-full w-1/2 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── 데이터 내보내기 ── */}
        <CollapsibleSection
          id="sec-data" icon="📦" title="데이터 내보내기"
          open={openSections.has('sec-data')} onToggle={() => toggleSection('sec-data')}
        >
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">모든 이력서, 지원 내역, 설정을 JSON 파일로 다운로드합니다.</p>
          <button
            onClick={handleExportData}
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            JSON으로 내보내기
          </button>
        </CollapsibleSection>

        {/* ── 위험 영역 ── */}
        <CollapsibleSection
          id="sec-danger" icon="⚠️" title="위험 영역"
          open={openSections.has('sec-danger')} onToggle={() => toggleSection('sec-danger')}
          danger
        >
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            계정을 삭제하면 모든 이력서, 지원 내역, 버전 기록이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
          </p>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-all duration-200"
          >
            계정 영구 삭제
          </button>
        </CollapsibleSection>

        {/* 검색 결과 없음 */}
        {settingsSearch.trim() && NAV_ITEMS.every(n => !isSectionVisible(n.id)) && (
          <div className="text-center py-12 imp-card">
            <div className="text-3xl mb-3">🔍</div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              "{settingsSearch}"에 해당하는 설정을 찾을 수 없습니다
            </p>
            <button onClick={() => setSettingsSearch('')} className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              검색 초기화
            </button>
          </div>
        )}

      </main>
      <Footer />

      {/* 계정 삭제 확인 모달 */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900 shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">계정 삭제</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">이 작업은 되돌릴 수 없습니다</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">계정을 삭제하면 다음 데이터가 모두 영구 삭제됩니다:</p>
            <ul className="text-sm text-slate-500 dark:text-slate-400 mb-4 space-y-1 list-disc list-inside">
              <li>모든 이력서 및 버전 기록</li>
              <li>지원 내역 및 자기소개서</li>
              <li>스카우트 메시지 및 알림</li>
              <li>프로필 및 계정 정보</li>
            </ul>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
              확인을 위해 <span className="font-mono font-bold text-red-600 dark:text-red-400">삭제</span>를 입력하세요:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="삭제"
              className="w-full px-4 py-2.5 border border-red-200 dark:border-red-800 rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteConfirmOpen(false); setDeleteConfirmText(''); }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmText === '삭제') {
                    setDeleteConfirmOpen(false);
                    setDeleteConfirmText('');
                    handleDeleteAccount();
                  } else {
                    toast('"삭제"를 정확히 입력해주세요', 'error');
                  }
                }}
                disabled={deleteConfirmText !== '삭제'}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                영구 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
