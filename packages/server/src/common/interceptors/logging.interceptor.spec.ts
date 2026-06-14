import { of } from 'rxjs'

import { LoggingInterceptor } from './logging.interceptor'

import type { CallHandler, ExecutionContext } from '@nestjs/common'

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor

  beforeEach(() => {
    interceptor = new LoggingInterceptor()
  })

  const createContext = (): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', url: '/api/test' }),
        getResponse: () => ({ statusCode: 200 }),
      }),
    }) as unknown as ExecutionContext

  const createHandler = (): CallHandler<{ data: string }> => ({
    handle: () => of({ data: 'test' }),
  })

  it('프로덕션 환경에서는 로깅 없이 통과', (done) => {
    const original = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const result$ = interceptor.intercept(createContext(), createHandler())
    result$.subscribe({
      next: (val) => {
        expect(val).toEqual({ data: 'test' })
      },
      complete: () => {
        process.env.NODE_ENV = original
        done()
      },
    })
  })

  it('개발 환경에서는 로그를 출력하고 응답을 반환', (done) => {
    const original = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const logger = (interceptor as unknown as { logger: { log: (message: string) => void } }).logger
    const logSpy = jest.spyOn(logger, 'log').mockImplementation(() => undefined)

    const result$ = interceptor.intercept(createContext(), createHandler())
    result$.subscribe({
      next: (val) => {
        expect(val).toEqual({ data: 'test' })
      },
      complete: () => {
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('GET /api/test 200'))
        logSpy.mockRestore()
        process.env.NODE_ENV = original
        done()
      },
    })
  })
})
