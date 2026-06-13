import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createShareLinkSchema = z
  .object({
    expiresInHours: z.number().int().min(1).optional(),
    password: z.string().optional(),
  })
  .strict();
export class CreateShareLinkDto extends createZodDto(createShareLinkSchema) {}

export const accessShareSchema = z
  .object({
    password: z.string().optional(),
  })
  .strict();
export class AccessShareDto extends createZodDto(accessShareSchema) {}
