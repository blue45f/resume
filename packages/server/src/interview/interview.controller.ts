import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { InterviewService, CreateInterviewAnswerDto } from './interview.service';

@ApiTags('interview')
@Controller('interview')
export class InterviewController {
  constructor(private readonly service: InterviewService) {}

  @Get('answers')
  @ApiOperation({ summary: '내 면접 답변 목록' })
  findAll(@Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.findAll(req.user.id);
  }

  @Post('answers')
  @ApiOperation({ summary: '면접 답변 저장' })
  create(@Body() body: CreateInterviewAnswerDto, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.create(req.user.id, body);
  }

  @Delete('answers/:id')
  @ApiOperation({ summary: '면접 답변 삭제' })
  remove(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.remove(id, req.user.id);
  }

  @Post('answers/analyze')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'AI 기반 면접 답변 분석 — 강점/약점/개선/리라이트 (LLM 호출, 5 req/min)',
  })
  analyzeAnswer(
    @Body() body: { question: string; answer: string; jobRole?: string; save?: boolean },
    @Req() req: any,
  ) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.analyzeAnswer(req.user.id, body);
  }

  @Get('answers/history/scores')
  @ApiOperation({ summary: '시간별 면접 답변 점수 추세 (최근 90일)' })
  scoreHistory(@Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.scoreHistory(req.user.id);
  }
}
