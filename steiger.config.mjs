import { defineConfig } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin'

// resume(이력서공방)는 포트폴리오에서 유일하게 FSD 레이어(app/pages/widgets/
// features/entities/shared)를 명시적으로 채택한 저장소다. 개발가이드 §4.3 원칙대로
// Steiger는 이 저장소에만 적용한다.
//
// 정책:
// - 개발가이드 §1.6은 "기계적 FSD 분할보다 기능 중심 co-location"을 기본값으로 두므로,
//   슬라이스 크기/세그먼트를 강제하는 의견성 규칙은 **끈다**.
// - 캡슐화(Public API) 계열 규칙은 CI에서 실패하는 hard gate로 둔다.
export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      // co-location 선호와 충돌 → 비활성화
      'fsd/insignificant-slice': 'off',
      'fsd/no-segmentless-slices': 'off',
      // 캡슐화 규칙 — 신규/기존 코드 모두 위반 시 실패.
      'fsd/public-api': 'error',
      'fsd/no-public-api-sidestep': 'error',
      'fsd/no-layer-public-api': 'error',
    },
  },
  {
    ignores: ['**/*.test.*', '**/*.stories.*', '**/__tests__/**'],
  },
])
