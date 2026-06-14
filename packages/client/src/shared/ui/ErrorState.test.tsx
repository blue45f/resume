import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ErrorState } from './ErrorState'

describe('ErrorState', () => {
  it('role=alert 로 렌더되어 빈 상태와 구분된다', () => {
    render(<ErrorState onRetry={() => {}} />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('데이터를 불러오지 못했습니다')
    expect(alert).toHaveTextContent('30~60초')
  })

  it('커스텀 message/hint 를 렌더한다', () => {
    render(<ErrorState message="북마크를 불러오지 못했습니다" hint="잠시 후" onRetry={() => {}} />)
    expect(screen.getByRole('alert')).toHaveTextContent('북마크를 불러오지 못했습니다')
    expect(screen.getByRole('alert')).toHaveTextContent('잠시 후')
  })

  it('재시도 버튼이 onRetry 를 호출한다', () => {
    const onRetry = vi.fn()
    render(<ErrorState onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
