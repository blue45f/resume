import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsIn } from 'class-validator';

export class RegisterDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @MinLength(8) @MaxLength(100) password!: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(50) name!: string;

  @ApiPropertyOptional() @IsOptional() @IsIn(['personal', 'recruiter', 'company']) userType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) companyName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) companyTitle?: string;
}

export class LoginDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @MinLength(1) password!: string;
}

export class ChangePasswordDto {
  @ApiProperty() @IsString() currentPassword!: string;
  @ApiProperty() @IsString() @MinLength(8) @MaxLength(100) newPassword!: string;
}
