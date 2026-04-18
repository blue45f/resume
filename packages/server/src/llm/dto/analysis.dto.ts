import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class FeedbackDto {
  @ApiPropertyOptional({ description: 'LLM 프로바이더' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  provider?: string;
}

export class JobMatchDto {
  @ApiProperty({ description: 'Job Description (5000자 이내)' })
  @IsString()
  @MaxLength(5000, { message: 'JD는 5000자 이내여야 합니다' })
  jobDescription!: string;

  @ApiPropertyOptional({ description: 'LLM 프로바이더' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  provider?: string;
}

export class InterviewDto {
  @ApiPropertyOptional({ description: '직무 (200자 이내)' })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '직무명은 200자 이내여야 합니다' })
  jobRole?: string;

  @ApiPropertyOptional({ description: '채용공고/JD (3000자 이내)' })
  @IsOptional()
  @IsString()
  @MaxLength(3000, { message: 'JD는 3000자 이내여야 합니다' })
  jobDescription?: string;

  @ApiPropertyOptional({ description: '난이도 (beginner/intermediate/advanced)' })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ description: 'LLM 프로바이더' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  provider?: string;
}

export class InlineAssistDto {
  @ApiProperty({ description: '개선할 텍스트 (2000자 이내)' })
  @IsString()
  @MaxLength(2000, { message: '텍스트는 2000자 이내여야 합니다' })
  text!: string;

  @ApiProperty({ description: '개선 유형' })
  @IsString()
  @MaxLength(50)
  type!: string;

  @ApiPropertyOptional({ description: 'LLM 프로바이더' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  provider?: string;
}
