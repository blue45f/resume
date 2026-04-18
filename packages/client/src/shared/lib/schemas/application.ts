import { z } from 'zod';

export const APPLICATION_STATUS_VALUES = [
  'applied',
  'document-passed',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn',
] as const;

export const APPLICATION_PRIORITY_VALUES = ['high', 'medium', 'low'] as const;
export const APPLICATION_VISIBILITY_VALUES = ['public', 'private'] as const;

export const applicationSchema = z.object({
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
  url: z.string().max(500, 'URL은 최대 500자까지 입력 가능합니다'),
  status: z.string(),
  notes: z.string().max(2000, '메모는 최대 2000자까지 입력 가능합니다'),
  salary: z.string().max(50, '연봉은 최대 50자까지 입력 가능합니다'),
  location: z.string().max(100, '근무지는 최대 100자까지 입력 가능합니다'),
  visibility: z.string(),
  resumeId: z.string(),
  priority: z.string(),
  interviewDate: z.string(),
  deadline: z.string(),
});

export type ApplicationFormValues = z.infer<typeof applicationSchema>;
