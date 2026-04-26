import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PersonalInfoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() website?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() github?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() summary?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() photo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() birthYear?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() links?: { label: string; url: string }[];
  @ApiPropertyOptional() @IsOptional() @IsString() military?: string;
}

export class ExperienceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() company?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() position?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() department?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() current?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() achievements?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() techStack?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}

export class EducationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() school?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() degree?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() field?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gpa?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}

export class SkillDto {
  @ApiPropertyOptional() @IsOptional() @IsString() id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() items?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}

export class ProjectDto {
  @ApiPropertyOptional() @IsOptional() @IsString() id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() company?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() role?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() techStack?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() link?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}

export class CertificationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() issuer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() issueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() expiryDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() credentialId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}

export class LanguageDto {
  @ApiPropertyOptional() @IsOptional() @IsString() id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() testName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() score?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() testDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}

export class AwardDto {
  @ApiPropertyOptional() @IsOptional() @IsString() id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() issuer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() awardDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}

export class ActivityDto {
  @ApiPropertyOptional() @IsOptional() @IsString() id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() organization?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() role?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}

export class CreateResumeDto {
  @ApiProperty({ description: '이력서 제목' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ type: PersonalInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  personalInfo?: PersonalInfoDto;

  @ApiPropertyOptional({ type: [ExperienceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experiences?: ExperienceDto[];

  @ApiPropertyOptional({ type: [EducationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  educations?: EducationDto[];

  @ApiPropertyOptional({ type: [SkillDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillDto)
  skills?: SkillDto[];

  @ApiPropertyOptional({ type: [ProjectDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDto)
  projects?: ProjectDto[];

  @ApiPropertyOptional({ type: [CertificationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  certifications?: CertificationDto[];

  @ApiPropertyOptional({ type: [LanguageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LanguageDto)
  languages?: LanguageDto[];

  @ApiPropertyOptional({ type: [AwardDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AwardDto)
  awards?: AwardDto[];

  @ApiPropertyOptional({ type: [ActivityDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityDto)
  activities?: ActivityDto[];

  // ── 메타 필드 (클라이언트가 Resume 객체 전체를 보내므로 화이트리스트로 받아야 함) ──
  // ValidationPipe forbidNonWhitelisted=true 라 누락 시 400 발생.

  @ApiPropertyOptional({ description: '공개 설정', enum: ['public', 'private', 'link-only'] })
  @IsOptional()
  @IsString()
  @IsIn(['public', 'private', 'link-only'])
  visibility?: string;

  @ApiPropertyOptional({ description: '공개 URL slug' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: '구직 활성화 여부' })
  @IsOptional()
  @IsBoolean()
  isOpenToWork?: boolean;

  @ApiPropertyOptional({ description: '구직 희망 직무 (자유 텍스트)' })
  @IsOptional()
  @IsString()
  openToWorkRoles?: string;

  @ApiPropertyOptional({ description: '섹션 표시 순서', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sectionOrder?: string[];

  @ApiPropertyOptional({ description: '숨긴 섹션', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hiddenSections?: string[];

  @ApiPropertyOptional({ description: '태그 (id 만 사용, 응답 보존용)' })
  @IsOptional()
  @IsArray()
  tags?: unknown[];

  // 응답에 함께 오지만 update 시 무시되는 필드들 — 화이트리스트로 받기만 하고 service 에서 사용 X.
  @ApiPropertyOptional() @IsOptional() viewCount?: number;
  @ApiPropertyOptional() @IsOptional() userId?: string | null;
  @ApiPropertyOptional() @IsOptional() id?: string;
  @ApiPropertyOptional() @IsOptional() createdAt?: string;
  @ApiPropertyOptional() @IsOptional() updatedAt?: string;
  @ApiPropertyOptional() @IsOptional() reportCount?: number;
  @ApiPropertyOptional() @IsOptional() autoHidden?: boolean;
}
