import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        const request = context.switchToHttp().getRequest();
        // Don't wrap GET responses or streaming responses
        if (request.method === 'GET') return data;
        // Don't wrap if already has success field
        if (data && typeof data === 'object' && 'success' in data) return data;
        return { success: true, data };
      }),
    );
  }
}
