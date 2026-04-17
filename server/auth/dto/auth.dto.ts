import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsIn,
  IsBoolean,
  IsArray,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @MinLength(8) @MaxLength(100) password!: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(50) name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['personal', 'recruiter', 'company'])
  userType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) companyName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) companyTitle?: string;

  // PIPA 동의 필드
  @ApiPropertyOptional({ description: '마케팅 수신 동의 (선택)' })
  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
  @ApiPropertyOptional({ description: '국외 이전 동의 (LLM 사용 허용, 선택)' })
  @IsOptional()
  @IsBoolean()
  llmOptIn?: boolean;
}

export class LoginDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @MinLength(1) password!: string;
}

export class ChangePasswordDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(200) currentPassword!: string;
  @ApiProperty() @IsString() @MinLength(8) @MaxLength(100) newPassword!: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['personal', 'recruiter', 'company'])
  userType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) @MaxLength(50) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) companyName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) companyTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(3) @MaxLength(30) username?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isOpenToWork?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  openToWorkRoles?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() marketingOptIn?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() llmOptIn?: boolean;
}
