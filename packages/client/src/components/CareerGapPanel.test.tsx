import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import CareerGapPanel from './CareerGapPanel'

describe('<CareerGapPanel />', () => {
  it('returns null when there are no career gaps', () => {
    const text = `
이력서 본문 충분히 길어야 minLength 통과합니다. ${'.'.repeat(200)}
경력: A사 · 2019.01 ~ 2020.12
경력: B사 · 2021.01 ~ 2022.12
`
    const { container } = render(<CareerGapPanel text={text} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('returns null when text is too short', () => {
    const { container } = render(<CareerGapPanel text="짧음" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a section with gap list when gaps detected', () => {
    const text = `
이력서 본문 충분히 길어야 minLength 통과합니다. ${'.'.repeat(200)}
경력: A사 · 2017.01 ~ 2018.06
경력: B사 · 2021.01 ~ 2022.12
`
    const { container } = render(<CareerGapPanel text={text} />)
    const section = container.querySelector('section')
    expect(section).toBeInTheDocument()
    expect(section?.getAttribute('aria-labelledby')).toBe('career-gap-panel-title')
    // 최소 한 개의 갭이 표시되어야 함
    expect(container.querySelectorAll('li').length).toBeGreaterThanOrEqual(1)
  })
})
