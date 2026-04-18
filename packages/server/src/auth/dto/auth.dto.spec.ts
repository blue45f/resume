import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RegisterDto, LoginDto, ChangePasswordDto, UpdateProfileDto } from './auth.dto';

function createDto<T extends object>(cls: new () => T, data: Partial<T>): T {
  return plainToInstance(cls, data);
}

async function expectValid<T extends object>(cls: new () => T, data: Partial<T>) {
  const dto = createDto(cls, data);
  const errors = await validate(dto);
  expect(errors).toHaveLength(0);
}

async function expectInvalid<T extends object>(
  cls: new () => T,
  data: Partial<T>,
  property: string,
) {
  const dto = createDto(cls, data);
  const errors = await validate(dto);
  expect(errors.length).toBeGreaterThan(0);
  const props = errors.map((e) => e.property);
  expect(props).toContain(property);
}

// --- RegisterDto ---

describe('RegisterDto', () => {
  const validData = { email: 'test@example.com', password: 'password123', name: '홍길동' };

  it('유효한 데이터 → 통과', async () => {
    await expectValid(RegisterDto, validData);
  });

  it('유효한 데이터 + 선택 필드 → 통과', async () => {
    await expectValid(RegisterDto, {
      ...validData,
      userType: 'recruiter',
      companyName: '테스트 회사',
      companyTitle: 'CTO',
    });
  });

  it('이메일 형식이 아니면 실패', async () => {
    await expectInvalid(RegisterDto, { ...validData, email: 'not-email' }, 'email');
  });

  it('이메일 없으면 실패', async () => {
    await expectInvalid(RegisterDto, { password: 'password123', name: '홍길동' }, 'email');
  });

  it('비밀번호 8자 미만이면 실패', async () => {
    await expectInvalid(RegisterDto, { ...validData, password: 'short' }, 'password');
  });

  it('비밀번호 100자 초과이면 실패', async () => {
    await expectInvalid(RegisterDto, { ...validData, password: 'a'.repeat(101) }, 'password');
  });

  it('비밀번호 없으면 실패', async () => {
    await expectInvalid(RegisterDto, { email: 'test@example.com', name: '홍길동' }, 'password');
  });

  it('이름 빈 문자열이면 실패', async () => {
    await expectInvalid(RegisterDto, { ...validData, name: '' }, 'name');
  });

  it('이름 50자 초과이면 실패', async () => {
    await expectInvalid(RegisterDto, { ...validData, name: '가'.repeat(51) }, 'name');
  });

  it('이름 없으면 실패', async () => {
    await expectInvalid(
      RegisterDto,
      { email: 'test@example.com', password: 'password123' },
      'name',
    );
  });

  it('userType이 허용 값이 아니면 실패', async () => {
    await expectInvalid(RegisterDto, { ...validData, userType: 'hacker' }, 'userType');
  });

  it('userType "personal" → 통과', async () => {
    await expectValid(RegisterDto, { ...validData, userType: 'personal' });
  });

  it('userType "company" → 통과', async () => {
    await expectValid(RegisterDto, { ...validData, userType: 'company' });
  });

  // PIPA 동의 필드 테스트
  it('marketingOptIn true → 통과', async () => {
    await expectValid(RegisterDto, { ...validData, marketingOptIn: true });
  });

  it('marketingOptIn false → 통과', async () => {
    await expectValid(RegisterDto, { ...validData, marketingOptIn: false });
  });

  it('llmOptIn false (국외 이전 거부) → 통과', async () => {
    await expectValid(RegisterDto, { ...validData, llmOptIn: false });
  });

  it('llmOptIn true → 통과', async () => {
    await expectValid(RegisterDto, { ...validData, llmOptIn: true });
  });

  it('marketingOptIn이 boolean이 아니면 실패', async () => {
    await expectInvalid(
      RegisterDto,
      { ...validData, marketingOptIn: 'yes' as unknown as boolean },
      'marketingOptIn',
    );
  });

  it('llmOptIn이 boolean이 아니면 실패', async () => {
    await expectInvalid(
      RegisterDto,
      { ...validData, llmOptIn: 1 as unknown as boolean },
      'llmOptIn',
    );
  });
});

// --- LoginDto ---

describe('LoginDto', () => {
  const validData = { email: 'test@example.com', password: 'mypassword' };

  it('유효한 데이터 → 통과', async () => {
    await expectValid(LoginDto, validData);
  });

  it('이메일 형식이 아니면 실패', async () => {
    await expectInvalid(LoginDto, { ...validData, email: 'bad-email' }, 'email');
  });

  it('이메일 없으면 실패', async () => {
    await expectInvalid(LoginDto, { password: 'mypassword' }, 'email');
  });

  it('비밀번호 빈 문자열이면 실패', async () => {
    await expectInvalid(LoginDto, { ...validData, password: '' }, 'password');
  });

  it('비밀번호 없으면 실패', async () => {
    await expectInvalid(LoginDto, { email: 'test@example.com' }, 'password');
  });
});

// --- ChangePasswordDto ---

describe('ChangePasswordDto', () => {
  const validData = { currentPassword: 'old-password', newPassword: 'new-password123' };

  it('유효한 데이터 → 통과', async () => {
    await expectValid(ChangePasswordDto, validData);
  });

  it('currentPassword 빈 문자열이면 실패', async () => {
    await expectInvalid(
      ChangePasswordDto,
      { ...validData, currentPassword: '' },
      'currentPassword',
    );
  });

  it('currentPassword 없으면 실패', async () => {
    await expectInvalid(ChangePasswordDto, { newPassword: 'new-password123' }, 'currentPassword');
  });

  it('newPassword 8자 미만이면 실패', async () => {
    await expectInvalid(ChangePasswordDto, { ...validData, newPassword: 'short' }, 'newPassword');
  });

  it('newPassword 100자 초과이면 실패', async () => {
    await expectInvalid(
      ChangePasswordDto,
      { ...validData, newPassword: 'a'.repeat(101) },
      'newPassword',
    );
  });

  it('newPassword 없으면 실패', async () => {
    await expectInvalid(ChangePasswordDto, { currentPassword: 'old-password' }, 'newPassword');
  });

  it('currentPassword 200자 초과이면 실패', async () => {
    await expectInvalid(
      ChangePasswordDto,
      { ...validData, currentPassword: 'a'.repeat(201) },
      'currentPassword',
    );
  });
});

// --- UpdateProfileDto ---

describe('UpdateProfileDto', () => {
  it('빈 객체 → 통과 (모든 필드 optional)', async () => {
    await expectValid(UpdateProfileDto, {});
  });

  it('name만 있으면 통과', async () => {
    await expectValid(UpdateProfileDto, { name: '김철수' });
  });

  it('userType "personal" → 통과', async () => {
    await expectValid(UpdateProfileDto, { userType: 'personal' });
  });

  it('userType "recruiter" → 통과', async () => {
    await expectValid(UpdateProfileDto, { userType: 'recruiter' });
  });

  it('userType "company" → 통과', async () => {
    await expectValid(UpdateProfileDto, { userType: 'company' });
  });

  it('userType이 허용 값이 아니면 실패', async () => {
    await expectInvalid(UpdateProfileDto, { userType: 'admin' }, 'userType');
  });

  it('name 빈 문자열이면 실패', async () => {
    await expectInvalid(UpdateProfileDto, { name: '' }, 'name');
  });

  it('name 50자 초과이면 실패', async () => {
    await expectInvalid(UpdateProfileDto, { name: '가'.repeat(51) }, 'name');
  });

  it('companyName 100자 초과이면 실패', async () => {
    await expectInvalid(UpdateProfileDto, { companyName: 'a'.repeat(101) }, 'companyName');
  });

  it('companyTitle 100자 초과이면 실패', async () => {
    await expectInvalid(UpdateProfileDto, { companyTitle: 'a'.repeat(101) }, 'companyTitle');
  });

  it('모든 필드 유효한 값 → 통과', async () => {
    await expectValid(UpdateProfileDto, {
      userType: 'company',
      name: '김대표',
      companyName: '테스트 회사',
      companyTitle: 'CEO',
    });
  });
});
