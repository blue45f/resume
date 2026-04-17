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
    get CACHE_TTL_KEY () {
        return CACHE_TTL_KEY;
    },
    get CacheHeaderInterceptor () {
        return CacheHeaderInterceptor;
    },
    get CacheTTL () {
        return CacheTTL;
    }
});
const _common = require("@nestjs/common");
const _rxjs = require("rxjs");
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
const CACHE_TTL_KEY = 'cache_ttl';
const CacheTTL = (seconds)=>(0, _common.SetMetadata)(CACHE_TTL_KEY, seconds);
let CacheHeaderInterceptor = class CacheHeaderInterceptor {
    intercept(context, next) {
        return next.handle().pipe((0, _rxjs.tap)(()=>{
            const ttl = this.reflector.get(CACHE_TTL_KEY, context.getHandler());
            if (!ttl) return;
            const response = context.switchToHttp().getResponse();
            response.setHeader('Cache-Control', `public, max-age=${ttl}, s-maxage=${ttl}`);
        }));
    }
    constructor(reflector){
        this.reflector = reflector;
    }
};
CacheHeaderInterceptor = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _core.Reflector === "undefined" ? Object : _core.Reflector
    ])
], CacheHeaderInterceptor);
