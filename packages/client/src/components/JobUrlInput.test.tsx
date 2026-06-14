import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import JobUrlInput from './JobUrlInput'

import { toast } from '@/components/Toast'
import { parseJobUrl } from '@/lib/api'

// api 모듈에서 parseJobUrl + ParsedJob 타입만 mock. toast 는 호출만 무시.
vi.mock('@/lib/api', () => ({
  parseJobUrl: vi.fn(),
}))
vi.mock('@/components/Toast', () => ({
  toast: vi.fn(),
}))

const parsedSample = {
  url: 'https://wanted.co.kr/wd/12345',
  source: 'json-ld' as const,
  title: 'Backend',
  company: 'WantedLab',
  position: 'Senior',
  location: 'Seoul',
  employmentType: 'fulltime',
  experienceLevel: 'senior',
  salary: '',
  skills: ['Java', 'Kotlin'],
  description: '',
  rawText: '',
}

describe('<JobUrlInput />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty by default', () => {
    render(<JobUrlInput onParsed={() => {}} />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('disables submit button when URL is empty', () => {
    render(<JobUrlInput onParsed={() => {}} />)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('shows detected site badge for known sites (원티드)', () => {
    const { container } = render(<JobUrlInput onParsed={() => {}} hint="custom hint" />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'https://www.wanted.co.kr/wd/12345' } })
    // 배지는 emerald 색상 span 으로 표시. ✓ 문자가 포함된 노드 확인
    const badge = container.querySelector('.bg-emerald-100, .dark\\:bg-emerald-900\\/30')
    expect(badge?.textContent).toMatch(/원티드/)
  })

  it('does not show badge for unknown sites', () => {
    const { container } = render(<JobUrlInput onParsed={() => {}} hint="custom hint" />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'https://random.example.com/job' } })
    const badge = container.querySelector('.bg-emerald-100, .dark\\:bg-emerald-900\\/30')
    expect(badge).toBeNull()
  })

  it('calls onParsed with parsed data on success', async () => {
    ;(parseJobUrl as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(parsedSample)
    const onParsed = vi.fn()
    render(<JobUrlInput onParsed={onParsed} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'https://wanted.co.kr/wd/12345' } })
    const button = screen.getByRole('button')
    fireEvent.click(button)
    await waitFor(() => {
      expect(onParsed).toHaveBeenCalledWith(parsedSample)
    })
    expect(parseJobUrl).toHaveBeenCalledWith('https://wanted.co.kr/wd/12345')
  })

  it('toasts on error and does not call onParsed', async () => {
    ;(parseJobUrl as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('nope'))
    const onParsed = vi.fn()
    render(<JobUrlInput onParsed={onParsed} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'https://x.com/y' } })
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => {
      expect(toast).toHaveBeenCalled()
    })
    expect(onParsed).not.toHaveBeenCalled()
  })

  it('respects disabled prop — input and button disabled', () => {
    render(<JobUrlInput onParsed={() => {}} disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
