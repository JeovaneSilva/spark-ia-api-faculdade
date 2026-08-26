import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { Subject } from '../../../generated/prisma/client';

// id_user nao vem do client -- e derivado do token autenticado no controller.
export class GenerateQuestionsDTO {
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
