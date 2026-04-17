"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "GlobalExceptionFilter", {
    enumerable: true,
    get: function() {
        return GlobalExceptionFilter;
    }
});
const _common = require("@nestjs/common");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let GlobalExceptionFilter = class GlobalExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = _common.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = '서버 내부 오류가 발생했습니다';
        let error = 'Internal Server Error';
        if (exception instanceof _common.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const resp = exceptionResponse;
                message = resp.message || message;
                error = resp.error || error;
            }
        } else if (exception instanceof Error) {
            this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
        }
        const isProd = process.env.NODE_ENV === 'production';
        const body = {
            statusCode: status,
            error,
            message,
            timestamp: new Date().toISOString()
        };
        // Only expose request path in non-production (information leakage prevention)
        if (!isProd) {
            body.path = request.url;
        }
        response.status(status).json(body);
    }
    constructor(){
        this.logger = new _common.Logger(GlobalExceptionFilter.name);
    }
};
GlobalExceptionFilter = _ts_decorate([
    (0, _common.Catch)()
], GlobalExceptionFilter);
