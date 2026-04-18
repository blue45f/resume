/**
 * E2E Test Helper
 *
 * 공통 setup 제공:
 * - Nest app + ValidationPipe 설정
 * - 테스트 계정 3종 (admin/recruiter/normal) 등록 + 로그인
 * - DB 사전 정리 (테스트 간 격리)
 * - request 헬퍼 (auth{Get,Post,Put,Patch,Delete})
 */
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

export type TestRole = 'admin' | 'recruiter' | 'normal' | 'coach';

export interface TestUser {
  email: string;
  password: string;
  name: string;
  userType?: string;
}

export interface SetupOptions {
  /** 고유 prefix — 병렬 실행 시 이메일 충돌 방지 */
  prefix: string;
  /** admin 계정 생성 + role=admin 승격 */
  admin?: boolean;
  /** recruiter 계정 생성 */
  recruiter?: boolean;
  /** normal 계정 생성 (default: true) */
  normal?: boolean;
  /** coach 계정 생성 */
  coach?: boolean;
  /** 추가로 정리할 이메일 */
  extraEmails?: string[];
  /** 추가로 정리할 태그 이름 */
  tagNames?: string[];
}

export interface E2EContext {
  app: INestApplication;
  prisma: PrismaService;
  tokens: Record<string, string>;
  userIds: Record<string, string>;
  users: Record<string, TestUser>;
  // HTTP helpers
  api: () => ReturnType<typeof request>;
  authGet: (role: string, url: string) => request.Test;
  authPost: (role: string, url: string) => request.Test;
  authPut: (role: string, url: string) => request.Test;
  authPatch: (role: string, url: string) => request.Test;
  authDelete: (role: string, url: string) => request.Test;
}

/**
 * 이미 등록된 이메일 때문에 failure 발생할 때 기존 유저 정리
 */
export async function cleanupTestData(
  prisma: PrismaService,
  emails: string[],
  tagNames: string[] = [],
): Promise<void> {
  await prisma.user.deleteMany({ where: { email: { in: emails } } }).catch(() => undefined);
  if (tagNames.length > 0) {
    await prisma.tag.deleteMany({ where: { name: { in: tagNames } } }).catch(() => undefined);
  }
}

/**
 * rate-limit(Throttle)을 피하기 위해 스테거드 등록
 * login은 5/min 이므로 대부분 문제 없지만, register는 3/min 제한
 */
async function registerAndLogin(
  app: INestApplication,
  user: TestUser,
): Promise<{ token: string; userId: string }> {
  const raw = () => request(app.getHttpServer());
  const regRes = await raw().post('/api/auth/register').send(user);
  // 이미 등록된 경우도 있으므로 에러 허용
  let token = regRes.body?.token || '';
  if (!token) {
    const loginRes = await raw()
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    token = loginRes.body?.token || '';
  }
  // userId 획득
  const me = await raw().get('/api/auth/me').set('Authorization', `Bearer ${token}`);
  const userId = me.body?.id || '';
  return { token, userId };
}

export async function setupE2EApp(options: SetupOptions): Promise<E2EContext> {
  const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = mod.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );
  await app.init();
  const prisma = app.get(PrismaService);

  // 기본 값: normal만 생성
  const wantAdmin = options.admin ?? false;
  const wantRecruiter = options.recruiter ?? false;
  const wantNormal = options.normal ?? true;
  const wantCoach = options.coach ?? false;

  const users: Record<string, TestUser> = {};
  if (wantNormal) {
    users.normal = {
      email: `${options.prefix}-normal@test.local`,
      password: 'NormalPass123!',
      name: `${options.prefix}-일반`,
    };
  }
  if (wantRecruiter) {
    users.recruiter = {
      email: `${options.prefix}-recruiter@test.local`,
      password: 'RecruiterPass123!',
      name: `${options.prefix}-채용`,
      userType: 'recruiter',
    };
  }
  if (wantAdmin) {
    users.admin = {
      email: `${options.prefix}-admin@test.local`,
      password: 'AdminPass123!',
      name: `${options.prefix}-관리자`,
    };
  }
  if (wantCoach) {
    users.coach = {
      email: `${options.prefix}-coach@test.local`,
      password: 'CoachPass123!',
      name: `${options.prefix}-코치`,
      // coach userType은 등록 시 거부되므로 normal로 등록 후 DB에서 승격
    };
  }

  const allEmails = [...Object.values(users).map((u) => u.email), ...(options.extraEmails ?? [])];
  await cleanupTestData(prisma, allEmails, options.tagNames);

  const tokens: Record<string, string> = {};
  const userIds: Record<string, string> = {};

  // Throttle 제한(3 register/min)을 고려해 순차 등록
  for (const [role, user] of Object.entries(users)) {
    const { token, userId } = await registerAndLogin(app, user);
    tokens[role] = token;
    userIds[role] = userId;
  }

  // admin 역할 승격 (있을 경우) — DB 직접 업데이트 후 JWT 재발급
  // (JWT payload에 role이 박혀 있어 role 변경 후 재로그인해야 admin 권한 인식)
  if (wantAdmin && userIds.admin) {
    await prisma.user.update({
      where: { id: userIds.admin },
      data: { role: 'admin' },
    });
    // JwtService로 새 토큰 발급 (role=admin)
    const jwtService = app.get(require('@nestjs/jwt').JwtService);
    tokens.admin = jwtService.sign({ sub: userIds.admin, role: 'admin' });
  }
  if (wantCoach && userIds.coach) {
    await prisma.user.update({
      where: { id: userIds.coach },
      data: { userType: 'coach' },
    });
  }

  const api = () => request(app.getHttpServer());
  const auth = (role: string) => `Bearer ${tokens[role] || ''}`;
  const authGet = (role: string, url: string) => api().get(url).set('Authorization', auth(role));
  const authPost = (role: string, url: string) => api().post(url).set('Authorization', auth(role));
  const authPut = (role: string, url: string) => api().put(url).set('Authorization', auth(role));
  const authPatch = (role: string, url: string) =>
    api().patch(url).set('Authorization', auth(role));
  const authDelete = (role: string, url: string) =>
    api().delete(url).set('Authorization', auth(role));

  return {
    app,
    prisma,
    tokens,
    userIds,
    users,
    api,
    authGet,
    authPost,
    authPut,
    authPatch,
    authDelete,
  };
}

/**
 * 이력서 팩토리
 */
export async function createTestResume(
  ctx: E2EContext,
  role: string,
  overrides: Record<string, unknown> = {},
): Promise<{ id: string; [key: string]: unknown }> {
  const res = await ctx.authPost(role, '/api/resumes').send({
    title: 'Test Resume',
    personalInfo: { name: '테스터', email: 'tester@test.local' },
    ...overrides,
  });
  return res.body;
}
