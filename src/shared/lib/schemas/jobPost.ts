import { z } from 'zod';

export const JOB_TYPE_VALUES = ['fulltime', 'contract', 'parttime', 'intern'] as const;
export type JobType = (typeof JOB_TYPE_VALUES)[number];

export const SALARY_MIN = 2000;
export const SALARY_MAX = 15000;
export const SALARY_STEP = 500;

export const jobPostSchema = z
  .object({
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
    location: z
      .string()
      .max(100, '근무지는 최대 100자까지 입력 가능합니다')
      .optional()
      .default(''),
    salaryMin: z
      .number()
      .int()
      .min(SALARY_MIN, `최소 연봉은 ${SALARY_MIN}만원 이상이어야 합니다`)
      .max(SALARY_MAX, `최소 연봉은 ${SALARY_MAX}만원을 초과할 수 없습니다`),
    salaryMax: z
      .number()
      .int()
      .min(SALARY_MIN, `최대 연봉은 ${SALARY_MIN}만원 이상이어야 합니다`)
      .max(SALARY_MAX, `최대 연봉은 ${SALARY_MAX}만원을 초과할 수 없습니다`),
    salaryText: z
      .string()
      .max(50, '연봉 직접입력은 최대 50자까지 가능합니다')
      .optional()
      .default(''),
    description: z
      .string()
      .max(5000, '상세 설명은 최대 5000자까지 입력 가능합니다')
      .optional()
      .default(''),
    requirements: z
      .string()
      .max(3000, '자격 요건은 최대 3000자까지 입력 가능합니다')
      .optional()
      .default(''),
    benefits: z
      .string()
      .max(2000, '복리후생은 최대 2000자까지 입력 가능합니다')
      .optional()
      .default(''),
    type: z.enum(JOB_TYPE_VALUES),
    skills: z
      .string()
      .max(500, '기술 스택은 최대 500자까지 입력 가능합니다')
      .optional()
      .default(''),
  })
  .refine((data) => data.salaryMin <= data.salaryMax, {
    message: '최소 연봉은 최대 연봉보다 작거나 같아야 합니다',
    path: ['salaryMin'],
  });

export type JobPostFormValues = z.input<typeof jobPostSchema>;
export type JobPostFormOutput = z.output<typeof jobPostSchema>;
