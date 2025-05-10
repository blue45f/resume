"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sanitize_middleware_1 = require("./sanitize.middleware");
const common_1 = require("@nestjs/common");
describe('SanitizeMiddleware', () => {
    let middleware;
    beforeEach(() => {
        middleware = new sanitize_middleware_1.SanitizeMiddleware();
    });
    const run = (body) => {
        const req = { body };
        const res = {};
        const next = jest.fn();
        middleware.use(req, res, next);
        return { req, next };
    };
    it('HTML 태그를 제거한다', () => {
        const { req, next } = run({ name: '<script>alert("xss")</script>Hello' });
        expect(req.body.name).toBe('alert("xss")Hello');
        expect(next).toHaveBeenCalled();
    });
    it('문자열 앞뒤 공백을 제거한다', () => {
        const { req } = run({ name: '  홍길동  ' });
        expect(req.body.name).toBe('홍길동');
    });
    it('중첩 객체도 재귀적으로 처리한다', () => {
        const { req } = run({
            personalInfo: { name: '<b>bold</b>', email: ' test@test.com ' },
        });
        expect(req.body.personalInfo.name).toBe('bold');
        expect(req.body.personalInfo.email).toBe('test@test.com');
    });
    it('배열 요소도 처리한다', () => {
        const { req } = run({
            skills: [{ category: '<em>FE</em>', items: ' React, Vue ' }],
        });
        expect(req.body.skills[0].category).toBe('FE');
        expect(req.body.skills[0].items).toBe('React, Vue');
    });
    it('$ 접두사 키는 BadRequestException을 던진다', () => {
        expect(() => run({ $where: '1==1' })).toThrow(common_1.BadRequestException);
    });
    it('중첩 객체의 $ 접두사 키도 감지한다', () => {
        expect(() => run({ data: { $gt: 0 } })).toThrow(common_1.BadRequestException);
    });
    it('숫자/불리언/null 값은 그대로 유지한다', () => {
        const { req } = run({ count: 42, active: true, value: null });
        expect(req.body.count).toBe(42);
        expect(req.body.active).toBe(true);
        expect(req.body.value).toBe(null);
    });
    it('body가 없으면 next를 호출한다', () => {
        const req = {};
        const res = {};
        const next = jest.fn();
        middleware.use(req, res, next);
        expect(next).toHaveBeenCalled();
    });
    it('HTML 허용 필드(summary, description, achievements)는 태그를 유지한다', () => {
        const { req } = run({
            summary: '<p>자기소개 <strong>강조</strong></p>',
            description: '<ul><li>항목1</li></ul>',
            achievements: '<b>성과</b>',
            name: '<b>이름</b>',
        });
        expect(req.body.summary).toBe('<p>자기소개 <strong>강조</strong></p>');
        expect(req.body.description).toBe('<ul><li>항목1</li></ul>');
        expect(req.body.achievements).toBe('<b>성과</b>');
        expect(req.body.name).toBe('이름');
    });
    it('중첩 객체의 HTML 허용 필드도 유지한다', () => {
        const { req } = run({
            personalInfo: { summary: '<p>소개</p>', name: '<b>이름</b>' },
            experiences: [{ description: '<p>업무</p>', company: '<b>회사</b>' }],
        });
        expect(req.body.personalInfo.summary).toBe('<p>소개</p>');
        expect(req.body.personalInfo.name).toBe('이름');
        expect(req.body.experiences[0].description).toBe('<p>업무</p>');
        expect(req.body.experiences[0].company).toBe('회사');
    });
});
