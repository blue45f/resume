import { CacheHeaderInterceptor, CACHE_TTL_KEY } from './cache.interceptor';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';

describe('CacheHeaderInterceptor', () => {
  let interceptor: CacheHeaderInterceptor;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { get: jest.fn() } as any;
    interceptor = new CacheHeaderInterceptor(reflector);
  });

  function createContext(setHeaderFn = jest.fn()) {
    return {
      switchToHttp: () => ({
        getResponse: () => ({ setHeader: setHeaderFn }),
      }),
      getHandler: () => ({}),
    } as any;
  }

  function createHandler(data: any = { id: 1 }) {
    return { handle: () => of(data) } as any;
  }

  it('CacheTTL 데코레이터가 있으면 Cache-Control 헤더 설정', (done) => {
    (reflector.get as jest.Mock).mockReturnValue(300);
    const setHeader = jest.fn();
    const ctx = createContext(setHeader);

    interceptor.intercept(ctx, createHandler()).subscribe(() => {
      expect(setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'public, max-age=300, s-maxage=300',
      );
      done();
    });
  });

  it('CacheTTL이 없으면 Cache-Control 헤더 설정 안함', (done) => {
    (reflector.get as jest.Mock).mockReturnValue(undefined);
    const setHeader = jest.fn();
    const ctx = createContext(setHeader);

    interceptor.intercept(ctx, createHandler()).subscribe(() => {
      expect(setHeader).not.toHaveBeenCalled();
      done();
    });
  });

  it('CacheTTL이 0이면 Cache-Control 헤더 설정 안함', (done) => {
    (reflector.get as jest.Mock).mockReturnValue(0);
    const setHeader = jest.fn();
    const ctx = createContext(setHeader);

    interceptor.intercept(ctx, createHandler()).subscribe(() => {
      expect(setHeader).not.toHaveBeenCalled();
      done();
    });
  });

  it('커스텀 TTL 값(3600)이 적용된다', (done) => {
    (reflector.get as jest.Mock).mockReturnValue(3600);
    const setHeader = jest.fn();
    const ctx = createContext(setHeader);

    interceptor.intercept(ctx, createHandler()).subscribe(() => {
      expect(setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'public, max-age=3600, s-maxage=3600',
      );
      done();
    });
  });

  it('짧은 TTL(10초)이 적용된다', (done) => {
    (reflector.get as jest.Mock).mockReturnValue(10);
    const setHeader = jest.fn();
    const ctx = createContext(setHeader);

    interceptor.intercept(ctx, createHandler()).subscribe(() => {
      expect(setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'public, max-age=10, s-maxage=10',
      );
      done();
    });
  });

  it('reflector.get에 올바른 키와 핸들러를 전달한다', (done) => {
    const handler = () => ({});
    const ctx = {
      switchToHttp: () => ({
        getResponse: () => ({ setHeader: jest.fn() }),
      }),
      getHandler: () => handler,
    } as any;
    (reflector.get as jest.Mock).mockReturnValue(60);

    interceptor.intercept(ctx, createHandler()).subscribe(() => {
      expect(reflector.get).toHaveBeenCalledWith(CACHE_TTL_KEY, handler);
      done();
    });
  });

  it('응답 데이터를 변경하지 않고 그대로 전달한다', (done) => {
    (reflector.get as jest.Mock).mockReturnValue(300);
    const ctx = createContext();
    const data = { id: 1, name: 'test' };

    interceptor.intercept(ctx, createHandler(data)).subscribe((val) => {
      expect(val).toEqual(data);
      done();
    });
  });
});
