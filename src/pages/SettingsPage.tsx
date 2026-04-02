import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/Toast';
import { getUser, clearAuth } from '@/lib/auth';
import ProfileBadges from '@/components/ProfileBadges';

const API_URL = import.meta.env.VITE_API_URL || '';

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
                <p className="text-xs mt-1">
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                    {user.plan === 'pro' ? '⭐ 프로' : user.plan === 'enterprise' ? '💎 엔터프라이즈' : '🆓 무료'}
                  </span>
                  {user.plan !== 'enterprise' && (
                    <Link to="/pricing" className="ml-2 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all duration-200">
                      업그레이드
                    </Link>
                  )}
                </p>
                {usage.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">이번 달 사용량</p>
                    <div className="flex flex-wrap gap-2">
                      {usage.map(u => (
                        <span key={u.feature} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
                          {u.feature === 'ai_transform' ? 'AI 변환' : u.feature === 'cover_letter' ? '자소서' : u.feature === 'translation' ? '번역' : u.feature}: {u.count}회
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-2">
                  <ProfileBadges resumeCount={0} isAdmin={user?.role === 'admin'} />
                </div>
              </div>
            </div>
          </div>
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
