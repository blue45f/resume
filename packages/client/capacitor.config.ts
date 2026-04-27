import type { CapacitorConfig } from '@capacitor/cli';

/**
 * 이력서공방 Capacitor wrap.
 * 기존 Vercel SPA 를 그대로 ios/android native shell 안에서 띄움.
 *
 * Build & run:
 *   pnpm build:client                       # dist/ 생성
 *   pnpm exec cap sync                       # ios/android 프로젝트에 dist 복사
 *   pnpm exec cap open ios                   # Xcode 열기
 *   pnpm exec cap open android               # Android Studio 열기
 *
 * Live reload (dev):
 *   server.url 을 vite dev server (http://192.168.x.x:5173) 로 가리키고
 *   cap sync 후 native run.
 */
const config: CapacitorConfig = {
  appId: 'kr.resume.gongbang',
  appName: '이력서공방',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    contentInset: 'always',
    backgroundColor: '#f8fafc',
  },
  android: {
    backgroundColor: '#f8fafc',
    allowMixedContent: false,
    captureInput: true,
  },
  server: {
    // 운영: dist 정적 파일 (Vercel 동일 자원). 미디어/api 호출은 VITE_API_URL 로 절대 경로 사용 중이라 OK
    androidScheme: 'https',
    // dev 시 아래 주석 해제 후 vite dev server 의 LAN IP 입력:
    // url: 'http://192.168.0.x:5173',
    // cleartext: true,
  },
  plugins: {
    // 마이크/카메라 권한 (커피챗 WebRTC 용) — info.plist / AndroidManifest 수정 필요
    // 별도 plugin install 시 사용: @capacitor/camera, @capacitor/share 등
  },
};

export default config;
