import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const createCommentSchema = z
  .object({
    content: z.string().min(5).max(500),
    authorName: z.string().max(50).optional(),
    parentId: z.string().optional(),
  })
  .strict()
export class CreateCommentDto extends createZodDto(createCommentSchema) {}
