# Mobile Native (Capacitor) 가이드

이력서공방 web SPA 를 iOS / Android native shell 안에 wrap 해서 App Store / Play Store 배포 가능.

## 왜 Capacitor?

- 기존 Vite SPA 그대로 사용 — 별도 코드베이스 0
- WebView 안에서 동작 + native plugin 으로 카메라/마이크/푸시 등 OS API 접근
- 출시 전: PWA 로 충분, 출시 단계에 Capacitor wrap 권장

vs React Native: RN 은 native UI 컴포넌트 새로 그려야 함 (큰 refactor). 우리 UX 는 web 기반이라 Capacitor 가 자연스러움.

## 설치 / 초기화 (이미 완료됨)

```bash
cd packages/client
pnpm add -D @capacitor/cli @capacitor/core @capacitor/ios @capacitor/android
# capacitor.config.ts 작성됨
```

## 첫 빌드 (사용자 환경에서 실행)

```bash
# 1. web build
pnpm build:client                 # packages/client/dist 생성

# 2. native 프로젝트 생성 (한 번만)
cd packages/client
pnpm exec cap add ios             # ios/ 디렉토리 생성
pnpm exec cap add android         # android/ 디렉토리 생성

# 3. dist 동기화
pnpm exec cap sync

# 4. native IDE 열기
pnpm exec cap open ios            # Xcode (macOS 만)
pnpm exec cap open android        # Android Studio
```

## 권한 추가 (WebRTC 커피챗 용)

### iOS — `ios/App/App/Info.plist`

```xml
<key>NSMicrophoneUsageDescription</key>
<string>커피챗 음성 통화 시 마이크가 필요합니다</string>
<key>NSCameraUsageDescription</key>
<string>커피챗 화상 통화 시 카메라가 필요합니다</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>이력서 사진 / 프로필 아바타 업로드 시 필요합니다</string>
```

### Android — `android/app/src/main/AndroidManifest.xml`

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.microphone" android:required="false" />
```

## API URL

`VITE_API_URL` 환경변수가 production Cloud Run URL 을 가리키므로 native build 도 절대 URL 호출. 별도 변경 불필요.

## 출시 체크리스트

- [ ] App icon / splash 디자인 (`@capacitor/assets` plugin 으로 자동 생성 가능)
- [ ] App Store Connect / Play Console 계정 생성
- [ ] iOS code signing (Apple Developer $99/년)
- [ ] Android keystore 생성 + Play Signing 등록
- [ ] 앱 이름 / bundle id 확정 (`kr.resume.gongbang` 현재 default)
- [ ] 심사 정책 — 결제 (in-app purchase) 정책 확인. 외부 PG (Toss) 사용 시 구독 결제는 `external link` 정책 이슈 가능 — 무료 sign-in flow 우선시
- [ ] WebRTC 마이크/카메라 권한 prompt 한국어 메시지 (위 plist/manifest)
- [ ] PrivacyInfo.xcprivacy (iOS 17+) — 데이터 사용 명시

## Live reload (dev)

```typescript
// capacitor.config.ts
server: {
  url: 'http://192.168.0.10:5173',  // vite dev server LAN IP
  cleartext: true,
}
```

이후 `pnpm exec cap sync && pnpm exec cap run ios` 하면 dev server 에서 즉시 반영.

## 알려진 제약

- WebRTC: native shell 안 WebView 도 STUN/TURN 정상 작동 — 단 mobile carrier NAT 환경에선 TURN 필요 (이미 OpenRelay default 적용됨)
- Push 알림: Capacitor `@capacitor/push-notifications` plugin + FCM/APNs 추가 set up 필요. v1 출시는 in-app notification 만으로 충분
- 결제: App Store / Play Store 정책 따라 in-app purchase 필요할 수 있음. 이력서공방 Pro 플랜은 web-only 결제로 가는 게 안전

작성일: 2026-04-27 EOD
