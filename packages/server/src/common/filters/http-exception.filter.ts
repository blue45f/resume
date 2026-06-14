import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = '서버 내부 오류가 발생했습니다'
    let error = 'Internal Server Error'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>
        if (typeof resp.message === 'string') {
          message = resp.message
        } else if (Array.isArray(resp.message)) {
          message = resp.message
            .filter((item): item is string => typeof item === 'string')
            .join(', ')
        }
        if (typeof resp.error === 'string') {
          error = resp.error
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack)
    }

    const isProd = process.env.NODE_ENV === 'production'

    const body: Record<string, unknown> = {
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
    }

    // Only expose request path in non-production (information leakage prevention)
    if (!isProd) {
      body.path = request.url
    }

    // ── 1) request 가 이미 abort 되었으면 socket 에 쓰지 않음 (ERR_STREAM_PREMATURE_CLOSE 예방).
    //    client 가 끊었을 뿐 에러는 아님 — debug 로그만 남기고 즉시 종료.
    if (request.aborted || (request.socket && request.socket.destroyed)) {
      this.logger.debug(
        `Request aborted by client: ${request.method} ${request.url} — skip filter response`
      )
      // stream 응답 진행 중이었다면 res.end() 호출해 소켓 누수 방지
      if (!response.writableEnded) {
        try {
          response.end()
        } catch {
          /* noop */
        }
      }
      return
    }

    // ── 2) 이미 헤더 전송됐으면 set 시도 X (ERR_HTTP_HEADERS_SENT 예방).
    //    stream/SSE 응답 도중 에러가 발생한 케이스 — finalize 만 호출.
    if (response.headersSent) {
      this.logger.warn(`Headers already sent for ${request.url} — finalize stream`)
      if (!response.writableEnded) {
        try {
          response.end()
        } catch {
          /* noop */
        }
      }
      return
    }

    // ── 3) writableEnded 도 별도 가드 — drain 후 늦은 에러 케이스 방어.
    if (response.writableEnded) {
      this.logger.debug(`Response already ended for ${request.url} — skip filter response`)
      return
    }

    response.status(status).json(body)
  }
}
