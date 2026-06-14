import type { ZodType } from 'zod';
import { registerSchema, loginSchema, changePasswordSchema, updateProfileSchema } from './auth.dto';

function expectValid(schema: ZodType, data: unknown) {
  const result = schema.safeParse(data);
  expect(result.success).toBe(true);
}

function expectInvalid(schema: ZodType, data: unknown, property: string) {
  const result = schema.safeParse(data);
  expect(result.success).toBe(false);
  if (!result.success) {
    const props = result.error.issues.map((issue) => String(issue.path[0]));
    expect(props).toContain(property);
  }
}

// --- RegisterDto ---

describe('registerSchema', () => {
  const validData = { email: 'test@example.com', password: 'password123', name: '홍길동' };

  it('유효한 데이터 → 통과', () => {
    expectValid(registerSchema, validData);
  });

  it('유효한 데이터 + 선택 필드 → 통과', () => {
    expectValid(registerSchema, {
      ...validData,
      userType: 'recruiter',
      companyName: '테스트 회사',
      companyTitle: 'CTO',
    });
  });

  it('이메일 형식이 아니면 실패', () => {
    expectInvalid(registerSchema, { ...validData, email: 'not-email' }, 'email');
  });

  it('이메일 없으면 실패', () => {
    expectInvalid(registerSchema, { password: 'password123', name: '홍길동' }, 'email');
  });

  it('비밀번호 8자 미만이면 실패', () => {
    expectInvalid(registerSchema, { ...validData, password: 'short' }, 'password');
  });

  it('비밀번호 100자 초과이면 실패', () => {
    expectInvalid(registerSchema, { ...validData, password: 'a'.repeat(101) }, 'password');
  });

  it('비밀번호 없으면 실패', () => {
    expectInvalid(registerSchema, { email: 'test@example.com', name: '홍길동' }, 'password');
  });

  it('이름 빈 문자열이면 실패', () => {
    expectInvalid(registerSchema, { ...validData, name: '' }, 'name');
  });

  it('이름 50자 초과이면 실패', () => {
    expectInvalid(registerSchema, { ...validData, name: '가'.repeat(51) }, 'name');
  });

  it('이름 없으면 실패', () => {
    expectInvalid(registerSchema, { email: 'test@example.com', password: 'password123' }, 'name');
  });

  it('userType이 허용 값이 아니면 실패', () => {
    expectInvalid(registerSchema, { ...validData, userType: 'hacker' }, 'userType');
  });

  it('userType "personal" → 통과', () => {
    expectValid(registerSchema, { ...validData, userType: 'personal' });
  });

  it('userType "company" → 통과', () => {
    expectValid(registerSchema, { ...validData, userType: 'company' });
  });

  it('marketingOptIn true → 통과', () => {
    expectValid(registerSchema, { ...validData, marketingOptIn: true });
  });

  it('marketingOptIn false → 통과', () => {
    expectValid(registerSchema, { ...validData, marketingOptIn: false });
  });

  it('llmOptIn false (국외 이전 거부) → 통과', () => {
    expectValid(registerSchema, { ...validData, llmOptIn: false });
  });

  it('llmOptIn true → 통과', () => {
    expectValid(registerSchema, { ...validData, llmOptIn: true });
  });

  it('marketingOptIn이 boolean이 아니면 실패', () => {
    expectInvalid(registerSchema, { ...validData, marketingOptIn: 'yes' }, 'marketingOptIn');
  });

  it('llmOptIn이 boolean이 아니면 실패', () => {
    expectInvalid(registerSchema, { ...validData, llmOptIn: 1 }, 'llmOptIn');
  });
});

// --- LoginDto ---

describe('loginSchema', () => {
  const validData = { email: 'test@example.com', password: 'mypassword' };

  it('유효한 데이터 → 통과', () => {
    expectValid(loginSchema, validData);
  });

  it('이메일 형식이 아니면 실패', () => {
    expectInvalid(loginSchema, { ...validData, email: 'bad-email' }, 'email');
  });

  it('이메일 없으면 실패', () => {
    expectInvalid(loginSchema, { password: 'mypassword' }, 'email');
  });

  it('비밀번호 빈 문자열이면 실패', () => {
    expectInvalid(loginSchema, { ...validData, password: '' }, 'password');
  });

  it('비밀번호 없으면 실패', () => {
    expectInvalid(loginSchema, { email: 'test@example.com' }, 'password');
  });
});

// --- ChangePasswordDto ---

describe('changePasswordSchema', () => {
  const validData = { currentPassword: 'old-password', newPassword: 'new-password123' };

  it('유효한 데이터 → 통과', () => {
    expectValid(changePasswordSchema, validData);
  });

  it('currentPassword 빈 문자열이면 실패', () => {
    expectInvalid(changePasswordSchema, { ...validData, currentPassword: '' }, 'currentPassword');
  });

  it('currentPassword 없으면 실패', () => {
    expectInvalid(changePasswordSchema, { newPassword: 'new-password123' }, 'currentPassword');
  });

  it('newPassword 8자 미만이면 실패', () => {
    expectInvalid(changePasswordSchema, { ...validData, newPassword: 'short' }, 'newPassword');
  });

  it('newPassword 100자 초과이면 실패', () => {
    expectInvalid(
      changePasswordSchema,
      { ...validData, newPassword: 'a'.repeat(101) },
      'newPassword',
    );
  });

  it('newPassword 없으면 실패', () => {
    expectInvalid(changePasswordSchema, { currentPassword: 'old-password' }, 'newPassword');
  });

  it('currentPassword 200자 초과이면 실패', () => {
    expectInvalid(
      changePasswordSchema,
      { ...validData, currentPassword: 'a'.repeat(201) },
      'currentPassword',
    );
  });
});

// --- UpdateProfileDto ---

describe('updateProfileSchema', () => {
  it('빈 객체 → 통과 (모든 필드 optional)', () => {
    expectValid(updateProfileSchema, {});
  });

  it('name만 있으면 통과', () => {
    expectValid(updateProfileSchema, { name: '김철수' });
  });

  it('userType "personal" → 통과', () => {
    expectValid(updateProfileSchema, { userType: 'personal' });
  });

  it('userType "recruiter" → 통과', () => {
    expectValid(updateProfileSchema, { userType: 'recruiter' });
  });

  it('userType "company" → 통과', () => {
    expectValid(updateProfileSchema, { userType: 'company' });
  });

  it('userType이 허용 값이 아니면 실패', () => {
    expectInvalid(updateProfileSchema, { userType: 'admin' }, 'userType');
  });

  it('name 빈 문자열이면 실패', () => {
    expectInvalid(updateProfileSchema, { name: '' }, 'name');
  });

  it('name 50자 초과이면 실패', () => {
    expectInvalid(updateProfileSchema, { name: '가'.repeat(51) }, 'name');
  });

  it('companyName 100자 초과이면 실패', () => {
    expectInvalid(updateProfileSchema, { companyName: 'a'.repeat(101) }, 'companyName');
  });

  it('companyTitle 100자 초과이면 실패', () => {
    expectInvalid(updateProfileSchema, { companyTitle: 'a'.repeat(101) }, 'companyTitle');
  });

  it('모든 필드 유효한 값 → 통과', () => {
    expectValid(updateProfileSchema, {
      userType: 'company',
      name: '김대표',
      companyName: '테스트 회사',
      companyTitle: 'CEO',
    });
  });
});
