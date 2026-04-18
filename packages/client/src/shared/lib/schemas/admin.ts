import { z } from 'zod';

export const NOTICE_TYPE_VALUES = ['GENERAL', 'MAINTENANCE', 'EVENT', 'UPDATE', 'URGENT'] as const;
export type NoticeType = (typeof NOTICE_TYPE_VALUES)[number];

export const noticeFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, '제목을 입력해주세요')
    .max(200, '제목은 최대 200자까지 입력 가능합니다'),
  content: z
    .string()
    .trim()
    .min(1, '내용을 입력해주세요')
    .max(10000, '내용은 최대 10000자까지 입력 가능합니다'),
  type: z.enum(NOTICE_TYPE_VALUES),
  isPopup: z.boolean(),
  isPinned: z.boolean(),
  allowComments: z.boolean(),
  reason: z
    .string()
    .max(500, '수정 사유는 최대 500자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
});

export type NoticeFormValues = z.infer<typeof noticeFormSchema>;

export const FORBIDDEN_SEVERITY_VALUES = ['block', 'warn'] as const;
export type ForbiddenSeverity = (typeof FORBIDDEN_SEVERITY_VALUES)[number];

export const forbiddenWordSingleSchema = z.object({
  word: z
    .string()
    .trim()
    .min(1, '금칙어를 입력해주세요')
    .max(100, '금칙어는 최대 100자까지 입력 가능합니다'),
  category: z.string().trim().min(1, '카테고리를 선택해주세요').max(50),
  severity: z.enum(FORBIDDEN_SEVERITY_VALUES),
});

export type ForbiddenWordSingleValues = z.infer<typeof forbiddenWordSingleSchema>;

export const forbiddenWordBulkSchema = z.object({
  words: z
    .string()
    .trim()
    .min(1, '금칙어를 한 줄에 하나씩 입력해주세요')
    .max(5000, '일괄 입력은 최대 5000자까지 가능합니다'),
  category: z.string().trim().min(1, '카테고리를 선택해주세요').max(50),
  severity: z.enum(FORBIDDEN_SEVERITY_VALUES),
});

export type ForbiddenWordBulkValues = z.infer<typeof forbiddenWordBulkSchema>;

export const forbiddenWordEditSchema = z.object({
  word: z
    .string()
    .trim()
    .min(1, '금칙어를 입력해주세요')
    .max(100, '금칙어는 최대 100자까지 입력 가능합니다'),
  category: z.string().trim().min(1, '카테고리를 선택해주세요').max(50),
  severity: z.enum(FORBIDDEN_SEVERITY_VALUES),
});

export type ForbiddenWordEditValues = z.infer<typeof forbiddenWordEditSchema>;

export const BANNER_TYPE_VALUES = ['info', 'warning', 'success', 'promo'] as const;
export type BannerType = (typeof BANNER_TYPE_VALUES)[number];

export const systemBannerSchema = z.object({
  announcement: z
    .string()
    .max(1000, '배너 메시지는 최대 1000자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
  bannerType: z.enum(BANNER_TYPE_VALUES),
  bannerLink: z
    .string()
    .max(500, '링크 URL은 최대 500자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
  bannerLinkText: z
    .string()
    .max(100, '링크 텍스트는 최대 100자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
});

export type SystemBannerValues = z.infer<typeof systemBannerSchema>;
