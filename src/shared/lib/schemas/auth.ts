import { z } from 'zod';

export const USER_TYPE_VALUES = ['personal', 'recruiter', 'company'] as const;
export type UserType = (typeof USER_TYPE_VALUES)[number];

const emailField = z
  .string()
  .min(1, '이메일을 입력해주세요')
  .email('올바른 이메일 형식을 입력해주세요');

const passwordField = z
  .string()
  .min(1, '비밀번호를 입력해주세요')
  .min(8, '비밀번호는 8자 이상이어야 합니다');

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: emailField,
    password: passwordField,
    name: z.string().min(1, '이름을 입력해주세요').max(50, '이름은 최대 50자까지 입력 가능합니다'),
    userType: z.enum(USER_TYPE_VALUES),
    companyName: z
      .string()
      .max(100, '회사명은 최대 100자까지 입력 가능합니다')
      .optional()
      .or(z.literal('')),
    // PIPA 동의 (필수 2개 + 선택 2개)
    agreeTerms: z.literal(true, '이용약관에 동의해주세요'),
    agreePrivacy: z.literal(true, '개인정보 수집·이용에 동의해주세요'),
    marketingOptIn: z.boolean().optional(),
    llmOptIn: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.userType !== 'company' || (data.companyName && data.companyName.trim().length > 0),
    { message: '기업 계정은 회사명을 입력해주세요', path: ['companyName'] },
  );

export type RegisterFormValues = z.infer<typeof registerSchema>;
