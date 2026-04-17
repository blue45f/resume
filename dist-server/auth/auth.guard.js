"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get AuthGuard () {
        return AuthGuard;
    },
    get IS_PUBLIC_KEY () {
        return IS_PUBLIC_KEY;
    },
    get Public () {
        return Public;
    }
});
const _common = require("@nestjs/common");
const _jwt = require("@nestjs/jwt");
const _core = require("@nestjs/core");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
const IS_PUBLIC_KEY = 'isPublic';
const Public = ()=>(0, _common.SetMetadata)(IS_PUBLIC_KEY, true);
let AuthGuard = class AuthGuard {
    canActivate(context) {
        // @Public() 데코레이터가 있으면 인증 스킵
        const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass()
        ]);
        if (isPublic) return true;
        const request = context.switchToHttp().getRequest();
        const token = this.extractToken(request);
        // 토큰이 없으면 비로그인 사용자로 처리 (userId = null)
        if (!token) {
            request.user = null;
            return true;
        }
        try {
            const payload = this.jwt.verify(token);
            request.user = {
                id: payload.sub,
                role: payload.role || 'user'
            };
        } catch  {
            request.user = null;
        }
        return true;
    }
    extractToken(request) {
        const auth = request.headers.authorization;
        if (auth && typeof auth === 'string') {
            const parts = auth.split(/\s+/);
            if (parts.length === 2 && parts[0] === 'Bearer' && parts[1]) return parts[1];
        }
        // Fallback: httpOnly cookie
        return request.cookies?.token || null;
    }
    constructor(jwt, reflector){
        this.jwt = jwt;
        this.reflector = reflector;
    }
};
AuthGuard = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _jwt.JwtService === "undefined" ? Object : _jwt.JwtService,
        typeof _core.Reflector === "undefined" ? Object : _core.Reflector
    ])
], AuthGuard);
