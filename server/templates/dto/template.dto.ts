import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() prompt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() layout?: string; // JSON layout config
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() prompt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() layout?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class LocalTransformDto {
  @ApiPropertyOptional({ description: '프리셋 이름 (standard, developer, career-focused, academic, minimal)' })
  @IsOptional()
  @IsString()
  @IsIn(['standard', 'developer', 'career-focused', 'academic', 'minimal'])
  preset?: string;

  @ApiPropertyOptional({ description: '템플릿 ID (layout 설정 사용)' })
  @IsOptional()
  @IsString()
  templateId?: string;
}
