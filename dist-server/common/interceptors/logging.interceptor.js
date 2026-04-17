"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LoggingInterceptor", {
    enumerable: true,
    get: function() {
        return LoggingInterceptor;
    }
});
const _common = require("@nestjs/common");
const _rxjs = require("rxjs");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let LoggingInterceptor = class LoggingInterceptor {
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const { method, url } = req;
        const start = Date.now();
        return next.handle().pipe((0, _rxjs.tap)(()=>{
            if (this.isProd) return;
            const res = context.switchToHttp().getResponse();
            const elapsed = Date.now() - start;
            this.logger.log(`${method} ${url} ${res.statusCode} ${elapsed}ms`);
        }), (0, _rxjs.catchError)((err)=>{
            const elapsed = Date.now() - start;
            const status = err?.status || err?.getStatus?.() || 500;
            if (status >= 500) {
                this.logger.error(`${method} ${url} ${status} ${elapsed}ms - ${err.message}`);
            } else if (!this.isProd && status >= 400) {
                this.logger.warn(`${method} ${url} ${status} ${elapsed}ms - ${err.message}`);
            }
            return (0, _rxjs.throwError)(()=>err);
        }));
    }
    constructor(){
        this.logger = new _common.Logger('HTTP');
        this.isProd = process.env.NODE_ENV === 'production';
    }
};
LoggingInterceptor = _ts_decorate([
    (0, _common.Injectable)()
], LoggingInterceptor);
