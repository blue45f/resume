"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheHeaderInterceptor = exports.CacheTTL = exports.CACHE_TTL_KEY = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const core_1 = require("@nestjs/core");
const common_2 = require("@nestjs/common");
exports.CACHE_TTL_KEY = 'cache_ttl';
const CacheTTL = (seconds) => (0, common_2.SetMetadata)(exports.CACHE_TTL_KEY, seconds);
exports.CacheTTL = CacheTTL;
let CacheHeaderInterceptor = class CacheHeaderInterceptor {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    intercept(context, next) {
        return next.handle().pipe((0, rxjs_1.tap)(() => {
            const ttl = this.reflector.get(exports.CACHE_TTL_KEY, context.getHandler());
            if (!ttl)
                return;
            const response = context.switchToHttp().getResponse();
            response.setHeader('Cache-Control', `public, max-age=${ttl}, s-maxage=${ttl}`);
        }));
    }
};
exports.CacheHeaderInterceptor = CacheHeaderInterceptor;
exports.CacheHeaderInterceptor = CacheHeaderInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], CacheHeaderInterceptor);
