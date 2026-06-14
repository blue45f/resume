import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import QuotableHighlights from './QuotableHighlights'

const longResume = `
자기소개: 7년차 백엔드 개발자로서 대규모 트래픽 서비스 설계·운영 경험.
경력: 카카오 · 시니어 엔지니어 · 2020.01 ~ 2022.12
결제 플랫폼 리팩토링을 주도하여 응답시간을 30% 단축하고 장애율을 50% 감소시켰습니다.
경력: 네이버 · 백엔드 개발자 · 2016.03 ~ 2019.12
추천 시스템 개발을 담당했고 일 사용자 100만명 기반 API 를 설계·구축했습니다.
스킬 (Backend): Java, Kotlin, Spring, JPA, Kafka, PostgreSQL
`.trim()

describe('<QuotableHighlights />', () => {
  it('renders nothing when text is below minLength', () => {
    const { container } = render(<QuotableHighlights text="짧은 글" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when text is empty', () => {
    const { container } = render(<QuotableHighlights text="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a section with at most topN quotable lines', () => {
    render(<QuotableHighlights text={longResume} topN={3} />)
    const section = screen.getByRole('region', { hidden: true })
    expect(section).toBeInTheDocument()
    const items = section.querySelectorAll('li')
    expect(items.length).toBeGreaterThan(0)
    expect(items.length).toBeLessThanOrEqual(3)
  })

  it('uses aria-labelledby pointing at the title heading', () => {
    const { container } = render(<QuotableHighlights text={longResume} />)
    const section = container.querySelector('section')
    expect(section?.getAttribute('aria-labelledby')).toBe('quotable-highlights-title')
    expect(container.querySelector('#quotable-highlights-title')).toBeInTheDocument()
  })
})
