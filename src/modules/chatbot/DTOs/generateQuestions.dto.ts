import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { Subject } from '../../../generated/prisma/client';

export class GenerateQuestionsDTO {
  @IsString()
  @IsNotEmpty()
  id_user!: string;

  @IsString()
  @IsNotEmpty()
  topic!: string;

  @IsEnum(Subject)
  subject!: Subject;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  quantity?: number;
}
