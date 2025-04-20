import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

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

  @ApiPropertyOptional({ description: 'Job Description (JD 맞춤 최적화용)' })
  @IsOptional()
  @IsString()
  jobDescription?: string;

  @ApiPropertyOptional({ description: '커스텀 프롬프트 (custom 유형일 때)' })
  @IsOptional()
  @IsString()
  customPrompt?: string;

  @ApiPropertyOptional({
    description: 'LLM 프로바이더 (anthropic/n8n/openai-compatible). 미지정시 기본 프로바이더 사용',
  })
  @IsOptional()
  @IsString()
  provider?: string;
}
