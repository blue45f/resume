import { API_URL } from '@/lib/config'
import { httpClient } from '@/lib/ky'

export interface User {
  id: string
  email: string
  name: string
  avatar: string
  provider: string
  role?: string
  plan?: string
  userType?: string
  companyName?: string
  isOpenToWork?: boolean
  openToWorkRoles?: string
  username?: string
  createdAt?: string
}

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export function getUser(): User | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

export function setAuth(token: string, user: User) {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  // Clear httpOnly cookie via server endpoint
  httpClient(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(
    () => {}
  )
}

export function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// OAuth 콜백에서 토큰을 받아 유저 정보 조회 + 저장
export async function handleAuthCallback(token: string): Promise<User> {
  localStorage.setItem('token', token)
  const res = await httpClient(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    clearAuth()
    throw new Error('인증 실패')
  }
  const user = await res.json()
  setAuth(token, user)
  return user
}

// 소셜 로그인 URL (GitHub/Kakao 등 redirect 기반 provider 용)
export function getSocialLoginUrl(provider: string): string {
  return `${API_URL}/api/auth/${provider}`
}

/**
 * Google Identity Services (GIS) ID-token 로그인.
 * GIS 가 발급한 credential(ID 토큰)을 백엔드로 보내 검증·우리 JWT 발급을 받고,
 * 토큰을 저장한 뒤 발급된 JWT 를 반환한다(이메일 로그인과 동일한 응답 계약).
 */
export async function loginWithGoogleCredential(credential: string): Promise<string> {
  const res = await httpClient(`${API_URL}/api/auth/google/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ credential }),
  })
  const data = (await res.json()) as { token?: string; message?: string }
  if (!res.ok || !data.token) {
    const msg =
      typeof data?.message === 'string' && /[가-힣]/.test(data.message)
        ? data.message
        : 'Google 로그인에 실패했습니다.'
    throw new Error(msg)
  }
  localStorage.setItem('token', data.token)
  return data.token
}

export async function fetchMe(): Promise<User | null> {
  const token = getToken()
  if (!token) return null
  try {
    const res = await httpClient(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      clearAuth()
      return null
    }
    const user = await res.json()
    setAuth(token, user)
    return user
  } catch {
    clearAuth()
    return null
  }
}
