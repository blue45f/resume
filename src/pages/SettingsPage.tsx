import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import { getUser, clearAuth } from '@/lib/auth';
import ProfileBadges from '@/components/ProfileBadges';
import { getPlan } from '@/lib/plans';

const API_URL = import.meta.env.VITE_API_URL || '';

function RecentActivityList() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_URL}/api/resumes/dashboard/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
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

  if (activities.length === 0) return <p className="text-sm text-slate-400 text-center py-4">최근 활동이 없습니다</p>;

  const icons: Record<string, string> = { edit: '✏️', resume: '📄', transform: '🤖' };

  return (
    <div className="space-y-2">
      {activities.map((a, i) => (
        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
          <span className="text-sm">{icons[a.type] || '📌'}</span>
          <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">{a.desc}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{new Date(a.date).toLocaleDateString('ko-KR')}</span>
        </div>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [usage, setUsage] = useState<{ feature: string; count: number }[]>([]);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user]);

  useEffect(() => {
    document.title = '설정 — 이력서공방';
    return () => { document.title = '이력서공방 - AI 기반 이력서 관리 플랫폼'; };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/api/health/usage`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(setUsage)
        .catch(() => {});
    }
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast('새 비밀번호가 일치하지 않습니다', 'error');
      return;
    }
    if (newPassword.length < 8) {
      toast('비밀번호는 8자 이상이어야 합니다', 'error');
      return;
    }
    setChangingPw(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast('비밀번호가 변경되었습니다', 'success');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      toast(err.message || '비밀번호 변경에 실패했습니다', 'error');
    } finally {
      setChangingPw(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('정말로 계정을 삭제하시겠습니까?\n모든 이력서, 지원 내역, 데이터가 영구 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.')) return;
    if (!confirm('마지막 확인: 계정을 영구 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/auth/account`, {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }
      clearAuth();
      toast('계정이 삭제되었습니다', 'info');
      navigate('/');
      window.location.reload();
    } catch (err: any) {
      toast(err.message || '계정 삭제에 실패했습니다', 'error');
    }
  };

  if (!user) return null;

  const inputClass = 'w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8" role="main">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">설정</h1>

        {/* Profile Info */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">프로필</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              {user.avatar && (
                <img src={user.avatar} alt="" className="w-14 h-14 rounded-full border border-slate-200 dark:border-slate-600" />
              )}
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{user.name || '이름 없음'}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {user.provider === 'local' ? '이메일 계정' : `${user.provider} 계정`}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {user.plan === 'premium' ? '💎 프리미엄' : user.plan === 'standard' ? '⭐ 스탠다드' : '🆓 무료'}
                </p>
                <div className="flex gap-3 mt-3">
                  <Link to="/bookmarks" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">내 북마크</Link>
                  <Link to="/my-cover-letters" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">내 자소서</Link>
                  <Link to="/messages" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">쪽지</Link>
                  <Link to="/scouts" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">스카우트</Link>
                </div>
                <div className="mt-2">
                  <ProfileBadges resumeCount={0} isAdmin={user?.role === 'admin' || user?.role === 'superadmin'} userType={user?.userType} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Details */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">구독 관리</h2>
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

          {/* Usage bars */}
          {usage.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">이번 달 사용량</h3>
              {usage.map(u => {
                const featureLabels: Record<string, string> = {
                  ai_transform: 'AI 변환',
                  cover_letter: '자소서',
                  translation: '번역',
                  ai_coaching: 'AI 코칭',
                };
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
        </section>

        {/* Recent Activity */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">최근 활동</h2>
          <RecentActivityList />
        </section>

        {/* Social Account Linking */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">소셜 계정 연동</h2>
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
                    {isLinked && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">연동됨</span>
                    )}
                  </div>
                  {!isLinked && (
                    <a
                      href={`${API_URL}/api/auth/link/${p.id}`}
                      className="text-sm px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      연동하기
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Change Password - only for local accounts */}
        {user.provider === 'local' && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">비밀번호 변경</h2>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="현재 비밀번호" required className={inputClass} />
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="새 비밀번호 (8자 이상)" required minLength={8} className={inputClass} />
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="새 비밀번호 확인" required minLength={8} className={inputClass} />
              <button type="submit" disabled={changingPw} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all duration-200">
                {changingPw ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          </section>
        )}

        {/* Credit Purchase */}
        {(!user?.plan || user.plan === 'free') && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">AI 크레딧</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              무료 플랜의 월 한도를 초과하면 추가 크레딧을 구매할 수 있습니다.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { credits: 10, price: 1900, popular: false },
                { credits: 30, price: 4900, popular: true },
                { credits: 100, price: 9900, popular: false },
              ].map(pack => (
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
            <p className="text-xs text-slate-400">결제 시스템 준비 중입니다. 프로 플랜을 추천합니다.</p>
          </section>
        )}

        {/* Data Export */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">데이터 내보내기</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">모든 이력서와 지원 내역을 JSON 파일로 다운로드합니다.</p>
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const [resumesRes, appsRes] = await Promise.all([
                  fetch(`${API_URL}/api/resumes`, { headers }),
                  fetch(`${API_URL}/api/applications`, { headers }),
                ]);

                const resumes = await resumesRes.json();
                const apps = await appsRes.json();

                const data = { exportDate: new Date().toISOString(), resumes: resumes.data || resumes, applications: apps };
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
            }}
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200"
          >
            JSON으로 내보내기
          </button>
        </section>

        {/* Danger Zone */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900 p-6">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">위험 영역</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            계정을 삭제하면 모든 이력서, 지원 내역, 버전 기록이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-all duration-200"
          >
            계정 영구 삭제
          </button>
        </section>
      </main>
      <Footer />
    </>
  );
}
