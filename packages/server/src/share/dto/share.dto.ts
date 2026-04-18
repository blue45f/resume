import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateShareLinkDto {
  @ApiPropertyOptional({ description: '만료 시간 (시간 단위)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInHours?: number;

  @ApiPropertyOptional({ description: '비밀번호' })
  @IsOptional()
  @IsString()
  password?: string;
}

export class AccessShareDto {
  @ApiPropertyOptional({ description: '비밀번호' })
  @IsOptional()
  @IsString()
  password?: string;
}
