import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import CoverLetterFlowStrip from './CoverLetterFlowStrip'

const LETTER = [
  '귀사의 결제 서비스에 매력을 느껴 지원하게 되었습니다.',
  '저의 강점은 백엔드 설계 역량입니다.',
  '이전 프로젝트에서 결제 시스템을 개발했습니다.',
  '입사 후 결제 안정성에 기여하고 싶습니다.',
].join('\n\n')

describe('CoverLetterFlowStrip', () => {
  it('renders nothing for short text', () => {
    const { container } = render(<CoverLetterFlowStrip text="짧은 자소서" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders one segment per paragraph with valid flex-grow', () => {
    const { container } = render(<CoverLetterFlowStrip text={LETTER} />)
    const segs = container.querySelectorAll('.flow-strip__seg')
    expect(segs.length).toBe(4)
    segs.forEach((s) => {
      const grow = (s as HTMLElement).style.flexGrow
      expect(Number.isNaN(Number(grow))).toBe(false)
      expect(Number(grow)).toBeGreaterThanOrEqual(1)
    })
  })

  it('renders a legend', () => {
    const { container } = render(<CoverLetterFlowStrip text={LETTER} />)
    expect(container.querySelectorAll('.flow-strip__legend-item').length).toBeGreaterThan(0)
  })
})
