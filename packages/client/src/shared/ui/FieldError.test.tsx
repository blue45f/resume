import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FieldError, fieldAria } from './FieldError'

describe('fieldAria', () => {
  it('에러가 없으면 invalid/describedby 를 켜지 않는다', () => {
    expect(fieldAria('x', undefined)).toEqual({
      'aria-invalid': undefined,
      'aria-describedby': undefined,
    })
  })

  it('에러가 있으면 aria-invalid 와 "<id>-error" describedby 를 준다', () => {
    expect(fieldAria('jobpost-company', { message: '필수' })).toEqual({
      'aria-invalid': true,
      'aria-describedby': 'jobpost-company-error',
    })
  })
})

describe('FieldError', () => {
  it('메시지가 없으면 아무것도 렌더하지 않는다', () => {
    const { container } = render(<FieldError id="x" message={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('메시지가 있으면 "<id>-error" id 와 role=alert 로 렌더한다', () => {
    render(<FieldError id="jobpost-company" message="회사명을 입력하세요" />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('회사명을 입력하세요')
    expect(alert).toHaveAttribute('id', 'jobpost-company-error')
  })
})
