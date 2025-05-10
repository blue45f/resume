import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
export declare const CACHE_TTL_KEY = "cache_ttl";
export declare const CacheTTL: (seconds: number) => import("@nestjs/common").CustomDecorator<string>;
export declare class CacheHeaderInterceptor implements NestInterceptor {
    private reflector;
    constructor(reflector: Reflector);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
