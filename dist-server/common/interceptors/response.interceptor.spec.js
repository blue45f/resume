"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _responseinterceptor = require("./response.interceptor");
const _rxjs = require("rxjs");
describe('ResponseInterceptor', ()=>{
    let interceptor;
    beforeEach(()=>{
        interceptor = new _responseinterceptor.ResponseInterceptor();
    });
    const createContext = (method)=>({
            switchToHttp: ()=>({
                    getRequest: ()=>({
                            method
                        })
                })
        });
    const createHandler = (data)=>({
            handle: ()=>(0, _rxjs.of)(data)
        });
    it('GET 요청은 래핑하지 않음', (done)=>{
        interceptor.intercept(createContext('GET'), createHandler({
            id: 1
        })).subscribe((val)=>{
            expect(val).toEqual({
                id: 1
            });
            done();
        });
    });
    it('POST 응답은 { success, data }로 래핑', (done)=>{
        interceptor.intercept(createContext('POST'), createHandler({
            id: 1
        })).subscribe((val)=>{
            expect(val).toEqual({
                success: true,
                data: {
                    id: 1
                }
            });
            done();
        });
    });
    it('이미 success 필드가 있으면 래핑하지 않음', (done)=>{
        interceptor.intercept(createContext('POST'), createHandler({
            success: true
        })).subscribe((val)=>{
            expect(val).toEqual({
                success: true
            });
            done();
        });
    });
});
