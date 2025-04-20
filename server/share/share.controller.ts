import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ShareService } from './share.service';
import { CreateShareLinkDto, AccessShareDto } from './dto/share.dto';

@ApiTags('share')
@Controller()
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post('resumes/:resumeId/share')
  @ApiOperation({ summary: '공유 링크 생성' })
  createLink(
    @Param('resumeId') resumeId: string,
    @Body() dto: CreateShareLinkDto,
  ) {
    return this.shareService.createLink(resumeId, dto);
  }

  @Get('resumes/:resumeId/share')
  @ApiOperation({ summary: '이력서의 공유 링크 목록' })
  getLinks(@Param('resumeId') resumeId: string) {
    return this.shareService.getLinksForResume(resumeId);
  }

  @Delete('share/:id')
  @ApiOperation({ summary: '공유 링크 삭제' })
  removeLink(@Param('id') id: string) {
    return this.shareService.removeLink(id);
  }

  @Get('shared/:token')
  @ApiOperation({ summary: '공유된 이력서 조회 (공개 접근)' })
  getShared(
    @Param('token') token: string,
    @Query('password') password?: string,
  ) {
    return this.shareService.getByToken(token, password);
  }
}
