import { BadRequestException } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';
import type { ZodError } from 'zod';

/**
 * 전역 Zod 검증 파이프(표준).
 * createZodDto 로 정의한 DTO 만 검증하고, 그 외 메타타입은 그대로 통과시킨다.
 * BadRequestException(message: string[]) 형태를 유지해 GlobalExceptionFilter 가
 * 기존 class-validator 와 동일하게 메시지를 합쳐 응답하도록 한다.
 * nestjs-zod 의 ZodExceptionCreator 시그니처는 (error: unknown) => Error 이므로 ZodError 로 좁힌다.
 */
export const ZodValidationPipe = createZodValidationPipe({
  createValidationException: (error) =>
    new BadRequestException((error as ZodError).issues.map((issue) => issue.message)),
});
