import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResumesService } from './resumes.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';

@ApiTags('resumes')
@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Get()
  @ApiOperation({ summary: '이력서 목록 조회' })
  findAll() {
    return this.resumesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '이력서 상세 조회' })
  findOne(@Param('id') id: string) {
    return this.resumesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '이력서 생성' })
  create(@Body() dto: CreateResumeDto) {
    return this.resumesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '이력서 수정' })
  update(@Param('id') id: string, @Body() dto: UpdateResumeDto) {
    return this.resumesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '이력서 삭제' })
  remove(@Param('id') id: string) {
    return this.resumesService.remove(id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: '이력서 복제' })
  duplicate(@Param('id') id: string) {
    return this.resumesService.duplicate(id);
  }
}
