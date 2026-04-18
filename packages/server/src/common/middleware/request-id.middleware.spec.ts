import { RequestIdMiddleware } from './request-id.middleware';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
  });

  it('기존 request ID가 없으면 새로 생성', () => {
    const req = { headers: {} } as any;
    const res = { setHeader: jest.fn() } as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.headers['x-request-id']).toBeDefined();
    expect(req.headers['x-request-id']).toHaveLength(36); // UUID format
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', expect.any(String));
    expect(next).toHaveBeenCalled();
  });

  it('기존 request ID가 있으면 유지', () => {
    const req = { headers: { 'x-request-id': 'existing-id' } } as any;
    const res = { setHeader: jest.fn() } as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.headers['x-request-id']).toBe('existing-id');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'existing-id');
  });
});
