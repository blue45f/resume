"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const auth_dto_1 = require("./auth.dto");
function createDto(cls, data) {
    return (0, class_transformer_1.plainToInstance)(cls, data);
}
async function expectValid(cls, data) {
    const dto = createDto(cls, data);
    const errors = await (0, class_validator_1.validate)(dto);
    expect(errors).toHaveLength(0);
}
async function expectInvalid(cls, data, property) {
    const dto = createDto(cls, data);
    const errors = await (0, class_validator_1.validate)(dto);
    expect(errors.length).toBeGreaterThan(0);
    const props = errors.map((e) => e.property);
    expect(props).toContain(property);
}
describe('RegisterDto', () => {
    const validData = { email: 'test@example.com', password: 'password123', name: '홍길동' };
    it('유효한 데이터 → 통과', async () => {
        await expectValid(auth_dto_1.RegisterDto, validData);
    });
    it('유효한 데이터 + 선택 필드 → 통과', async () => {
        await expectValid(auth_dto_1.RegisterDto, {
            ...validData,
            userType: 'recruiter',
            companyName: '테스트 회사',
            companyTitle: 'CTO',
        });
    });
    it('이메일 형식이 아니면 실패', async () => {
        await expectInvalid(auth_dto_1.RegisterDto, { ...validData, email: 'not-email' }, 'email');
    });
    it('이메일 없으면 실패', async () => {
        await expectInvalid(auth_dto_1.RegisterDto, { password: 'password123', name: '홍길동' }, 'email');
    });
    it('비밀번호 8자 미만이면 실패', async () => {
        await expectInvalid(auth_dto_1.RegisterDto, { ...validData, password: 'short' }, 'password');
    });
    it('비밀번호 100자 초과이면 실패', async () => {
        await expectInvalid(auth_dto_1.RegisterDto, { ...validData, password: 'a'.repeat(101) }, 'password');
    });
    it('비밀번호 없으면 실패', async () => {
        await expectInvalid(auth_dto_1.RegisterDto, { email: 'test@example.com', name: '홍길동' }, 'password');
    });
    it('이름 빈 문자열이면 실패', async () => {
        await expectInvalid(auth_dto_1.RegisterDto, { ...validData, name: '' }, 'name');
    });
    it('이름 50자 초과이면 실패', async () => {
        await expectInvalid(auth_dto_1.RegisterDto, { ...validData, name: '가'.repeat(51) }, 'name');
    });
    it('이름 없으면 실패', async () => {
        await expectInvalid(auth_dto_1.RegisterDto, { email: 'test@example.com', password: 'password123' }, 'name');
    });
    it('userType이 허용 값이 아니면 실패', async () => {
        await expectInvalid(auth_dto_1.RegisterDto, { ...validData, userType: 'hacker' }, 'userType');
    });
    it('userType "personal" → 통과', async () => {
        await expectValid(auth_dto_1.RegisterDto, { ...validData, userType: 'personal' });
    });
    it('userType "company" → 통과', async () => {
        await expectValid(auth_dto_1.RegisterDto, { ...validData, userType: 'company' });
    });
});
describe('LoginDto', () => {
    const validData = { email: 'test@example.com', password: 'mypassword' };
    it('유효한 데이터 → 통과', async () => {
        await expectValid(auth_dto_1.LoginDto, validData);
    });
    it('이메일 형식이 아니면 실패', async () => {
        await expectInvalid(auth_dto_1.LoginDto, { ...validData, email: 'bad-email' }, 'email');
    });
    it('이메일 없으면 실패', async () => {
        await expectInvalid(auth_dto_1.LoginDto, { password: 'mypassword' }, 'email');
    });
    it('비밀번호 빈 문자열이면 실패', async () => {
        await expectInvalid(auth_dto_1.LoginDto, { ...validData, password: '' }, 'password');
    });
    it('비밀번호 없으면 실패', async () => {
        await expectInvalid(auth_dto_1.LoginDto, { email: 'test@example.com' }, 'password');
    });
});
describe('ChangePasswordDto', () => {
    const validData = { currentPassword: 'old-password', newPassword: 'new-password123' };
    it('유효한 데이터 → 통과', async () => {
        await expectValid(auth_dto_1.ChangePasswordDto, validData);
    });
    it('currentPassword 빈 문자열이면 실패', async () => {
        await expectInvalid(auth_dto_1.ChangePasswordDto, { ...validData, currentPassword: '' }, 'currentPassword');
    });
    it('currentPassword 없으면 실패', async () => {
        await expectInvalid(auth_dto_1.ChangePasswordDto, { newPassword: 'new-password123' }, 'currentPassword');
    });
    it('newPassword 8자 미만이면 실패', async () => {
        await expectInvalid(auth_dto_1.ChangePasswordDto, { ...validData, newPassword: 'short' }, 'newPassword');
    });
    it('newPassword 100자 초과이면 실패', async () => {
        await expectInvalid(auth_dto_1.ChangePasswordDto, { ...validData, newPassword: 'a'.repeat(101) }, 'newPassword');
    });
    it('newPassword 없으면 실패', async () => {
        await expectInvalid(auth_dto_1.ChangePasswordDto, { currentPassword: 'old-password' }, 'newPassword');
    });
    it('currentPassword 200자 초과이면 실패', async () => {
        await expectInvalid(auth_dto_1.ChangePasswordDto, { ...validData, currentPassword: 'a'.repeat(201) }, 'currentPassword');
    });
});
describe('UpdateProfileDto', () => {
    it('빈 객체 → 통과 (모든 필드 optional)', async () => {
        await expectValid(auth_dto_1.UpdateProfileDto, {});
    });
    it('name만 있으면 통과', async () => {
        await expectValid(auth_dto_1.UpdateProfileDto, { name: '김철수' });
    });
    it('userType "personal" → 통과', async () => {
        await expectValid(auth_dto_1.UpdateProfileDto, { userType: 'personal' });
    });
    it('userType "recruiter" → 통과', async () => {
        await expectValid(auth_dto_1.UpdateProfileDto, { userType: 'recruiter' });
    });
    it('userType "company" → 통과', async () => {
        await expectValid(auth_dto_1.UpdateProfileDto, { userType: 'company' });
    });
    it('userType이 허용 값이 아니면 실패', async () => {
        await expectInvalid(auth_dto_1.UpdateProfileDto, { userType: 'admin' }, 'userType');
    });
    it('name 빈 문자열이면 실패', async () => {
        await expectInvalid(auth_dto_1.UpdateProfileDto, { name: '' }, 'name');
    });
    it('name 50자 초과이면 실패', async () => {
        await expectInvalid(auth_dto_1.UpdateProfileDto, { name: '가'.repeat(51) }, 'name');
    });
    it('companyName 100자 초과이면 실패', async () => {
        await expectInvalid(auth_dto_1.UpdateProfileDto, { companyName: 'a'.repeat(101) }, 'companyName');
    });
    it('companyTitle 100자 초과이면 실패', async () => {
        await expectInvalid(auth_dto_1.UpdateProfileDto, { companyTitle: 'a'.repeat(101) }, 'companyTitle');
    });
    it('모든 필드 유효한 값 → 통과', async () => {
        await expectValid(auth_dto_1.UpdateProfileDto, {
            userType: 'company',
            name: '김대표',
            companyName: '테스트 회사',
            companyTitle: 'CEO',
        });
    });
});
