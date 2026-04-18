import { z } from 'zod';

export const salaryContributionSchema = z.object({
  company: z
    .string()
    .trim()
    .min(1, '회사명을 입력해주세요')
    .max(100, '회사명은 최대 100자까지 입력 가능합니다'),
  position: z
    .string()
    .trim()
    .min(1, '포지션을 입력해주세요')
    .max(100, '포지션은 최대 100자까지 입력 가능합니다'),
  salary: z.coerce
    .number('연봉을 숫자로 입력해주세요')
    .int('연봉은 정수(만원 단위)로 입력해주세요')
    .min(0, '연봉은 0 이상이어야 합니다')
    .max(100000, '연봉이 너무 높습니다'),
  experience: z.coerce
    .number('경력을 숫자로 입력해주세요')
    .int('경력은 정수로 입력해주세요')
    .min(0, '경력은 0년 이상이어야 합니다')
    .max(30, '경력은 최대 30년까지 입력 가능합니다'),
  anonymous: z.boolean(),
});

export type SalaryContributionInput = z.input<typeof salaryContributionSchema>;
export type SalaryContributionOutput = z.output<typeof salaryContributionSchema>;
