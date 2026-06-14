import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

const USER_TYPES = ['personal', 'recruiter', 'company'] as const
const PREFERRED_LOCALES = ['', 'ko', 'en', 'ja'] as const

export const registerSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8).max(100),
    name: z.string().min(1).max(50),
    userType: z.enum(USER_TYPES).optional(),
    companyName: z.string().max(100).optional(),
    companyTitle: z.string().max(100).optional(),
    marketingOptIn: z.boolean().optional(),
    llmOptIn: z.boolean().optional(),
  })
  .strict()
export class RegisterDto extends createZodDto(registerSchema) {}

export const loginSchema = z
  .object({
    email: z.email(),
    password: z.string().min(1),
  })
  .strict()
export class LoginDto extends createZodDto(loginSchema) {}

// GIS (Google Identity Services) ID-token 로그인 — 프론트가 받은 credential(JWT)을 전달.
export const googleIdTokenSchema = z
  .object({
    credential: z.string().min(1).max(8192),
  })
  .strict()
export class GoogleIdTokenDto extends createZodDto(googleIdTokenSchema) {}

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(8).max(100),
  })
  .strict()
export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}

export const updateProfileSchema = z
  .object({
    userType: z.enum(USER_TYPES).optional(),
    name: z.string().min(1).max(50).optional(),
    companyName: z.string().max(100).optional(),
    companyTitle: z.string().max(100).optional(),
    username: z.string().min(3).max(30).optional(),
    isOpenToWork: z.boolean().optional(),
    openToWorkRoles: z.array(z.string()).optional(),
    marketingOptIn: z.boolean().optional(),
    llmOptIn: z.boolean().optional(),
    preferredLocale: z.enum(PREFERRED_LOCALES).optional(),
  })
  .strict()
export class UpdateProfileDto extends createZodDto(updateProfileSchema) {}
