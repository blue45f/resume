import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  SetMetadata,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable, tap } from 'rxjs'

export const CACHE_TTL_KEY = 'cache_ttl'
export const CacheTTL = (seconds: number) => SetMetadata(CACHE_TTL_KEY, seconds)

@Injectable()
export class CacheHeaderInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap(() => {
        const ttl = this.reflector.get<number>(CACHE_TTL_KEY, context.getHandler())
        if (!ttl) return

        const response = context.switchToHttp().getResponse()
        response.setHeader('Cache-Control', `public, max-age=${ttl}, s-maxage=${ttl}`)
      })
    )
  }
}
