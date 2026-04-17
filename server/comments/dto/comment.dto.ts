import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  authorName?: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
