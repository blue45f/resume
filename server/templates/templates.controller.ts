import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { LocalTransformService } from './local-transform.service';
import { ResumesService } from '../resumes/resumes.service';
import { CreateTemplateDto, UpdateTemplateDto, LocalTransformDto } from './dto/template.dto';

@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly localTransformService: LocalTransformService,
    private readonly resumesService: ResumesService,
  ) {}

  @Get()
  @ApiOperation({ summary: '템플릿 목록 조회' })
  findAll() {
    return this.templatesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '템플릿 상세 조회' })
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '템플릿 생성' })
  create(@Body() dto: CreateTemplateDto, @Req() req: any) {
    return this.templatesService.create(dto, req.user?.id);
  }

  @Put(':id')
  @ApiOperation({ summary: '템플릿 수정' })
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto, @Req() req: any) {
    return this.templatesService.update(id, dto, req.user?.id, req.user?.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: '템플릿 삭제' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.templatesService.remove(id, req.user?.id, req.user?.role);
  }

  @Post('seed')
  @ApiOperation({ summary: '기본 템플릿 시드 데이터 생성' })
  seed() {
    return this.templatesService.seed();
  }

  @Post('local-transform/:resumeId')
  @ApiOperation({ summary: '로컬 변환 (LLM 불필요 - 프리셋/템플릿 기반 구조 변환)' })
  async localTransform(
    @Param('resumeId') resumeId: string,
    @Body() dto: LocalTransformDto,
  ) {
    const resume = await this.resumesService.findOne(resumeId);

    if (dto.templateId) {
      const template = await this.templatesService.findOne(dto.templateId);
      const layout = JSON.parse(template.layout || '{}');
      const text = this.localTransformService.transform(resume, layout);
      return { text, method: 'template', templateName: template.name };
    }

    const text = this.localTransformService.transformByPreset(resume, dto.preset || 'standard');
    return { text, method: 'preset', preset: dto.preset || 'standard' };
  }

  @Get('presets/list')
  @ApiOperation({ summary: '로컬 변환 프리셋 목록' })
  getPresets() {
    return [
      { id: 'standard', name: '표준 이력서', description: '전체 섹션을 기본 순서로 표시' },
      { id: 'developer', name: '개발자 이력서', description: '기술 스택과 프로젝트를 우선 배치' },
      { id: 'career-focused', name: '경력 중심', description: '경력과 프로젝트를 강조' },
      { id: 'academic', name: '학술/연구용', description: '학력과 수상을 우선 배치' },
      { id: 'minimal', name: '미니멀', description: '핵심 정보만 간결하게' },
    ];
  }
}
