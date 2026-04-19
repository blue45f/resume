import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  Sse,
  MessageEvent,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Observable } from 'rxjs';
import { LlmService } from './llm.service';
import { TransformResumeDto } from './dto/transform-resume.dto';
import { FeedbackDto, JobMatchDto, InterviewDto, InlineAssistDto } from './dto/analysis.dto';
import { EnhanceWithDocumentDto } from './dto/auto-generate.dto';
import { UsageService } from '../health/usage.service';
import { SystemConfigService } from '../system-config/system-config.service';

@ApiTags('llm')
@Controller('resumes/:resumeId/transform')
export class LlmController {
  constructor(
    private readonly llmService: LlmService,
    private readonly usageService: UsageService,
    private readonly config: SystemConfigService,
  ) {}

  private async assertAiEnabled(name: string) {
    if (!(await this.config.isFeatureEnabled(name))) {
      throw new ForbiddenException('AI 기능이 관리자에 의해 일시 중단되었습니다');
    }
  }

  @Post()
  @ApiOperation({ summary: 'LLM으로 이력서 양식 변환' })
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests/min (cost control)
  async transform(
    @Param('resumeId') resumeId: string,
    @Body() dto: TransformResumeDto,
    @Req() req: any,
  ) {
    await this.assertAiEnabled('ai.resume');
    if (req.user?.id) {
      await this.usageService.checkAndLog(req.user.id, 'ai_transform');
    }
    return this.llmService.transform(resumeId, dto, req.user?.id);
  }

  @Post('stream')
  @ApiOperation({ summary: 'LLM 양식 변환 (스트리밍)' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Sse()
  transformStream(
    @Param('resumeId') resumeId: string,
    @Body() dto: TransformResumeDto,
    @Req() req: any,
  ): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      let isAlive = true;
      let generator: AsyncGenerator<any> | null = null;

      const cleanup = () => {
        isAlive = false;
        if (generator?.return) generator.return(undefined).catch(() => {});
      };

      const timeoutMs = Number(process.env.LLM_STREAM_TIMEOUT_MS) || 60000;
      const timeout = setTimeout(() => {
        if (isAlive) {
          subscriber.next({
            data: JSON.stringify({
              type: 'error',
              message: `스트리밍 타임아웃 (${Math.round(timeoutMs / 1000)}초)`,
            }),
          } as MessageEvent);
          cleanup();
          subscriber.complete();
        }
      }, timeoutMs);

      (async () => {
        try {
          if (req.user?.id) {
            await this.usageService.checkAndLog(req.user.id, 'ai_transform_stream');
          }
          generator = this.llmService.transformStream(resumeId, dto);
          for await (const chunk of generator) {
            if (!isAlive) break;
            subscriber.next({ data: JSON.stringify(chunk) } as MessageEvent);
          }
        } catch (error: any) {
          if (isAlive) {
            const safeMsg = this.sanitizeError(error);
            subscriber.next({
              data: JSON.stringify({ type: 'error', message: safeMsg }),
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

  /** 스택/민감정보 누출 방지 — 알려진 메시지만 통과 */
  private sanitizeError(err: any): string {
    const raw = typeof err?.message === 'string' ? err.message : '';
    if (!raw) return 'AI 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    // 플랜 한도·검증·타임아웃 등 서비스가 던진 사용자 친화적 메시지는 통과
    if (/한도|이내|유효|타임아웃|지원|사용/.test(raw) && raw.length < 200) return raw;
    return 'AI 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
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
  async analyzeFeedback(
    @Param('resumeId') resumeId: string,
    @Body() dto: FeedbackDto,
    @Req() req: any,
  ) {
    if (req.user?.id) {
      await this.usageService.checkAndLog(req.user.id, 'ai_feedback');
    }
    return this.llmService.analyzeFeedback(resumeId, dto.provider);
  }

  @Post('job-match')
  @ApiOperation({ summary: 'AI JD 매칭 분석' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async analyzeJobMatch(
    @Param('resumeId') resumeId: string,
    @Body() dto: JobMatchDto,
    @Req() req: any,
  ) {
    if (req.user?.id) {
      await this.usageService.checkAndLog(req.user.id, 'ai_job_match');
    }
    return this.llmService.analyzeJobMatch(resumeId, dto.jobDescription, dto.provider);
  }

  @Post('interview')
  @ApiOperation({ summary: 'AI 면접 질문 생성' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async generateInterview(
    @Param('resumeId') resumeId: string,
    @Body() dto: InterviewDto,
    @Req() req: any,
  ) {
    if (req.user?.id) {
      await this.usageService.checkAndLog(req.user.id, 'ai_interview');
    }
    return this.llmService.generateInterviewQuestions(
      resumeId,
      dto.jobRole,
      dto.provider,
      dto.jobDescription,
      dto.difficulty,
    );
  }

  @Post('inline-assist')
  @ApiOperation({ summary: 'AI 인라인 문장 개선' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async inlineAssist(@Body() dto: InlineAssistDto, @Req() req: any) {
    if (req.user?.id) {
      await this.usageService.checkAndLog(req.user.id, 'ai_inline_assist');
    }
    return this.llmService.inlineAssist(dto.text, dto.type, dto.provider);
  }

  @Post('ai-spell-check')
  @ApiOperation({ summary: 'AI 맞춤법·문체 교정 (정규식 체커보다 정교)' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async aiSpellCheck(
    @Param('resumeId') resumeId: string,
    @Body() dto: FeedbackDto,
    @Req() req: any,
  ) {
    if (req.user?.id) {
      await this.usageService.checkAndLog(req.user.id, 'ai_spell_check');
    }
    return this.llmService.aiSpellCheck(resumeId, dto.provider);
  }

  @Post('enhance-with-document')
  @ApiOperation({ summary: 'AI 외부 문서 병합 — 기존 이력서 고도화' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async enhanceWithDocument(
    @Param('resumeId') resumeId: string,
    @Body() dto: EnhanceWithDocumentDto,
    @Req() req: any,
  ) {
    if (req.user?.id) {
      await this.usageService.checkAndLog(req.user.id, 'ai_enhance_document');
    }
    return this.llmService.enhanceWithDocument(
      resumeId,
      dto.documentText,
      dto.instruction,
      dto.provider,
    );
  }
}
