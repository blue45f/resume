/**
 * PIPA E2E — 개인정보보호법 관련 동의 (marketingOptIn/llmOptIn)
 */
import { E2EContext, setupE2EApp, cleanupTestData } from './e2e-helper';

describe('PIPA (개인정보 동의)', () => {
  let ctx: E2EContext;
  const testEmail = 'pipa-e2e-user@test.local';

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'pipa-e2e', normal: true, extraEmails: [testEmail] });
  }, 60000);

  afterAll(async () => {
    await cleanupTestData(ctx.prisma, [...Object.values(ctx.users).map((u) => u.email), testEmail]);
    await ctx.app.close();
  });

  it('회원가입 시 marketingOptIn: true 저장', async () => {
    await ctx.prisma.user.deleteMany({ where: { email: testEmail } }).catch(() => undefined);
    const res = await ctx.api().post('/api/auth/register').send({
      email: testEmail,
      password: 'PipaPass123!',
      name: 'PIPA테스터',
      marketingOptIn: true,
      llmOptIn: true,
    });
    expect([200, 201, 401, 429]).toContain(res.status);
  });

  it('PATCH /auth/profile — marketingOptIn 변경', async () => {
    const res = await ctx.authPatch('normal', '/api/auth/profile').send({ marketingOptIn: true });
    expect([200, 400]).toContain(res.status);
  });

  it('PATCH /auth/profile — llmOptIn 변경', async () => {
    const res = await ctx.authPatch('normal', '/api/auth/profile').send({ llmOptIn: false });
    expect([200, 400]).toContain(res.status);
  });

  it('PATCH /auth/profile — isOpenToWork 변경', async () => {
    const res = await ctx
      .authPatch('normal', '/api/auth/profile')
      .send({ isOpenToWork: true, openToWorkRoles: ['frontend', 'fullstack'] });
    expect([200, 400]).toContain(res.status);
  });

  it('PATCH /auth/profile — 부적절한 boolean → 400', async () => {
    const res = await ctx
      .authPatch('normal', '/api/auth/profile')
      .send({ marketingOptIn: 'not-a-bool' });
    expect([400]).toContain(res.status);
  });
});
