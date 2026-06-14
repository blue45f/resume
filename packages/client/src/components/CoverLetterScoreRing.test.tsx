import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import CoverLetterScoreRing from './CoverLetterScoreRing'

const LETTER = [
  '귀사의 결제 서비스에 매력을 느껴 지원하게 되었습니다.',
  '저의 강점은 백엔드 설계 역량입니다.',
  '이전 프로젝트에서 결제 시스템을 개발해 응답 시간을 40% 단축했습니다.',
  '입사 후 기여하고 싶습니다. 면접 기회를 주시면 자세히 말씀드리겠습니다.',
].join('\n\n')

describe('CoverLetterScoreRing', () => {
  it('renders nothing for short text', () => {
    const { container } = render(<CoverLetterScoreRing text="짧은 자소서" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders an SVG ring with 4 axis bars', () => {
    const { container } = render(<CoverLetterScoreRing text={LETTER} />)
    expect(container.querySelector('.cl-ring__svg')).not.toBeNull()
    expect(container.querySelectorAll('.cl-ring__axis').length).toBe(4)
    expect(screen.getByLabelText('자기소개서 종합 점수')).toBeTruthy()
  })

  it('sets valid ring dashoffset custom properties (no NaN)', () => {
    const { container } = render(<CoverLetterScoreRing text={LETTER} />)
    const valueCircle = container.querySelector('.cl-ring__value') as SVGElement | null
    const style = valueCircle?.getAttribute('style') ?? ''
    expect(style).toContain('--ring-c')
    expect(style).not.toContain('NaN')
  })
})
