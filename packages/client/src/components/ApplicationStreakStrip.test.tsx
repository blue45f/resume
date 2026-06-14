import { beforeEach, describe, expect, it } from 'vitest'

import ApplicationStreakStrip from './ApplicationStreakStrip'

import type { JobApplication } from '@/lib/api'

import { APPLICATION_TARGET_STORAGE_KEY } from '@/lib/applicationStreakTracker'
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/render'

function application(id = 'app-1'): JobApplication {
  return {
    id,
    company: '테스트컴퍼니',
    position: '프론트엔드 엔지니어',
    status: 'applied',
    appliedDate: '2026-05-25T09:00:00Z',
    createdAt: '2026-05-25T09:00:00Z',
    updatedAt: '2026-05-25T09:00:00Z',
  }
}

describe('ApplicationStreakStrip', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('clamps manually typed weekly targets to the UI maximum', async () => {
    renderWithProviders(<ApplicationStreakStrip applications={[application()]} />)

    fireEvent.click(screen.getByRole('button', { name: /주간 목표 5건 수정/ }))
    const input = screen.getByLabelText('주간 지원 목표')

    fireEvent.change(input, { target: { value: '99' } })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /주간 목표 20건 수정/ })).toBeInTheDocument()
    })
    expect(localStorage.getItem(APPLICATION_TARGET_STORAGE_KEY)).toBe('20')
  })

  it('clamps previously stored weekly targets to the UI maximum', () => {
    localStorage.setItem(APPLICATION_TARGET_STORAGE_KEY, '50')

    renderWithProviders(<ApplicationStreakStrip applications={[application()]} />)

    expect(screen.getByRole('button', { name: /주간 목표 20건 수정/ })).toBeInTheDocument()
  })
})
