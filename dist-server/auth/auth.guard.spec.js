"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_guard_1 = require("./auth.guard");
describe('AuthGuard', () => {
    let guard;
    let jwtService;
    let reflector;
    beforeEach(() => {
        jwtService = { verify: jest.fn() };
        reflector = { getAllAndOverride: jest.fn() };
        guard = new auth_guard_1.AuthGuard(jwtService, reflector);
    });
    function createContext(headers = {}) {
        const request = { headers, user: undefined };
        return {
            switchToHttp: () => ({ getRequest: () => request }),
            getHandler: () => ({}),
            getClass: () => ({}),
        };
    }
    it('@Public() 데코레이터 → 인증 스킵', () => {
        reflector.getAllAndOverride.mockReturnValue(true);
        const ctx = createContext();
        expect(guard.canActivate(ctx)).toBe(true);
    });
    it('토큰 없음 → user = null, 통과', () => {
        reflector.getAllAndOverride.mockReturnValue(false);
        const ctx = createContext();
        expect(guard.canActivate(ctx)).toBe(true);
        expect(ctx.switchToHttp().getRequest().user).toBeNull();
    });
    it('유효한 JWT → user.id + role 설정', () => {
        reflector.getAllAndOverride.mockReturnValue(false);
        jwtService.verify.mockReturnValue({ sub: 'user-123', role: 'admin' });
        const ctx = createContext({ authorization: 'Bearer valid-token' });
        expect(guard.canActivate(ctx)).toBe(true);
        expect(ctx.switchToHttp().getRequest().user).toEqual({ id: 'user-123', role: 'admin' });
    });
    it('잘못된 JWT → user = null, 통과 (soft auth)', () => {
        reflector.getAllAndOverride.mockReturnValue(false);
        jwtService.verify.mockImplementation(() => { throw new Error('invalid'); });
        const ctx = createContext({ authorization: 'Bearer bad-token' });
        expect(guard.canActivate(ctx)).toBe(true);
        expect(ctx.switchToHttp().getRequest().user).toBeNull();
    });
    it('Bearer가 아닌 인증 헤더 → 토큰 없음 처리', () => {
        reflector.getAllAndOverride.mockReturnValue(false);
        const ctx = createContext({ authorization: 'Basic abc123' });
        expect(guard.canActivate(ctx)).toBe(true);
        expect(ctx.switchToHttp().getRequest().user).toBeNull();
    });
});
