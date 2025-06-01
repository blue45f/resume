import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
export declare const IS_PUBLIC_KEY = "isPublic";
export declare const Public: () => import("@nestjs/common").CustomDecorator<string>;
export declare class AuthGuard implements CanActivate {
    private jwt;
    private reflector;
    constructor(jwt: JwtService, reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
    private extractToken;
}
