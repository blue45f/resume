import { z } from 'zod';

export const INTERVIEW_CATEGORY_VALUES = [
  '전체',
  '기술',
  '인성',
  '경험',
  '상황',
  '문제해결',
] as const;
export type InterviewCategory = (typeof INTERVIEW_CATEGORY_VALUES)[number];

export const questionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, '질문을 입력해주세요')
    .max(1000, '질문은 최대 1000자까지 입력 가능합니다'),
  category: z.enum(INTERVIEW_CATEGORY_VALUES),
});

export type QuestionFormValues = z.infer<typeof questionSchema>;

export const answerSchema = z.object({
  answer: z
    .string()
    .trim()
    .min(1, '답변을 입력해주세요')
    .max(5000, '답변은 최대 5000자까지 입력 가능합니다'),
});

export type AnswerFormValues = z.infer<typeof answerSchema>;
