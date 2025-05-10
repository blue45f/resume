"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const response_interceptor_1 = require("./response.interceptor");
const rxjs_1 = require("rxjs");
describe('ResponseInterceptor', () => {
    let interceptor;
    beforeEach(() => {
        interceptor = new response_interceptor_1.ResponseInterceptor();
    });
    const createContext = (method) => ({
        switchToHttp: () => ({
            getRequest: () => ({ method }),
        }),
    });
    const createHandler = (data) => ({
        handle: () => (0, rxjs_1.of)(data),
    });
    it('GET 요청은 래핑하지 않음', (done) => {
        interceptor.intercept(createContext('GET'), createHandler({ id: 1 }))
            .subscribe(val => {
            expect(val).toEqual({ id: 1 });
            done();
        });
    });
    it('POST 응답은 { success, data }로 래핑', (done) => {
        interceptor.intercept(createContext('POST'), createHandler({ id: 1 }))
            .subscribe(val => {
            expect(val).toEqual({ success: true, data: { id: 1 } });
            done();
        });
    });
    it('이미 success 필드가 있으면 래핑하지 않음', (done) => {
        interceptor.intercept(createContext('POST'), createHandler({ success: true }))
            .subscribe(val => {
            expect(val).toEqual({ success: true });
            done();
        });
    });
});
