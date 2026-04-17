import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/auth.guard';
import {
  JobInterviewQuestionsService,
  CreateJobInterviewQuestionDto,
  AiGenerateDto,
} from './job-interview-questions.service';

@ApiTags('job-interview-questions')
@Controller('job-interview-questions')
export class JobInterviewQuestionsController {
  constructor(private readonly service: JobInterviewQuestionsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '공고별 예상 면접 질문 목록' })
  list(
    @Query('company') company: string | undefined,
    @Query('position') position: string | undefined,
    @Query('jobPostId') jobPostId: string | undefined,
    @Query('curatedJobId') curatedJobId: string | undefined,
    @Query('limit') limit: string | undefined,
    @Req() req: any,
  ) {
    return this.service.list(
      {
        company,
        position,
        jobPostId,
        curatedJobId,
        limit: limit ? parseInt(limit, 10) : undefined,
      },
      req.user?.id ?? null,
    );
  }

  @Post()
  @ApiOperation({ summary: '예상 면접 질문 등록' })
  create(@Body() body: CreateJobInterviewQuestionDto, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.create(req.user.id, body);
  }

  @Post(':id/upvote')
  @ApiOperation({ summary: '예상 면접 질문 upvote 토글' })
  upvote(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.toggleUpvote(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '예상 면접 질문 삭제 (작성자 또는 관리자)' })
  remove(@Param('id') id: string, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.remove(id, req.user.id, req.user.role);
  }

  @Post('ai-generate')
  @ApiOperation({ summary: 'AI로 예상 면접 질문 생성' })
  aiGenerate(@Body() body: AiGenerateDto, @Req() req: any) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다');
    return this.service.aiGenerate(req.user.id, body);
  }
}
