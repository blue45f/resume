import {
  HttpException,
  ArgumentsHost,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common'

import { GlobalExceptionFilter } from './http-exception.filter'

type ErrorResponseBody = {
  statusCode: number
  error?: string
  message?: string
  timestamp?: string
  path?: string
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter
  let mockJson: jest.Mock
  let mockStatus: jest.Mock
  let mockHost: ArgumentsHost

  beforeEach(() => {
    filter = new GlobalExceptionFilter()
    mockJson = jest.fn()
    mockStatus = jest.fn().mockReturnValue({ json: mockJson })
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ url: '/api/test' }),
      }),
    } as unknown as ArgumentsHost
  })

  function catchAndGetBody(exception: unknown): ErrorResponseBody {
    filter.catch(exception, mockHost)
    return mockJson.mock.calls[0][0] as ErrorResponseBody
  }

  // --- HttpException ---

  it('HttpException → 해당 상태코드 반환', () => {
    filter.catch(new BadRequestException('잘못된 요청'), mockHost)
    expect(mockStatus).toHaveBeenCalledWith(400)
  })

  it('BadRequestException → 메시지 포함', () => {
    const body = catchAndGetBody(new BadRequestException('필드가 비어있습니다'))
    expect(body.statusCode).toBe(400)
    expect(body.message).toBe('필드가 비어있습니다')
  })

  it('NotFoundException → 404 반환', () => {
    const body = catchAndGetBody(new NotFoundException('리소스를 찾을 수 없습니다'))
    expect(body.statusCode).toBe(404)
    expect(body.message).toBe('리소스를 찾을 수 없습니다')
  })

  it('ForbiddenException → 403 반환', () => {
    const body = catchAndGetBody(new ForbiddenException('접근 권한 없음'))
    expect(body.statusCode).toBe(403)
    expect(body.message).toBe('접근 권한 없음')
  })

  it('UnauthorizedException → 401 반환', () => {
    const body = catchAndGetBody(new UnauthorizedException())
    expect(body.statusCode).toBe(401)
  })

  it('HttpException 문자열 응답 → message에 반영', () => {
    const body = catchAndGetBody(new HttpException('커스텀 에러', 422))
    expect(body.statusCode).toBe(422)
    expect(body.message).toBe('커스텀 에러')
  })

  it('HttpException 객체 응답 → message와 error 모두 반영', () => {
    const body = catchAndGetBody(
      new HttpException({ message: '상세 에러', error: 'Validation Error' }, 400)
    )
    expect(body.message).toBe('상세 에러')
    expect(body.error).toBe('Validation Error')
  })

  // --- Unknown 에러 (비-HttpException) ---

  it('일반 Error → 500 반환', () => {
    const body = catchAndGetBody(new Error('unexpected'))
    expect(body.statusCode).toBe(500)
    expect(body.error).toBe('Internal Server Error')
    expect(body.message).toBe('서버 내부 오류가 발생했습니다')
  })

  it('문자열 예외 → 500 반환', () => {
    const body = catchAndGetBody('string error')
    expect(body.statusCode).toBe(500)
  })

  it('null 예외 → 500 반환', () => {
    const body = catchAndGetBody(null)
    expect(body.statusCode).toBe(500)
  })

  it('undefined 예외 → 500 반환', () => {
    const body = catchAndGetBody(undefined)
    expect(body.statusCode).toBe(500)
  })

  // --- 응답 형식 ---

  it('응답에 timestamp 포함', () => {
    const body = catchAndGetBody(new BadRequestException('test'))
    expect(body.timestamp).toBeDefined()
    expect(typeof body.timestamp).toBe('string')
    // ISO 형식 확인
    expect(() => new Date(body.timestamp ?? '')).not.toThrow()
  })

  it('비 production에서 path 포함', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    const body = catchAndGetBody(new BadRequestException('test'))
    expect(body.path).toBe('/api/test')
    process.env.NODE_ENV = originalEnv
  })

  it('production에서 path 미포함', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    const body = catchAndGetBody(new BadRequestException('test'))
    expect(body.path).toBeUndefined()
    process.env.NODE_ENV = originalEnv
  })

  it('응답에 statusCode, error, message, timestamp 필드 존재', () => {
    const body = catchAndGetBody(new BadRequestException('test'))
    expect(body).toHaveProperty('statusCode')
    expect(body).toHaveProperty('error')
    expect(body).toHaveProperty('message')
    expect(body).toHaveProperty('timestamp')
  })

  it('headersSent === true 면 status/json 호출 안 함 (ERR_HTTP_HEADERS_SENT 방지)', () => {
    const sentJsonMock = jest.fn()
    const sentStatusMock = jest.fn().mockReturnValue({ json: sentJsonMock })
    const hostWithSentHeaders = {
      switchToHttp: () => ({
        getResponse: () => ({ status: sentStatusMock, headersSent: true }),
        getRequest: () => ({ url: '/api/stream' }),
      }),
    } as unknown as ArgumentsHost
    filter.catch(new Error('downstream stream error'), hostWithSentHeaders)
    expect(sentStatusMock).not.toHaveBeenCalled()
    expect(sentJsonMock).not.toHaveBeenCalled()
  })

  // ── 추가: P2-4 — abort/writableEnded 가드
  it('request.aborted === true 면 응답 skip + writableEnded 면 end 호출 안함', () => {
    const endMock = jest.fn()
    const statusMock = jest.fn()
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({
          status: statusMock,
          headersSent: true,
          writableEnded: true,
          end: endMock,
        }),
        getRequest: () => ({
          url: '/api/abort',
          method: 'GET',
          aborted: true,
          socket: { destroyed: false },
        }),
      }),
    } as unknown as ArgumentsHost
    filter.catch(new Error('client abort'), host)
    expect(statusMock).not.toHaveBeenCalled()
    expect(endMock).not.toHaveBeenCalled() // writableEnded 면 end 호출 안함
  })

  it('socket.destroyed === true 면 응답 skip (abort 케이스 변형)', () => {
    const statusMock = jest.fn()
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusMock, headersSent: false, writableEnded: false }),
        getRequest: () => ({
          url: '/api/destroyed',
          method: 'POST',
          aborted: false,
          socket: { destroyed: true },
        }),
      }),
    } as unknown as ArgumentsHost
    filter.catch(new Error('socket destroyed'), host)
    expect(statusMock).not.toHaveBeenCalled()
  })

  it('writableEnded === true & 헤더는 아직 → skip (drain 후 늦은 에러)', () => {
    const statusMock = jest.fn()
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusMock, headersSent: false, writableEnded: true }),
        getRequest: () => ({
          url: '/api/late',
          method: 'GET',
          aborted: false,
          socket: { destroyed: false },
        }),
      }),
    } as unknown as ArgumentsHost
    filter.catch(new Error('late error'), host)
    expect(statusMock).not.toHaveBeenCalled()
  })

  it('headersSent === true & writableEnded=false → end() 호출로 소켓 finalize', () => {
    const endMock = jest.fn()
    const statusMock = jest.fn()
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({
          status: statusMock,
          headersSent: true,
          writableEnded: false,
          end: endMock,
        }),
        getRequest: () => ({
          url: '/api/stream-error',
          method: 'GET',
          aborted: false,
          socket: { destroyed: false },
        }),
      }),
    } as unknown as ArgumentsHost
    filter.catch(new Error('mid stream error'), host)
    expect(endMock).toHaveBeenCalled()
    expect(statusMock).not.toHaveBeenCalled()
  })
})
