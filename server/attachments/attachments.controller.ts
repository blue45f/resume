import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { AttachmentsService } from './attachments.service';

@ApiTags('attachments')
@Controller()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('resumes/:resumeId/attachments')
  @ApiOperation({ summary: '파일 업로드' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('resumeId') resumeId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('category') category: string,
    @Body('description') description: string,
  ) {
    if (!file) throw new BadRequestException('파일이 없습니다');
    return this.attachmentsService.upload(resumeId, file, category, description);
  }

  @Get('resumes/:resumeId/attachments')
  @ApiOperation({ summary: '이력서 첨부파일 목록' })
  findAll(@Param('resumeId') resumeId: string) {
    return this.attachmentsService.findAll(resumeId);
  }

  @Get('attachments/:id/download')
  @ApiOperation({ summary: '파일 다운로드' })
  async download(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const result = await this.attachmentsService.getFileData(id, req.user?.id);

    // Cloudinary URL → 리다이렉트
    if ('redirectUrl' in result && result.redirectUrl) {
      res.redirect(result.redirectUrl);
      return;
    }

    const { data, originalName, mimeType } = result as any;
    if (!data) {
      res.status(404).json({ message: '파일을 찾을 수 없습니다' });
      return;
    }
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
    res.send(data);
  }

  @Delete('attachments/:id')
  @ApiOperation({ summary: '파일 삭제' })
  remove(@Param('id') id: string) {
    return this.attachmentsService.remove(id);
  }
}
