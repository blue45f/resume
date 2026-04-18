import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';

export const TEMPLATE_TYPES = [
  'standard',
  'career-description',
  'cover-letter',
  'linkedin',
  'english',
  'developer',
  'designer',
  'custom',
] as const;

export type TemplateType = (typeof TEMPLATE_TYPES)[number];

export class TransformResumeDto {
  @ApiProperty({
    description: '변환 유형',
    enum: TEMPLATE_TYPES,
    example: 'standard',
  })
  @IsString()
  @IsIn(TEMPLATE_TYPES)
  templateType!: TemplateType;

  @ApiPropertyOptional({ description: '타겟 언어 (ko/en)', default: 'ko' })
  @IsOptional()
  @IsString()
  @IsIn(['ko', 'en'])
  targetLanguage?: string;

  @ApiPropertyOptional({ description: 'Job Description (JD 맞춤 최적화용, 3000자 이내)' })
  @IsOptional()
  @IsString()
  @MaxLength(3000, { message: 'JD는 3000자 이내여야 합니다' })
  jobDescription?: string;

  @ApiPropertyOptional({ description: '커스텀 프롬프트 (custom 유형일 때, 2000자 이내)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: '커스텀 프롬프트는 2000자 이내여야 합니다' })
  customPrompt?: string;

  @ApiPropertyOptional({
    description: 'LLM 프로바이더 (anthropic/n8n/openai-compatible). 미지정시 기본 프로바이더 사용',
  })
  @IsOptional()
  @IsString()
  provider?: string;
}
