import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

// 중첩 섹션 스키마. 미지정 키는 기본 동작(strip)으로 제거한다(과거 forbidNonWhitelisted 보다
// 관대 — 알 수 없는 중첩 키로 인한 저장 실패를 막기 위함. service 는 선언된 필드만 읽는다).
const personalInfoSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  github: z.string().optional(),
  summary: z.string().optional(),
  photo: z.string().optional(),
  birthYear: z.string().optional(),
  links: z.array(z.object({ label: z.string(), url: z.string() })).optional(),
  military: z.string().optional(),
})

const experienceSchema = z.object({
  id: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  description: z.string().optional(),
  achievements: z.string().optional(),
  techStack: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

const educationSchema = z.object({
  id: z.string().optional(),
  school: z.string().optional(),
  degree: z.string().optional(),
  field: z.string().optional(),
  gpa: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

const skillSchema = z.object({
  id: z.string().optional(),
  category: z.string().optional(),
  items: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  techStack: z.string().optional(),
  link: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

const certificationSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  issuer: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

const languageSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  testName: z.string().optional(),
  score: z.string().optional(),
  testDate: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

const awardSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  issuer: z.string().optional(),
  awardDate: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

const activitySchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  organization: z.string().optional(),
  role: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

const RESUME_VISIBILITY = ['public', 'private', 'link-only'] as const

// 최상위는 strict — 과거 ValidationPipe forbidNonWhitelisted=true 와 동일하게,
// 클라이언트가 보내는 Resume 객체 전체를 받기 위해 메타 필드까지 모두 화이트리스트로 선언한다.
export const createResumeSchema = z
  .object({
    title: z.string().optional(),
    personalInfo: personalInfoSchema.optional(),
    experiences: z.array(experienceSchema).optional(),
    educations: z.array(educationSchema).optional(),
    skills: z.array(skillSchema).optional(),
    projects: z.array(projectSchema).optional(),
    certifications: z.array(certificationSchema).optional(),
    languages: z.array(languageSchema).optional(),
    awards: z.array(awardSchema).optional(),
    activities: z.array(activitySchema).optional(),
    visibility: z.enum(RESUME_VISIBILITY).optional(),
    slug: z.string().optional(),
    isOpenToWork: z.boolean().optional(),
    openToWorkRoles: z.string().optional(),
    sectionOrder: z.array(z.string()).optional(),
    hiddenSections: z.array(z.string()).optional(),
    tags: z.array(z.unknown()).optional(),
    // 응답에 함께 와서 화이트리스트로 받기만 하고 service 에서 사용하지 않는 필드들.
    viewCount: z.unknown().optional(),
    userId: z.unknown().optional(),
    id: z.unknown().optional(),
    createdAt: z.unknown().optional(),
    updatedAt: z.unknown().optional(),
    reportCount: z.unknown().optional(),
    autoHidden: z.unknown().optional(),
  })
  .strict()
export class CreateResumeDto extends createZodDto(createResumeSchema) {}
