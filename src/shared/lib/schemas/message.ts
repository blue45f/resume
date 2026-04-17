import { z } from 'zod';

export const messageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, '메시지를 입력해주세요')
    .max(500, '메시지는 최대 500자까지 입력 가능합니다'),
});

export type MessageFormValues = z.infer<typeof messageSchema>;
