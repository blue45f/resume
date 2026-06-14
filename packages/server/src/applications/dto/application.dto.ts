import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const APPLICATION_STATUSES = [
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
] as const
const VISIBILITY = ['private', 'public'] as const

export const createApplicationSchema = z
  .object({
    company: z.string().min(1).max(100),
    position: z.string().min(1).max(100),
    url: z.string().max(2000).optional(),
    status: z.enum(APPLICATION_STATUSES).optional(),
    appliedDate: z.string().optional(),
    notes: z.string().max(2000).optional(),
    salary: z.string().optional(),
    location: z.string().optional(),
    resumeId: z.string().optional(),
    visibility: z.enum(VISIBILITY).optional(),
  })
  .strict()
export class CreateApplicationDto extends createZodDto(createApplicationSchema) {}

export const updateApplicationSchema = z
  .object({
    company: z.string().max(100).optional(),
    position: z.string().max(100).optional(),
    url: z.string().optional(),
    status: z.enum(APPLICATION_STATUSES).optional(),
    notes: z.string().optional(),
    salary: z.string().optional(),
    location: z.string().optional(),
    visibility: z.enum(VISIBILITY).optional(),
  })
  .strict()
export class UpdateApplicationDto extends createZodDto(updateApplicationSchema) {}
