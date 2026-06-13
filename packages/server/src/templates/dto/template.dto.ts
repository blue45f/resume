import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const PRESETS = ['standard', 'developer', 'career-focused', 'academic', 'minimal'] as const;

export const createTemplateSchema = z
  .object({
    name: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    prompt: z.string().optional(),
    layout: z.string().optional(),
    isDefault: z.boolean().optional(),
  })
  .strict();
export class CreateTemplateDto extends createZodDto(createTemplateSchema) {}

export const updateTemplateSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    prompt: z.string().optional(),
    layout: z.string().optional(),
    visibility: z.string().optional(),
    isDefault: z.boolean().optional(),
  })
  .strict();
export class UpdateTemplateDto extends createZodDto(updateTemplateSchema) {}

export const localTransformSchema = z
  .object({
    preset: z.enum(PRESETS).optional(),
    templateId: z.string().optional(),
  })
  .strict();
export class LocalTransformDto extends createZodDto(localTransformSchema) {}
