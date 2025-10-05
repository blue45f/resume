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
      let isAlive = true;
      let generator: AsyncGenerator<any> | null = null;

      const cleanup = () => {
        isAlive = false;
        if (generator?.return) generator.return(undefined).catch(() => {});
      };

      const timeout = setTimeout(() => {
        if (isAlive) {
          subscriber.next({
            data: JSON.stringify({ type: 'error', message: '스트리밍 타임아웃 (60초)' }),
          } as MessageEvent);
          cleanup();
          subscriber.complete();
        }
      }, 60000);

      (async () => {
        try {
          generator = this.llmService.transformStream(resumeId, dto);
          for await (const chunk of generator) {
            if (!isAlive) break;
            subscriber.next({ data: JSON.stringify(chunk) } as MessageEvent);
          }
        } catch (error: any) {
          if (isAlive) {
            subscriber.next({
              data: JSON.stringify({ type: 'error', message: error.message }),
            } as MessageEvent);
          }
        } finally {
          clearTimeout(timeout);
          cleanup();
          subscriber.complete();
        }
      })();

      // 클라이언트 연결 해제 시 cleanup
      return () => {
        clearTimeout(timeout);
        cleanup();
      };
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

  // ===== AI 분석 기능 =====

  @Post('feedback')
  @ApiOperation({ summary: 'AI 이력서 피드백 (점수 + 강점 + 개선점)' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  analyzeFeedback(
    @Param('resumeId') resumeId: string,
    @Body('provider') provider?: string,
  ) {
    return this.llmService.analyzeFeedback(resumeId, provider);
  }

  @Post('job-match')
  @ApiOperation({ summary: 'AI JD 매칭 분석' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  analyzeJobMatch(
    @Param('resumeId') resumeId: string,
    @Body('jobDescription') jobDescription: string,
    @Body('provider') provider?: string,
  ) {
    return this.llmService.analyzeJobMatch(resumeId, jobDescription, provider);
  }

  @Post('interview')
  @ApiOperation({ summary: 'AI 면접 질문 생성' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  generateInterview(
    @Param('resumeId') resumeId: string,
    @Body('jobRole') jobRole?: string,
    @Body('provider') provider?: string,
  ) {
    return this.llmService.generateInterviewQuestions(resumeId, jobRole, provider);
  }
}
