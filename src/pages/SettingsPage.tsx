import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { toast } from '@/components/Toast';
import { getUser, clearAuth } from '@/lib/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user]);

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
              </div>
            </div>
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
    </>
  );
}
