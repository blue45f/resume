import { z } from 'zod';

export const bookingSchema = z.object({
  scheduledAt: z
    .string()
    .min(1, '일정을 선택해주세요')
    .refine((v) => !Number.isNaN(new Date(v).getTime()), '유효한 일정을 선택해주세요')
    .refine((v) => new Date(v).getTime() > Date.now(), '미래 시각을 선택해주세요'),
  duration: z.coerce
    .number('세션 시간을 선택해주세요')
    .int()
    .min(15, '최소 15분 이상')
    .max(240, '최대 240분까지 가능합니다'),
  note: z.string().max(1000, '요청사항은 최대 1000자까지 입력 가능합니다').optional(),
});

export type BookingFormInput = z.input<typeof bookingSchema>;
export type BookingFormOutput = z.output<typeof bookingSchema>;

export const coachProfileSchema = z.object({
  specialty: z
    .string()
    .min(2, '전문 분야를 입력해주세요')
    .max(100, '전문 분야는 100자 이내로 입력해주세요'),
  bio: z.string().max(2000, '소개글은 2000자 이내로 입력해주세요').optional().or(z.literal('')),
  hourlyRate: z.coerce
    .number('시급을 숫자로 입력해주세요')
    .int('시급은 정수로 입력해주세요')
    .min(0, '시급은 0 이상이어야 합니다')
    .max(10000000, '시급이 너무 높습니다'),
  yearsExp: z.coerce
    .number('경력 연차를 숫자로 입력해주세요')
    .int('경력은 정수로 입력해주세요')
    .min(0, '경력은 0년 이상이어야 합니다')
    .max(80, '경력이 너무 높습니다'),
  languages: z.string().max(200, '언어는 200자 이내로 입력해주세요').optional().or(z.literal('')),
  availableHours: z
    .string()
    .max(500, '가능 시간은 500자 이내로 입력해주세요')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().optional(),
});

export type CoachProfileFormInput = z.input<typeof coachProfileSchema>;
export type CoachProfileFormOutput = z.output<typeof coachProfileSchema>;
