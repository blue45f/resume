import { z } from 'zod';

const looseUrl = z
  .string()
  .max(500, 'URL은 최대 500자까지 입력 가능합니다')
  .optional()
  .or(z.literal(''));

export const personalInfoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '이름을 입력하세요')
    .max(50, '이름은 최대 50자까지 입력 가능합니다'),
  email: z
    .string()
    .max(120, '이메일은 최대 120자까지 입력 가능합니다')
    .email('올바른 이메일 형식이 아닙니다')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .max(30, '전화번호는 최대 30자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(200, '주소는 최대 200자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
  summary: z
    .string()
    .max(2000, '자기소개는 최대 2000자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
  website: looseUrl,
  github: looseUrl,
  photo: z.string().optional().or(z.literal('')),
  birthYear: z
    .string()
    .max(10, '생년은 최대 10자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
  military: z
    .string()
    .max(100, '병역사항은 최대 100자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
  links: z
    .array(
      z.object({
        label: z.string().max(50),
        url: z.string().max(500),
      }),
    )
    .optional(),
});

export const experienceSchema = z.object({
  id: z.string(),
  company: z
    .string()
    .max(100, '회사명은 최대 100자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
  position: z
    .string()
    .max(100, '직책은 최대 100자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
  department: z
    .string()
    .max(100, '부서/팀은 최대 100자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  current: z.boolean().optional(),
  description: z
    .string()
    .max(3000, '업무 내용은 최대 3000자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
  achievements: z
    .string()
    .max(3000, '주요 성과는 최대 3000자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
  techStack: z
    .string()
    .max(500, '기술 스택은 최대 500자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
});

export const educationSchema = z.object({
  id: z.string(),
  school: z.string().max(100).optional().or(z.literal('')),
  degree: z.string().max(50).optional().or(z.literal('')),
  field: z.string().max(100).optional().or(z.literal('')),
  gpa: z.string().max(20).optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  description: z
    .string()
    .max(1000, '비고는 최대 1000자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
});

export const skillSchema = z.object({
  id: z.string(),
  category: z.string().max(50).optional().or(z.literal('')),
  items: z.string().max(1000).optional().or(z.literal('')),
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string().max(100).optional().or(z.literal('')),
  company: z.string().max(100).optional().or(z.literal('')),
  role: z.string().max(100).optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  description: z
    .string()
    .max(3000, '설명은 최대 3000자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
  techStack: z.string().max(500).optional().or(z.literal('')),
  link: z.string().max(500).optional().or(z.literal('')),
});

export const certificationSchema = z.object({
  id: z.string(),
  name: z.string().max(100).optional().or(z.literal('')),
  issuer: z.string().max(100).optional().or(z.literal('')),
  issueDate: z.string().optional().or(z.literal('')),
  expiryDate: z.string().optional().or(z.literal('')),
  credentialId: z.string().max(100).optional().or(z.literal('')),
  description: z.string().max(1000).optional().or(z.literal('')),
});

export const languageSchema = z.object({
  id: z.string(),
  name: z.string().max(50).optional().or(z.literal('')),
  testName: z.string().max(50).optional().or(z.literal('')),
  score: z.string().max(50).optional().or(z.literal('')),
  testDate: z.string().optional().or(z.literal('')),
});

export const awardSchema = z.object({
  id: z.string(),
  name: z.string().max(100).optional().or(z.literal('')),
  issuer: z.string().max(100).optional().or(z.literal('')),
  awardDate: z.string().optional().or(z.literal('')),
  description: z.string().max(1000).optional().or(z.literal('')),
});

export const activitySchema = z.object({
  id: z.string(),
  name: z.string().max(100).optional().or(z.literal('')),
  organization: z.string().max(100).optional().or(z.literal('')),
  role: z.string().max(100).optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  description: z.string().max(1000).optional().or(z.literal('')),
});

export const resumeFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, '이력서 제목을 입력해주세요')
    .max(100, '이력서 제목은 최대 100자까지 입력 가능합니다'),
  personalInfo: personalInfoSchema,
  experiences: z.array(experienceSchema),
  educations: z.array(educationSchema),
  skills: z.array(skillSchema),
  projects: z.array(projectSchema),
  certifications: z.array(certificationSchema),
  languages: z.array(languageSchema),
  awards: z.array(awardSchema),
  activities: z.array(activitySchema),
  sectionOrder: z
    .array(
      z.enum([
        'experience',
        'education',
        'skills',
        'projects',
        'certifications',
        'languages',
        'awards',
        'activities',
      ]),
    )
    .optional(),
  hiddenSections: z
    .array(
      z.enum([
        'experience',
        'education',
        'skills',
        'projects',
        'certifications',
        'languages',
        'awards',
        'activities',
      ]),
    )
    .optional(),
});

export type ResumeFormInput = z.input<typeof resumeFormSchema>;
export type ResumeFormOutput = z.output<typeof resumeFormSchema>;

// Legacy exports for backward compatibility
export const resumeSchema = resumeFormSchema;
export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type SkillInput = z.infer<typeof skillSchema>;
export type ResumeInput = ResumeFormInput;

// Minimal schema used for new-resume metadata validation
export const newResumeMetaSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력하세요').max(100, '제목은 100자 이내로 입력하세요'),
});

export type NewResumeMetaValues = z.infer<typeof newResumeMetaSchema>;
