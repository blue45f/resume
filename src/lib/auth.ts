const API_URL = import.meta.env.VITE_API_URL || '';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  provider: string;
  role?: string;
  plan?: string;
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function getUser(): User | null {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

export function setAuth(token: string, user: User) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Clear httpOnly cookie via server endpoint
  fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// OAuth 콜백에서 토큰을 받아 유저 정보 조회 + 저장
export async function handleAuthCallback(token: string): Promise<User> {
  localStorage.setItem('token', token);
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) { clearAuth(); throw new Error('인증 실패'); }
  const user = await res.json();
  setAuth(token, user);
  return user;
}

// 소셜 로그인 URL
export function getSocialLoginUrl(provider: string): string {
  return `${API_URL}/api/auth/${provider}`;
}

export async function fetchMe(): Promise<User | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { clearAuth(); return null; }
    const user = await res.json();
    setAuth(token, user);
    return user;
  } catch { clearAuth(); return null; }
}
