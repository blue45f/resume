import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

export const feedbackSchema = z
  .object({
    provider: z.string().max(50).optional(),
  })
  .strict();
export class FeedbackDto extends createZodDto(feedbackSchema) {}

export const jobMatchSchema = z
  .object({
    jobDescription: z.string().max(3000, 'JD는 3000자 이내여야 합니다'),
    provider: z.string().max(50).optional(),
  })
  .strict();
export class JobMatchDto extends createZodDto(jobMatchSchema) {}

export const interviewSchema = z
  .object({
    jobRole: z.string().max(200, '직무명은 200자 이내여야 합니다').optional(),
    jobDescription: z.string().max(3000, 'JD는 3000자 이내여야 합니다').optional(),
    difficulty: z
      .enum(DIFFICULTIES, { error: '난이도는 beginner/intermediate/advanced 중 하나여야 합니다' })
      .optional(),
    provider: z.string().max(50).optional(),
  })
  .strict();
export class InterviewDto extends createZodDto(interviewSchema) {}

export const inlineAssistSchema = z
  .object({
    text: z.string().max(2000, '텍스트는 2000자 이내여야 합니다'),
    type: z.string().max(50),
    provider: z.string().max(50).optional(),
  })
  .strict();
export class InlineAssistDto extends createZodDto(inlineAssistSchema) {}
