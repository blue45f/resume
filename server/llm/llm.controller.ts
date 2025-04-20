import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Observable } from 'rxjs';
import { LlmService } from './llm.service';
import { TransformResumeDto } from './dto/transform-resume.dto';

@ApiTags('llm')
@Controller('resumes/:resumeId/transform')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post()
  @ApiOperation({ summary: 'LLM으로 이력서 양식 변환' })
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests/min (cost control)
  transform(
    @Param('resumeId') resumeId: string,
    @Body() dto: TransformResumeDto,
  ) {
    return this.llmService.transform(resumeId, dto);
  }

  @Post('stream')
  @ApiOperation({ summary: 'LLM 양식 변환 (스트리밍)' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Sse()
  transformStream(
    @Param('resumeId') resumeId: string,
    @Body() dto: TransformResumeDto,
  ): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      const timeout = setTimeout(() => {
        subscriber.next({
          data: JSON.stringify({ type: 'error', message: '스트리밍 타임아웃 (60초)' }),
        } as MessageEvent);
        subscriber.complete();
      }, 60000);

      (async () => {
        try {
          for await (const chunk of this.llmService.transformStream(resumeId, dto)) {
            subscriber.next({ data: JSON.stringify(chunk) } as MessageEvent);
          }
        } catch (error: any) {
          subscriber.next({
            data: JSON.stringify({ type: 'error', message: error.message }),
          } as MessageEvent);
        } finally {
          clearTimeout(timeout);
          subscriber.complete();
        }
      })();
    });
  }

  @Get('history')
  @ApiOperation({ summary: 'LLM 변환 이력 조회' })
  getHistory(@Param('resumeId') resumeId: string) {
    return this.llmService.getTransformationHistory(resumeId);
  }

  @Get('providers')
  @ApiOperation({ summary: '사용 가능한 LLM 프로바이더 목록' })
  getProviders() {
    return this.llmService.getAvailableProviders();
  }

  @Get('usage')
  @ApiOperation({ summary: 'LLM 사용량 통계' })
  getUsage() {
    return this.llmService.getUsageStats();
  }
}
