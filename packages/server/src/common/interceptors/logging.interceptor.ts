import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  private readonly isProd = process.env.NODE_ENV === 'production';

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        if (this.isProd) return;
        const res = context.switchToHttp().getResponse();
        const elapsed = Date.now() - start;
        this.logger.log(`${method} ${url} ${res.statusCode} ${elapsed}ms`);
      }),
      catchError((err) => {
        const elapsed = Date.now() - start;
        const status = err?.status || err?.getStatus?.() || 500;
        if (status >= 500) {
          this.logger.error(`${method} ${url} ${status} ${elapsed}ms - ${err.message}`);
        } else if (!this.isProd && status >= 400) {
          this.logger.warn(`${method} ${url} ${status} ${elapsed}ms - ${err.message}`);
        }
        return throwError(() => err);
      }),
    );
  }
}
