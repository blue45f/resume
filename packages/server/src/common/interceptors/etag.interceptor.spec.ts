import { ExecutionContext, CallHandler } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { ETagInterceptor } from './etag.interceptor';

function makeContext(method: string, headers: Record<string, string> = {}) {
  const setHeader = jest.fn();
  const status = jest.fn();
  const response: any = { setHeader, status, headersSent: false };
  const request: any = { method, headers };
  const ctx: ExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as any;
  return { ctx, response, request };
}

function makeHandler(value: unknown): CallHandler {
  return { handle: () => of(value) } as CallHandler;
}

describe('ETagInterceptor', () => {
  const interceptor = new ETagInterceptor();

  it('passes through non-GET without modification', async () => {
    const { ctx, response } = makeContext('POST');
    const result = await firstValueFrom(interceptor.intercept(ctx, makeHandler({ a: 1 })));
    expect(result).toEqual({ a: 1 });
    expect(response.setHeader).not.toHaveBeenCalled();
  });

  it('attaches ETag for normal GET response', async () => {
    const { ctx, response } = makeContext('GET');
    const result = await firstValueFrom(interceptor.intercept(ctx, makeHandler({ ok: true })));
    expect(result).toEqual({ ok: true });
    expect(response.setHeader).toHaveBeenCalledWith('ETag', expect.stringMatching(/^".+"$/));
  });

  it('returns 304 when If-None-Match matches', async () => {
    const { ctx: probeCtx, response: probeRes } = makeContext('GET');
    await firstValueFrom(interceptor.intercept(probeCtx, makeHandler({ ok: true })));
    const etag = probeRes.setHeader.mock.calls[0][1];

    const { ctx, response } = makeContext('GET', { 'if-none-match': etag });
    const result = await firstValueFrom(interceptor.intercept(ctx, makeHandler({ ok: true })));
    expect(result).toBeNull();
    expect(response.status).toHaveBeenCalledWith(304);
  });

  // Regression: production crashed with ERR_INVALID_ARG_TYPE when handler returned undefined
  // (e.g. /api/resumes/bookmarks/list with empty result). Hash.update(undefined) threw.
  it('does not crash when handler returns undefined', async () => {
    const { ctx, response } = makeContext('GET');
    const result = await firstValueFrom(interceptor.intercept(ctx, makeHandler(undefined)));
    expect(result).toBeUndefined();
    expect(response.setHeader).not.toHaveBeenCalled();
  });

  it('does not crash when handler returns null', async () => {
    const { ctx, response } = makeContext('GET');
    const result = await firstValueFrom(interceptor.intercept(ctx, makeHandler(null)));
    expect(result).toBeNull();
    expect(response.setHeader).not.toHaveBeenCalled();
  });

  it('skips ETag when headers already sent (avoids ERR_HTTP_HEADERS_SENT)', async () => {
    const { ctx, response } = makeContext('GET');
    response.headersSent = true;
    const result = await firstValueFrom(interceptor.intercept(ctx, makeHandler({ ok: true })));
    expect(result).toEqual({ ok: true });
    expect(response.setHeader).not.toHaveBeenCalled();
  });
});
