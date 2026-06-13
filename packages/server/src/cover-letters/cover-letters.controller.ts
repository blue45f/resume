import { Controller, Get, Post, Put, Delete, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  CoverLettersService,
  type CreateCoverLetterInput,
  type UpdateCoverLetterInput,
} from './cover-letters.service';
import { requireRequestUserId } from '../common/request.types';
import type { AuthenticatedRequest } from '../common/request.types';

@ApiTags('cover-letters')
@Controller('cover-letters')
export class CoverLettersController {
  constructor(private readonly service: CoverLettersService) {}

  @Get()
  @ApiOperation({ summary: '내 자소서 목록' })
  findAll(@Req() req: AuthenticatedRequest) {
    if (!req.user?.id) return [];
    return this.service.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '자소서 상세' })
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.findOne(id, requireRequestUserId(req));
  }

  @Post()
  @ApiOperation({ summary: '자소서 저장' })
  create(@Body() body: CreateCoverLetterInput, @Req() req: AuthenticatedRequest) {
    if (!req.user?.id) return { error: '로그인 필요' };
    return this.service.create(req.user.id, body);
  }

  @Put(':id')
  @ApiOperation({ summary: '자소서 수정' })
  update(
    @Param('id') id: string,
    @Body() body: UpdateCoverLetterInput,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.update(id, requireRequestUserId(req), body);
  }

  @Delete(':id')
  @ApiOperation({ summary: '자소서 삭제' })
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.remove(id, requireRequestUserId(req));
  }

  @Get('resume/:resumeId')
  @ApiOperation({ summary: '이력서별 자소서 목록' })
  getByResume(@Param('resumeId') resumeId: string, @Req() req: AuthenticatedRequest) {
    if (!req.user?.id) return [];
    return this.service.getByResume(resumeId, req.user.id);
  }
}
