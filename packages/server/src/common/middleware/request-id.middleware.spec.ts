import { RequestIdMiddleware } from './request-id.middleware';
import type { NextFunction, Request, Response } from 'express';

type HeaderRequest = Request & {
  headers: Record<string, string | undefined>;
};

type HeaderResponse = Response & {
  setHeader: jest.Mock;
};

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
  });

  it('기존 request ID가 없으면 새로 생성', () => {
    const req = { headers: {} } as HeaderRequest;
    const res = { setHeader: jest.fn() } as unknown as HeaderResponse;
    const next: NextFunction = jest.fn();

    middleware.use(req, res, next);

    expect(req.headers['x-request-id']).toBeDefined();
    expect(req.headers['x-request-id']).toHaveLength(36); // UUID format
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', expect.any(String));
    expect(next).toHaveBeenCalled();
  });

  it('기존 request ID가 있으면 유지', () => {
    const req = { headers: { 'x-request-id': 'existing-id' } } as unknown as HeaderRequest;
    const res = { setHeader: jest.fn() } as unknown as HeaderResponse;
    const next: NextFunction = jest.fn();

    middleware.use(req, res, next);

    expect(req.headers['x-request-id']).toBe('existing-id');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'existing-id');
  });
});
