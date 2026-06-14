import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const createTagSchema = z
  .object({
    name: z.string().min(1, '태그 이름은 필수입니다'),
    color: z.string().optional(),
  })
  .strict()
export class CreateTagDto extends createZodDto(createTagSchema) {}
