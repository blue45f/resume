"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _httpexceptionfilter = require("./http-exception.filter");
const _common = require("@nestjs/common");
describe('GlobalExceptionFilter', ()=>{
    let filter;
    let mockJson;
    let mockStatus;
    let mockHost;
    beforeEach(()=>{
        filter = new _httpexceptionfilter.GlobalExceptionFilter();
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({
            json: mockJson
        });
        mockHost = {
            switchToHttp: ()=>({
                    getResponse: ()=>({
                            status: mockStatus
                        }),
                    getRequest: ()=>({
                            url: '/api/test'
                        })
                })
        };
    });
    function catchAndGetBody(exception) {
        filter.catch(exception, mockHost);
        return mockJson.mock.calls[0][0];
    }
    // --- HttpException ---
    it('HttpException → 해당 상태코드 반환', ()=>{
        filter.catch(new _common.BadRequestException('잘못된 요청'), mockHost);
        expect(mockStatus).toHaveBeenCalledWith(400);
    });
    it('BadRequestException → 메시지 포함', ()=>{
        const body = catchAndGetBody(new _common.BadRequestException('필드가 비어있습니다'));
        expect(body.statusCode).toBe(400);
        expect(body.message).toBe('필드가 비어있습니다');
    });
    it('NotFoundException → 404 반환', ()=>{
        const body = catchAndGetBody(new _common.NotFoundException('리소스를 찾을 수 없습니다'));
        expect(body.statusCode).toBe(404);
        expect(body.message).toBe('리소스를 찾을 수 없습니다');
    });
    it('ForbiddenException → 403 반환', ()=>{
        const body = catchAndGetBody(new _common.ForbiddenException('접근 권한 없음'));
        expect(body.statusCode).toBe(403);
        expect(body.message).toBe('접근 권한 없음');
    });
    it('UnauthorizedException → 401 반환', ()=>{
        const body = catchAndGetBody(new _common.UnauthorizedException());
        expect(body.statusCode).toBe(401);
    });
    it('HttpException 문자열 응답 → message에 반영', ()=>{
        const body = catchAndGetBody(new _common.HttpException('커스텀 에러', 422));
        expect(body.statusCode).toBe(422);
        expect(body.message).toBe('커스텀 에러');
    });
    it('HttpException 객체 응답 → message와 error 모두 반영', ()=>{
        const body = catchAndGetBody(new _common.HttpException({
            message: '상세 에러',
            error: 'Validation Error'
        }, 400));
        expect(body.message).toBe('상세 에러');
        expect(body.error).toBe('Validation Error');
    });
    // --- Unknown 에러 (비-HttpException) ---
    it('일반 Error → 500 반환', ()=>{
        const body = catchAndGetBody(new Error('unexpected'));
        expect(body.statusCode).toBe(500);
        expect(body.error).toBe('Internal Server Error');
        expect(body.message).toBe('서버 내부 오류가 발생했습니다');
    });
    it('문자열 예외 → 500 반환', ()=>{
        const body = catchAndGetBody('string error');
        expect(body.statusCode).toBe(500);
    });
    it('null 예외 → 500 반환', ()=>{
        const body = catchAndGetBody(null);
        expect(body.statusCode).toBe(500);
    });
    it('undefined 예외 → 500 반환', ()=>{
        const body = catchAndGetBody(undefined);
        expect(body.statusCode).toBe(500);
    });
    // --- 응답 형식 ---
    it('응답에 timestamp 포함', ()=>{
        const body = catchAndGetBody(new _common.BadRequestException('test'));
        expect(body.timestamp).toBeDefined();
        expect(typeof body.timestamp).toBe('string');
        // ISO 형식 확인
        expect(()=>new Date(body.timestamp)).not.toThrow();
    });
    it('비 production에서 path 포함', ()=>{
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';
        const body = catchAndGetBody(new _common.BadRequestException('test'));
        expect(body.path).toBe('/api/test');
        process.env.NODE_ENV = originalEnv;
    });
    it('production에서 path 미포함', ()=>{
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        const body = catchAndGetBody(new _common.BadRequestException('test'));
        expect(body.path).toBeUndefined();
        process.env.NODE_ENV = originalEnv;
    });
    it('응답에 statusCode, error, message, timestamp 필드 존재', ()=>{
        const body = catchAndGetBody(new _common.BadRequestException('test'));
        expect(body).toHaveProperty('statusCode');
        expect(body).toHaveProperty('error');
        expect(body).toHaveProperty('message');
        expect(body).toHaveProperty('timestamp');
    });
});
