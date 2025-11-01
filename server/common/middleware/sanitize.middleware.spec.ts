import { SanitizeMiddleware } from './sanitize.middleware';
import { BadRequestException } from '@nestjs/common';

describe('SanitizeMiddleware', () => {
  let middleware: SanitizeMiddleware;

  beforeEach(() => {
    middleware = new SanitizeMiddleware();
  });

  const run = (body: unknown) => {
    const req = { body } as any;
    const res = {} as any;
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
    expect(() => run({ $where: '1==1' })).toThrow(BadRequestException);
  });

  it('중첩 객체의 $ 접두사 키도 감지한다', () => {
    expect(() => run({ data: { $gt: 0 } })).toThrow(BadRequestException);
  });

  it('숫자/불리언/null 값은 그대로 유지한다', () => {
    const { req } = run({ count: 42, active: true, value: null });
    expect(req.body.count).toBe(42);
    expect(req.body.active).toBe(true);
    expect(req.body.value).toBe(null);
  });

  it('body가 없으면 next를 호출한다', () => {
    const req = {} as any;
    const res = {} as any;
    const next = jest.fn();
    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
