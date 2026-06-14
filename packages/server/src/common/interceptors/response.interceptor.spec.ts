import { of } from 'rxjs'

import { ResponseInterceptor } from './response.interceptor'

import type { CallHandler, ExecutionContext } from '@nestjs/common'

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor

  beforeEach(() => {
    interceptor = new ResponseInterceptor()
  })

  const createContext = (method: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ method }),
      }),
    }) as unknown as ExecutionContext

  const createHandler = <T>(data: T): CallHandler<T> => ({
    handle: () => of(data),
  })

  it('GET 요청은 래핑하지 않음', (done) => {
    interceptor.intercept(createContext('GET'), createHandler({ id: 1 })).subscribe((val) => {
      expect(val).toEqual({ id: 1 })
      done()
    })
  })

  it('POST 응답은 { success, data }로 래핑', (done) => {
    interceptor.intercept(createContext('POST'), createHandler({ id: 1 })).subscribe((val) => {
      expect(val).toEqual({ success: true, data: { id: 1 } })
      done()
    })
  })

  it('이미 success 필드가 있으면 래핑하지 않음', (done) => {
    interceptor
      .intercept(createContext('POST'), createHandler({ success: true }))
      .subscribe((val) => {
        expect(val).toEqual({ success: true })
        done()
      })
  })
})
