import { createZodDto } from 'nestjs-zod'

import { createResumeSchema } from './create-resume.dto'

export const updateResumeSchema = createResumeSchema.partial()
export class UpdateResumeDto extends createZodDto(updateResumeSchema) {}
