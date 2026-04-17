"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _authguard = require("./auth.guard");
describe('AuthGuard', ()=>{
    let guard;
    let jwtService;
    let reflector;
    beforeEach(()=>{
        jwtService = {
            verify: jest.fn()
        };
        reflector = {
            getAllAndOverride: jest.fn()
        };
        guard = new _authguard.AuthGuard(jwtService, reflector);
    });
    function createContext(headers = {}, cookies = {}) {
        const request = {
            headers,
            cookies,
            user: undefined
        };
        return {
            switchToHttp: ()=>({
                    getRequest: ()=>request
                }),
            getHandler: ()=>({}),
            getClass: ()=>({})
        };
    }
    // --- Public 데코레이터 ---
    it('@Public() 데코레이터 → 인증 스킵', ()=>{
        reflector.getAllAndOverride.mockReturnValue(true);
        const ctx = createContext();
        expect(guard.canActivate(ctx)).toBe(true);
    });
    it('@Public() 데코레이터 → user 설정하지 않음', ()=>{
        reflector.getAllAndOverride.mockReturnValue(true);
        const ctx = createContext({
            authorization: 'Bearer some-token'
        });
        expect(guard.canActivate(ctx)).toBe(true);
        // Public 라우트에서는 토큰 검증 자체를 하지 않음
        expect(jwtService.verify).not.toHaveBeenCalled();
    });
    // --- 토큰 없음 ---
    it('토큰 없음 → user = null, 통과', ()=>{
        reflector.getAllAndOverride.mockReturnValue(false);
        const ctx = createContext();
        expect(guard.canActivate(ctx)).toBe(true);
        expect(ctx.switchToHttp().getRequest().user).toBeNull();
    });
    // --- 유효한 JWT ---
    it('유효한 JWT → user.id + role 설정', ()=>{
        reflector.getAllAndOverride.mockReturnValue(false);
        jwtService.verify.mockReturnValue({
            sub: 'user-123',
            role: 'admin'
        });
        const ctx = createContext({
            authorization: 'Bearer valid-token'
        });
        expect(guard.canActivate(ctx)).toBe(true);
        expect(ctx.switchToHttp().getRequest().user).toEqual({
            id: 'user-123',
            role: 'admin'
        });
    });
    it('role이 없는 JWT → 기본 role "user" 설정', ()=>{
        reflector.getAllAndOverride.mockReturnValue(false);
        jwtService.verify.mockReturnValue({
            sub: 'user-456'
        });
        const ctx = createContext({
            authorization: 'Bearer valid-token'
        });
        expect(guard.canActivate(ctx)).toBe(true);
        expect(ctx.switchToHttp().getRequest().user).toEqual({
            id: 'user-456',
            role: 'user'
        });
    });
    // --- 만료된/잘못된 JWT ---
    it('만료된 JWT → user = null, 통과 (soft auth)', ()=>{
        reflector.getAllAndOverride.mockReturnValue(false);
        jwtService.verify.mockImplementation(()=>{
            throw new Error('jwt expired');
        });
        const ctx = createContext({
            authorization: 'Bearer expired-token'
        });
        expect(guard.canActivate(ctx)).toBe(true);
        expect(ctx.switchToHttp().getRequest().user).toBeNull();
    });
    it('잘못된 JWT → user = null, 통과 (soft auth)', ()=>{
        reflector.getAllAndOverride.mockReturnValue(false);
        jwtService.verify.mockImplementation(()=>{
            throw new Error('invalid signature');
        });
        const ctx = createContext({
            authorization: 'Bearer bad-token'
        });
        expect(guard.canActivate(ctx)).toBe(true);
        expect(ctx.switchToHttp().getRequest().user).toBeNull();
    });
    it('malformed JWT (jwt malformed) → user = null', ()=>{
        reflector.getAllAndOverride.mockReturnValue(false);
        jwtService.verify.mockImplementation(()=>{
            throw new Error('jwt malformed');
        });
        const ctx = createContext({
            authorization: 'Bearer not.a.jwt'
        });
        expect(guard.canActivate(ctx)).toBe(true);
        expect(ctx.switchToHttp().getRequest().user).toBeNull();
    });
    // --- 잘못된 토큰 형식 ---
    it('Bearer가 아닌 인증 헤더 → 토큰 없음 처리', ()=>{
        reflector.getAllAndOverride.mockReturnValue(false);
        const ctx = createContext({
            authorization: 'Basic abc123'
        });
        expect(guard.canActivate(ctx)).toBe(true);
        expect(ctx.switchToHttp().getRequest().user).toBeNull();
    });
    it('Bearer만 있고 토큰이 없는 경우 → 토큰 없음 처리', ()=>{
        reflector.getAllAndOverride.mockReturnValue(false);
        const ctx = createContext({
            authorization: 'Bearer '
        });
        expect(guard.canActivate(ctx)).toBe(true);
        expect(ctx.switchToHttp().getRequest().user).toBeNull();
    });
    it('authorization 헤더가 빈 문자열 → 토큰 없음 처리', ()=>{
        reflector.getAllAndOverride.mockReturnValue(false);
        const ctx = createContext({
            authorization: ''
        });
        expect(guard.canActivate(ctx)).toBe(true);
        expect(ctx.switchToHttp().getRequest().user).toBeNull();
    });
    it('토큰에 공백이 여러 개 → split(/\\s+/)로 정상 파싱', ()=>{
        reflector.getAllAndOverride.mockReturnValue(false);
        jwtService.verify.mockReturnValue({
            sub: 'user-789',
            role: 'user'
        });
        const ctx = createContext({
            authorization: 'Bearer   valid-token'
        });
        // split(/\s+/)는 연속 공백을 하나로 처리하므로 정상 추출
        expect(guard.canActivate(ctx)).toBe(true);
        expect(ctx.switchToHttp().getRequest().user).toEqual({
            id: 'user-789',
            role: 'user'
        });
    });
    // --- Cookie 기반 인증 ---
    it('Cookie에서 토큰 추출', ()=>{
        reflector.getAllAndOverride.mockReturnValue(false);
        jwtService.verify.mockReturnValue({
            sub: 'cookie-user',
            role: 'user'
        });
        const ctx = createContext({}, {
            token: 'cookie-jwt-token'
        });
        expect(guard.canActivate(ctx)).toBe(true);
        expect(ctx.switchToHttp().getRequest().user).toEqual({
            id: 'cookie-user',
            role: 'user'
        });
    });
    it('Authorization 헤더가 우선, Cookie는 fallback', ()=>{
        reflector.getAllAndOverride.mockReturnValue(false);
        jwtService.verify.mockReturnValue({
            sub: 'header-user',
            role: 'admin'
        });
        const ctx = createContext({
            authorization: 'Bearer header-token'
        }, {
            token: 'cookie-token'
        });
        expect(guard.canActivate(ctx)).toBe(true);
        expect(jwtService.verify).toHaveBeenCalledWith('header-token');
        expect(ctx.switchToHttp().getRequest().user).toEqual({
            id: 'header-user',
            role: 'admin'
        });
    });
});
