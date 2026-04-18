import { z } from 'zod';

export const templateFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '템플릿 이름을 입력해주세요')
    .max(100, '템플릿 이름은 최대 100자까지 입력 가능합니다'),
  description: z
    .string()
    .max(500, '설명은 최대 500자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
  category: z.string().trim().min(1, '카테고리를 선택해주세요').max(50),
  prompt: z
    .string()
    .max(5000, 'LLM 프롬프트는 최대 5000자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
  sections: z.array(z.string()).min(0),
  dateFormat: z.string().trim().min(1, '날짜 형식을 선택해주세요').max(30),
});

export type TemplateFormValues = z.infer<typeof templateFormSchema>;
