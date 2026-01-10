import { ResponseInterceptor } from './response.interceptor';
import { of } from 'rxjs';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  const createContext = (method: string) => ({
    switchToHttp: () => ({
      getRequest: () => ({ method }),
    }),
  });

  const createHandler = (data: any) => ({
    handle: () => of(data),
  });

  it('GET 요청은 래핑하지 않음', (done) => {
    interceptor.intercept(createContext('GET') as any, createHandler({ id: 1 }) as any)
      .subscribe(val => {
        expect(val).toEqual({ id: 1 });
        done();
      });
  });

  it('POST 응답은 { success, data }로 래핑', (done) => {
    interceptor.intercept(createContext('POST') as any, createHandler({ id: 1 }) as any)
      .subscribe(val => {
        expect(val).toEqual({ success: true, data: { id: 1 } });
        done();
      });
  });

  it('이미 success 필드가 있으면 래핑하지 않음', (done) => {
    interceptor.intercept(createContext('POST') as any, createHandler({ success: true }) as any)
      .subscribe(val => {
        expect(val).toEqual({ success: true });
        done();
      });
  });
});
