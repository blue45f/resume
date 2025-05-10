"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logging_interceptor_1 = require("./logging.interceptor");
const rxjs_1 = require("rxjs");
describe('LoggingInterceptor', () => {
    let interceptor;
    beforeEach(() => {
        interceptor = new logging_interceptor_1.LoggingInterceptor();
    });
    const createContext = () => ({
        switchToHttp: () => ({
            getRequest: () => ({ method: 'GET', url: '/api/test' }),
            getResponse: () => ({ statusCode: 200 }),
        }),
    });
    const createHandler = () => ({
        handle: () => (0, rxjs_1.of)({ data: 'test' }),
    });
    it('프로덕션 환경에서는 로깅 없이 통과', (done) => {
        const original = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        const result$ = interceptor.intercept(createContext(), createHandler());
        result$.subscribe({
            next: (val) => {
                expect(val).toEqual({ data: 'test' });
            },
            complete: () => {
                process.env.NODE_ENV = original;
                done();
            },
        });
    });
    it('개발 환경에서는 로그를 출력하고 응답을 반환', (done) => {
        const original = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';
        const logSpy = jest.spyOn(interceptor.logger, 'log').mockImplementation();
        const result$ = interceptor.intercept(createContext(), createHandler());
        result$.subscribe({
            next: (val) => {
                expect(val).toEqual({ data: 'test' });
            },
            complete: () => {
                expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('GET /api/test 200'));
                logSpy.mockRestore();
                process.env.NODE_ENV = original;
                done();
            },
        });
    });
});
