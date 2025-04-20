import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ description: '태그 이름' }) @IsString() @IsNotEmpty({ message: '태그 이름은 필수입니다' }) name!: string;
  @ApiPropertyOptional({ description: '태그 색상 (hex)' })
  @IsOptional()
  @IsString()
  color?: string;
}
