"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const rxjs_2 = require("rxjs");
let LoggingInterceptor = class LoggingInterceptor {
    logger = new common_1.Logger('HTTP');
    isProd = process.env.NODE_ENV === 'production';
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const { method, url } = req;
        const start = Date.now();
        return next.handle().pipe((0, rxjs_1.tap)(() => {
            if (this.isProd)
                return;
            const res = context.switchToHttp().getResponse();
            const elapsed = Date.now() - start;
            this.logger.log(`${method} ${url} ${res.statusCode} ${elapsed}ms`);
        }), (0, rxjs_1.catchError)(err => {
            const elapsed = Date.now() - start;
            const status = err?.status || err?.getStatus?.() || 500;
            if (status >= 500) {
                this.logger.error(`${method} ${url} ${status} ${elapsed}ms - ${err.message}`);
            }
            else if (!this.isProd && status >= 400) {
                this.logger.warn(`${method} ${url} ${status} ${elapsed}ms - ${err.message}`);
            }
            return (0, rxjs_2.throwError)(() => err);
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
