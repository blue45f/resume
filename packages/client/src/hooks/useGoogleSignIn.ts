import { useEffect, useRef } from 'react'

import { GOOGLE_CLIENT_ID } from '@/lib/config'

/**
 * Google Identity Services (GIS) — ID-token 로그인 훅.
 *
 * GIS 스크립트(gsi/client)를 한 번만 로드한 뒤, 주어진 client ID 로 초기화하고
 * 콜백으로 받은 credential(ID 토큰)을 `onCredential` 로 전달한다.
 * 기존 코드-교환 OAuth redirect 흐름을 대체한다(클라이언트 시크릿/콜백 불필요).
 *
 * client ID 가 비어 있으면(`VITE_GOOGLE_CLIENT_ID` 미설정) 아무것도 하지 않는다 →
 * 호출 측은 `enabled` 로 버튼 노출 여부를 결정한다.
 */

const GIS_SRC = 'https://accounts.google.com/gsi/client'

interface CredentialResponse {
  credential?: string
}

interface GoogleIdConfig {
  client_id: string
  callback: (response: CredentialResponse) => void
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
  ux_mode?: 'popup' | 'redirect'
}

interface GoogleButtonConfig {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'small' | 'medium' | 'large'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  width?: number
  logo_alignment?: 'left' | 'center'
  locale?: string
}

interface GoogleAccountsId {
  initialize: (config: GoogleIdConfig) => void
  renderButton: (parent: HTMLElement, options: GoogleButtonConfig) => void
}

interface GoogleGsi {
  accounts: { id: GoogleAccountsId }
}

declare global {
  interface Window {
    google?: GoogleGsi
  }
}

let scriptPromise: Promise<void> | null = null

/** GIS 스크립트를 한 번만 로드한다(중복 호출은 동일 Promise 재사용). */
function loadGisScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.google?.accounts?.id) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('GIS 스크립트 로드 실패')))
      if (window.google?.accounts?.id) resolve()
      return
    }
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('GIS 스크립트 로드 실패'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

interface UseGoogleSignInOptions {
  /** credential(ID 토큰) 수신 콜백. */
  onCredential: (credential: string) => void
  /** GIS 활성 여부 — client ID 미설정 등으로 끌 때 false. */
  enabled?: boolean
  /** 버튼 텍스트 컨텍스트(로그인/가입). */
  text?: GoogleButtonConfig['text']
  /** 버튼 너비(px). */
  width?: number
}

/**
 * GIS 버튼을 렌더링할 ref 를 반환한다. ref 를 빈 div 에 연결하면 GIS 가
 * 공식 "Sign in with Google" 버튼을 그 안에 그린다.
 */
export function useGoogleSignIn({
  onCredential,
  enabled = true,
  text = 'continue_with',
  width = 320,
}: UseGoogleSignInOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  // 최신 콜백을 ref 로 보관 — GIS initialize 는 1회만 하고 콜백은 항상 최신을 호출.
  const callbackRef = useRef(onCredential)
  callbackRef.current = onCredential

  useEffect(() => {
    if (!enabled || !GOOGLE_CLIENT_ID) return
    let cancelled = false

    loadGisScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.accounts?.id) return
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response.credential) callbackRef.current(response.credential)
          },
          cancel_on_tap_outside: true,
          ux_mode: 'popup',
        })
        // 기존 자식(StrictMode 재마운트 시 중복 버튼) 제거 후 렌더.
        containerRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          width,
          logo_alignment: 'left',
        })
      })
      .catch(() => {
        // 스크립트 로드 실패 시 조용히 무시 — 다른 로그인 수단은 그대로 동작.
      })

    return () => {
      cancelled = true
    }
  }, [enabled, text, width])

  return containerRef
}
