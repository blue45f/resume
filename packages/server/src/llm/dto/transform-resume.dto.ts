import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const TEMPLATE_TYPES = [
  'standard',
  'career-description',
  'cover-letter',
  'linkedin',
  'english',
  'developer',
  'designer',
  'custom',
] as const;

export type TemplateType = (typeof TEMPLATE_TYPES)[number];

export const transformResumeSchema = z
  .object({
    templateType: z.enum(TEMPLATE_TYPES),
    targetLanguage: z.enum(['ko', 'en']).optional(),
    jobDescription: z.string().max(3000, 'JD는 3000자 이내여야 합니다').optional(),
    customPrompt: z.string().max(2000, '커스텀 프롬프트는 2000자 이내여야 합니다').optional(),
    provider: z.string().optional(),
  })
  .strict();
export class TransformResumeDto extends createZodDto(transformResumeSchema) {}
