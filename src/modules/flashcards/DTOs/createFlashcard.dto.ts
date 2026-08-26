import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Subject } from '../../../generated/prisma/client';

// id_user nao vem do client -- e derivado do token autenticado no controller.
export class CreateFlashcardDTO {
  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsString()
  @IsNotEmpty()
  answer!: string;

  @IsEnum(Subject)
  subject!: Subject;

  @IsOptional()
  @IsString()
  topic?: string;
}
