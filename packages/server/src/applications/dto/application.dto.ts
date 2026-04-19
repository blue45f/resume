import { IsString, IsOptional, IsIn, MaxLength, MinLength } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  company: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  position: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  url?: string;

  @IsOptional()
  @IsIn(['applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn'])
  status?: string;

  @IsOptional()
  @IsString()
  appliedDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  salary?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  resumeId?: string;

  @IsOptional()
  @IsIn(['private', 'public'])
  visibility?: string;
}

export class UpdateApplicationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsIn(['applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  salary?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsIn(['private', 'public'])
  visibility?: string;
}
