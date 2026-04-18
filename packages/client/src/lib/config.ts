/**
 * Shared application configuration constants.
 * Import API_URL from here instead of redefining it in every file.
 *
 * 환경별 API URL:
 *   로컬:   http://localhost:3001        (.env.local)
 *   개발:   https://resume-api-mm0o.onrender.com  (.env.development)
 *   운영:   https://resume-api-464016453534.asia-northeast3.run.app  (.env.production)
 */
export const API_URL = import.meta.env.VITE_API_URL || '';
export const APP_ENV = (import.meta.env.VITE_ENV || 'local') as
  | 'local'
  | 'development'
  | 'production';
export const IS_PROD = APP_ENV === 'production';
export const IS_DEV = APP_ENV === 'development';
export const IS_LOCAL = APP_ENV === 'local';
