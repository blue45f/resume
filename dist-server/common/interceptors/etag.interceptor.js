"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ETagInterceptor", {
    enumerable: true,
    get: function() {
        return ETagInterceptor;
    }
});
const _common = require("@nestjs/common");
const _rxjs = require("rxjs");
const _crypto = require("crypto");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let ETagInterceptor = class ETagInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        if (request.method !== 'GET') return next.handle();
        return next.handle().pipe((0, _rxjs.map)((data)=>{
            const response = context.switchToHttp().getResponse();
            const body = JSON.stringify(data);
            const etag = `"${(0, _crypto.createHash)('md5').update(body).digest('hex')}"`;
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
ETagInterceptor = _ts_decorate([
    (0, _common.Injectable)()
], ETagInterceptor);
