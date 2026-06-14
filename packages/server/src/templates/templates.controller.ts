import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Query,
  UnauthorizedException,
} from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'

import { Public } from '../auth/auth.guard'
import { ResumesService } from '../resumes/resumes.service'

import { CreateTemplateDto, UpdateTemplateDto, LocalTransformDto } from './dto/template.dto'
import { LocalTransformService } from './local-transform.service'
import { TemplatesService } from './templates.service'

import type { AuthenticatedRequest } from '../common/request.types'

@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly localTransformService: LocalTransformService,
    private readonly resumesService: ResumesService
  ) {}

  @Get()
  @ApiOperation({ summary: '템플릿 목록 조회 (공개/기본 + 본인 비공개)' })
  findAll(@Req() req: AuthenticatedRequest) {
    // viewer 별 응답(본인 비공개 포함)이라 공개 캐시 미적용 (클라가 5분 캐시). 비공개 템플릿 노출 방지.
    return this.templatesService.findAll(req.user?.id, req.user?.role)
  }

  @Get('public')
  @Public()
  @ApiOperation({ summary: '공개 템플릿 목록' })
  findPublicTemplates(@Query('category') category?: string) {
    return this.templatesService.findPublic(category)
  }

  @Get(':id')
  @ApiOperation({ summary: '템플릿 상세 조회' })
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.templatesService.findOne(id, req.user?.id, req.user?.role)
  }

  @Post()
  @ApiOperation({ summary: '템플릿 생성' })
  create(@Body() dto: CreateTemplateDto, @Req() req: AuthenticatedRequest) {
    if (!req.user?.id) throw new UnauthorizedException('로그인이 필요합니다')
    return this.templatesService.create(dto, req.user.id, req.user.role)
  }

  @Put(':id')
  @ApiOperation({ summary: '템플릿 수정' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.templatesService.update(id, dto, req.user?.id, req.user?.role)
  }

  @Delete(':id')
  @ApiOperation({ summary: '템플릿 삭제' })
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.templatesService.remove(id, req.user?.id, req.user?.role)
  }

  @Post('seed')
  @ApiOperation({ summary: '기본 템플릿 시드 데이터 생성' })
  seed() {
    return this.templatesService.seed()
  }

  @Post('local-transform/:resumeId')
  @ApiOperation({ summary: '로컬 변환 (LLM 불필요 - 프리셋/템플릿 기반 구조 변환)' })
  async localTransform(
    @Param('resumeId') resumeId: string,
    @Body() dto: LocalTransformDto,
    @Req() req: AuthenticatedRequest
  ) {
    const resume = await this.resumesService.findOne(resumeId, req.user?.id)

    if (dto.templateId) {
      const template = await this.templatesService.findOne(
        dto.templateId,
        req.user?.id,
        req.user?.role
      )
      const layout = JSON.parse(template.layout || '{}')
      const text = this.localTransformService.transform(resume, layout)
      return { text, method: 'template', templateName: template.name }
    }

    const text = this.localTransformService.transformByPreset(resume, dto.preset || 'standard')
    return { text, method: 'preset', preset: dto.preset || 'standard' }
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
    ]
  }
}
