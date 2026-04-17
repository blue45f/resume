import { z } from 'zod';

export const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(5, '5자 이상 입력해주세요')
    .max(500, '최대 500자까지 입력 가능합니다'),
});

export type CommentFormValues = z.infer<typeof commentSchema>;

export const replySchema = commentSchema;
export type ReplyFormValues = CommentFormValues;

export const communityCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, '댓글을 입력해주세요')
    .max(1000, '댓글은 최대 1000자까지 입력 가능합니다'),
  authorName: z
    .string()
    .max(30, '닉네임은 최대 30자까지 입력 가능합니다')
    .optional()
    .or(z.literal('')),
});

export type CommunityCommentFormValues = z.infer<typeof communityCommentSchema>;
