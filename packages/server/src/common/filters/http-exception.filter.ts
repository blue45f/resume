import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '서버 내부 오류가 발생했습니다';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, any>;
        message = resp.message || message;
        error = resp.error || error;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
    }

    const isProd = process.env.NODE_ENV === 'production';

    const body: Record<string, any> = {
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
    };

    // Only expose request path in non-production (information leakage prevention)
    if (!isProd) {
      body.path = request.url;
    }

    // 이미 헤더 전송됐으면 set 시도 X (ERR_HTTP_HEADERS_SENT 예방).
    // stream/SSE 응답 도중 에러가 발생한 케이스 — express 가 자동으로 끊음.
    if (response.headersSent) {
      this.logger.warn(`Headers already sent for ${request.url} — skip filter response`);
      return;
    }

    response.status(status).json(body);
  }
}
