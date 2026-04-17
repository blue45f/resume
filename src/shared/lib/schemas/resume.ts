import { z } from 'zod';

export const personalInfoSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요').max(50),
  email: z.string().email('올바른 이메일 형식이 아닙니다').optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  summary: z.string().max(2000).optional().or(z.literal('')),
  website: z.string().url('올바른 URL이 아닙니다').optional().or(z.literal('')),
  github: z.string().url('올바른 URL이 아닙니다').optional().or(z.literal('')),
});

export const experienceSchema = z.object({
  company: z.string().min(1, '회사명을 입력하세요').max(100),
  position: z.string().min(1, '직책을 입력하세요').max(100),
  startDate: z.string().min(1, '시작일을 입력하세요'),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  description: z.string().max(2000).optional(),
});

export const skillSchema = z.object({
  category: z.string().min(1, '카테고리를 입력하세요').max(50),
  items: z.string().min(1, '기술을 하나 이상 입력하세요').max(500),
});

export const resumeSchema = z.object({
  title: z.string().min(1).max(100),
  personalInfo: personalInfoSchema,
  experiences: z.array(experienceSchema),
  skills: z.array(skillSchema),
});

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type SkillInput = z.infer<typeof skillSchema>;
export type ResumeInput = z.infer<typeof resumeSchema>;
