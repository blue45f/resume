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
    it('<img> 태그를 제거한다', () => {
        const { req } = run({ title: '<img src=x onerror=alert(1)>제목' });
        expect(req.body.title).toBe('제목');
    });
    it('<a> 태그를 제거한다', () => {
        const { req } = run({ company: '<a href="http://evil.com">링크</a>' });
        expect(req.body.company).toBe('링크');
    });
    it('<div>, <span> 등 일반 태그를 제거한다', () => {
        const { req } = run({ role: '<div><span>엔지니어</span></div>' });
        expect(req.body.role).toBe('엔지니어');
    });
    it('<iframe> 태그를 제거한다', () => {
        const { req } = run({ bio: '<iframe src="http://evil.com"></iframe>안녕' });
        expect(req.body.bio).toBe('안녕');
    });
    it('문자열 앞뒤 공백을 제거한다', () => {
        const { req } = run({ name: '  홍길동  ' });
        expect(req.body.name).toBe('홍길동');
    });
    it('HTML 허용 필드(summary, description, achievements, text)는 태그를 유지한다', () => {
        const { req } = run({
            summary: '<p>자기소개 <strong>강조</strong></p>',
            description: '<ul><li>항목1</li></ul>',
            achievements: '<b>성과</b>',
            text: '<em>텍스트</em>',
            name: '<b>이름</b>',
        });
        expect(req.body.summary).toBe('<p>자기소개 <strong>강조</strong></p>');
        expect(req.body.description).toBe('<ul><li>항목1</li></ul>');
        expect(req.body.achievements).toBe('<b>성과</b>');
        expect(req.body.text).toBe('<em>텍스트</em>');
        expect(req.body.name).toBe('이름');
    });
    it('HTML 허용 필드도 앞뒤 공백은 제거한다', () => {
        const { req } = run({ summary: '  <p>소개</p>  ' });
        expect(req.body.summary).toBe('<p>소개</p>');
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
    it('<script> 태그를 제거한다', () => {
        const { req } = run({ name: '<script>document.cookie</script>홍길동' });
        expect(req.body.name).toBe('document.cookie홍길동');
        expect(req.body.name).not.toContain('<script>');
    });
    it('이벤트 핸들러가 포함된 태그를 제거한다', () => {
        const { req } = run({ name: '<img src=x onerror="alert(1)">이름' });
        expect(req.body.name).not.toContain('onerror');
        expect(req.body.name).toBe('이름');
    });
    it('javascript: URI를 포함한 태그를 제거한다', () => {
        const { req } = run({ name: '<a href="javascript:alert(1)">클릭</a>' });
        expect(req.body.name).toBe('클릭');
        expect(req.body.name).not.toContain('javascript:');
    });
    it('중첩 스크립트 태그를 제거한다', () => {
        const { req } = run({ name: '<<script>script>alert(1)<</script>/script>' });
        expect(req.body.name).not.toContain('<script>');
    });
    it('data: URI를 포함한 태그를 제거한다', () => {
        const { req } = run({ name: '<object data="data:text/html,<script>alert(1)</script>">test</object>' });
        expect(req.body.name).not.toContain('<object');
    });
    it('중첩 객체도 재귀적으로 처리한다', () => {
        const { req } = run({
            personalInfo: { name: '<b>bold</b>', email: ' test@test.com ' },
        });
        expect(req.body.personalInfo.name).toBe('bold');
        expect(req.body.personalInfo.email).toBe('test@test.com');
    });
    it('깊은 중첩 객체도 처리한다', () => {
        const { req } = run({
            level1: {
                level2: {
                    level3: { name: '<script>xss</script>값' },
                },
            },
        });
        expect(req.body.level1.level2.level3.name).toBe('xss값');
    });
    it('배열 요소도 처리한다', () => {
        const { req } = run({
            skills: [{ category: '<em>FE</em>', items: ' React, Vue ' }],
        });
        expect(req.body.skills[0].category).toBe('FE');
        expect(req.body.skills[0].items).toBe('React, Vue');
    });
    it('문자열 배열도 처리한다', () => {
        const { req } = run({
            tags: ['<b>React</b>', ' Vue ', '<script>xss</script>'],
        });
        expect(req.body.tags[0]).toBe('React');
        expect(req.body.tags[1]).toBe('Vue');
        expect(req.body.tags[2]).toBe('xss');
    });
    it('빈 배열은 그대로 유지한다', () => {
        const { req } = run({ items: [] });
        expect(req.body.items).toEqual([]);
    });
    it('중첩 배열(배열 안의 배열)도 처리한다', () => {
        const { req } = run({
            matrix: [['<b>a</b>', '<i>b</i>'], ['<script>c</script>']],
        });
        expect(req.body.matrix[0][0]).toBe('a');
        expect(req.body.matrix[0][1]).toBe('b');
        expect(req.body.matrix[1][0]).toBe('c');
    });
    it('숫자/불리언/null 값은 그대로 유지한다', () => {
        const { req } = run({ count: 42, active: true, value: null });
        expect(req.body.count).toBe(42);
        expect(req.body.active).toBe(true);
        expect(req.body.value).toBe(null);
    });
    it('undefined 값은 그대로 유지한다', () => {
        const { req } = run({ value: undefined });
        expect(req.body.value).toBeUndefined();
    });
    it('빈 문자열은 그대로 유지한다', () => {
        const { req } = run({ name: '' });
        expect(req.body.name).toBe('');
    });
    it('빈 객체는 그대로 유지한다', () => {
        const { req } = run({ data: {} });
        expect(req.body.data).toEqual({});
    });
    it('body가 없으면 next를 호출한다', () => {
        const req = {};
        const res = {};
        const next = jest.fn();
        middleware.use(req, res, next);
        expect(next).toHaveBeenCalled();
    });
    it('body가 null이면 next를 호출한다', () => {
        const req = { body: null };
        const res = {};
        const next = jest.fn();
        middleware.use(req, res, next);
        expect(next).toHaveBeenCalled();
    });
    it('body가 문자열이면 sanitize하지 않고 next를 호출한다', () => {
        const req = { body: 'plain string' };
        const res = {};
        const next = jest.fn();
        middleware.use(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.body).toBe('plain string');
    });
    it('$ 접두사 키는 BadRequestException을 던진다', () => {
        expect(() => run({ $where: '1==1' })).toThrow(common_1.BadRequestException);
    });
    it('중첩 객체의 $ 접두사 키도 감지한다', () => {
        expect(() => run({ data: { $gt: 0 } })).toThrow(common_1.BadRequestException);
    });
    it('$ne 연산자도 감지한다', () => {
        expect(() => run({ password: { $ne: '' } })).toThrow(common_1.BadRequestException);
    });
    it('배열 내 객체의 $ 접두사 키도 감지한다', () => {
        expect(() => run({ items: [{ $set: { admin: true } }] })).toThrow(common_1.BadRequestException);
    });
});
