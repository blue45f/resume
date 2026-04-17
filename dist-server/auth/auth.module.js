"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthModule", {
    enumerable: true,
    get: function() {
        return AuthModule;
    }
});
const _common = require("@nestjs/common");
const _jwt = require("@nestjs/jwt");
const _config = require("@nestjs/config");
const _authcontroller = require("./auth.controller");
const _authservice = require("./auth.service");
const _authguard = require("./auth.guard");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AuthModule = class AuthModule {
};
AuthModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _jwt.JwtModule.registerAsync({
                imports: [
                    _config.ConfigModule
                ],
                inject: [
                    _config.ConfigService
                ],
                useFactory: (config)=>{
                    const secret = config.get('JWT_SECRET');
                    const isProd = config.get('NODE_ENV') === 'production';
                    if (!secret && isProd) {
                        throw new Error('JWT_SECRET 환경변수는 프로덕션에서 반드시 설정해야 합니다');
                    }
                    return {
                        secret: secret || 'dev-only-jwt-secret-do-not-use-in-production',
                        signOptions: {
                            expiresIn: '7d'
                        }
                    };
                }
            })
        ],
        controllers: [
            _authcontroller.AuthController
        ],
        providers: [
            _authservice.AuthService,
            _authguard.AuthGuard
        ],
        exports: [
            _authservice.AuthService,
            _authguard.AuthGuard,
            _jwt.JwtModule
        ]
    })
], AuthModule);
