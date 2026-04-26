import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { createHash } from 'crypto';

@Injectable()
export class ETagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    if (request.method !== 'GET') return next.handle();

    return next.handle().pipe(
      map((data) => {
        if (data === undefined || data === null) return data;
        const body = JSON.stringify(data);
        if (typeof body !== 'string') return data;

        const response = context.switchToHttp().getResponse();
        if (response.headersSent) return data;

        const etag = `"${createHash('md5').update(body).digest('hex')}"`;
        response.setHeader('ETag', etag);

        if (request.headers['if-none-match'] === etag) {
          response.status(304);
          return null;
        }
        return data;
      }),
    );
  }
}
