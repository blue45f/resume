/**
 * Shared application configuration constants.
 * Import API_URL from here instead of redefining it in every file.
 *
 * 환경별 API URL:
 *   로컬:   http://localhost:3001        (.env.local)
 *   개발:   https://resume-api-mm0o.onrender.com  (.env.development)
 *   운영:   https://resume-api-464016453534.asia-northeast3.run.app  (.env.production)
 */
export const API_URL = import.meta.env.VITE_API_URL || ''
/**
 * Google Identity Services (GIS) 클라이언트 ID — 백엔드의 GOOGLE_CLIENT_ID 와 동일 값.
 * 설정 시 로그인 화면에서 GIS ID-token 버튼을 활성화한다(미설정이면 Google 버튼 숨김).
 */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
export const APP_ENV = (import.meta.env.VITE_ENV || 'local') as
  | 'local'
  | 'development'
  | 'production'
export const IS_PROD = APP_ENV === 'production'
export const IS_DEV = APP_ENV === 'development'
export const IS_LOCAL = APP_ENV === 'local'
