import { z } from 'zod';
import {
  STUDY_GROUP_COMPANY_TIERS,
  STUDY_GROUP_CAFE_CATEGORIES,
  STUDY_GROUP_EXPERIENCE_LEVELS,
} from '@resume/shared';

export const studyGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '그룹 이름을 입력해주세요')
    .max(100, '그룹 이름은 최대 100자까지 입력 가능합니다'),
  description: z
    .string()
    .max(1000, '소개는 최대 1000자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
  companyTier: z.enum(STUDY_GROUP_COMPANY_TIERS),
  cafeCategory: z.enum(STUDY_GROUP_CAFE_CATEGORIES),
  experienceLevel: z.enum(STUDY_GROUP_EXPERIENCE_LEVELS),
  companyName: z.string().trim().max(100, '회사명은 최대 100자입니다').optional().or(z.literal('')),
  position: z.string().trim().max(100, '직무는 최대 100자입니다').optional().or(z.literal('')),
  isPrivate: z.boolean(),
  maxMembers: z.coerce
    .number('정원을 숫자로 입력해주세요')
    .int('정원은 정수로 입력해주세요')
    .min(2, '정원은 2명 이상이어야 합니다')
    .max(30, '정원은 최대 30명까지 가능합니다'),
});

export type StudyGroupFormInput = z.input<typeof studyGroupSchema>;
export type StudyGroupFormOutput = z.output<typeof studyGroupSchema>;
