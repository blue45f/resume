import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/auth.guard';
import { ResumesService } from '../resumes/resumes.service';
import { ShareService } from './share.service';
import { CreateShareLinkDto, AccessShareDto } from './dto/share.dto';

@ApiTags('share')
@Controller()
export class ShareController {
  constructor(
    private readonly shareService: ShareService,
    private readonly resumesService: ResumesService,
  ) {}

  @Post('resumes/:resumeId/share')
  @ApiOperation({ summary: '공유 링크 생성' })
  async createLink(
    @Param('resumeId') resumeId: string,
    @Body() dto: CreateShareLinkDto,
    @Req() req: any,
  ) {
    // 소유권 검증: 이력서 소유자만 공유 링크 생성 가능
    await this.resumesService.findOne(resumeId, req.user?.id);
    return this.shareService.createLink(resumeId, dto);
  }

  @Get('resumes/:resumeId/share')
  @ApiOperation({ summary: '이력서의 공유 링크 목록' })
  async getLinks(@Param('resumeId') resumeId: string, @Req() req: any) {
    await this.resumesService.findOne(resumeId, req.user?.id);
    return this.shareService.getLinksForResume(resumeId);
  }

  @Delete('share/:id')
  @ApiOperation({ summary: '공유 링크 삭제' })
  removeLink(@Param('id') id: string) {
    return this.shareService.removeLink(id);
  }

  @Get('shared/:token')
  @Public()
  @ApiOperation({ summary: '공유된 이력서 조회 (공개 접근)' })
  getShared(
    @Param('token') token: string,
    @Query('password') password?: string,
  ) {
    return this.shareService.getByToken(token, password);
  }
}
