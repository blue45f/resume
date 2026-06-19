import type { ShareResult } from './shareOrCopy'

/** 토스트 톤 — 앱 Toast 컴포넌트의 ToastType 과 동일한 유니언이라 그대로 넘길 수 있다. */
type ShareToastTone = 'success' | 'error' | 'info' | 'warning'

export interface ShareResultMessage {
  /** 사용자에게 보여줄 메시지(없으면 토스트 생략 — 예: 사용자가 직접 취소). */
  text: string | null
  tone: ShareToastTone
}

/**
 * shareOrCopy 결과를 한국어 토스트 메시지로 변환한다. 디자인/컴포넌트 의존성이 없어
 * 형제 앱에서도 그대로 재사용 가능하다. 'dismissed'(사용자 취소)는 토스트를 띄우지 않는다.
 */
export function shareResultMessage(result: ShareResult): ShareResultMessage {
  switch (result) {
    case 'shared':
      return { text: '공유했습니다', tone: 'success' }
    case 'copied':
      return { text: '링크를 클립보드에 복사했습니다', tone: 'success' }
    case 'dismissed':
      return { text: null, tone: 'info' }
    case 'unsupported':
      return { text: '이 환경에서는 공유를 지원하지 않습니다', tone: 'warning' }
  }
}
