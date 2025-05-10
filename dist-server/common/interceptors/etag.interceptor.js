"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETagInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const crypto_1 = require("crypto");
let ETagInterceptor = class ETagInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        if (request.method !== 'GET')
            return next.handle();
        return next.handle().pipe((0, rxjs_1.map)(data => {
            const response = context.switchToHttp().getResponse();
            const body = JSON.stringify(data);
            const etag = `"${(0, crypto_1.createHash)('md5').update(body).digest('hex')}"`;
            response.setHeader('ETag', etag);
            const ifNoneMatch = request.headers['if-none-match'];
            if (ifNoneMatch === etag) {
                response.status(304);
                return null;
            }
            return data;
        }));
    }
};
exports.ETagInterceptor = ETagInterceptor;
exports.ETagInterceptor = ETagInterceptor = __decorate([
    (0, common_1.Injectable)()
], ETagInterceptor);
