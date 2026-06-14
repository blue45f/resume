import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import CoverLetterLengthBalancePanel from './CoverLetterLengthBalancePanel'

describe('<CoverLetterLengthBalancePanel />', () => {
  it('renders nothing when there is no text', () => {
    const { container } = render(<CoverLetterLengthBalancePanel text="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('keeps suggestions concise when multiple length issues are present', () => {
    const noisyText = '정말짧다. '.repeat(700)

    render(<CoverLetterLengthBalancePanel text={noisyText} />)

    expect(
      screen.getByRole('complementary', { name: '자기소개서 길이·구성 분석' })
    ).toBeInTheDocument()
    const suggestions = screen.getByRole('list', { name: '개선 제안' }).querySelectorAll('li')
    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions.length).toBeLessThanOrEqual(3)
  })
})
