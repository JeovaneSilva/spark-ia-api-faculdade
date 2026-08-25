import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Subject } from '../../../generated/prisma/client';

export class CreateFlashcardDTO {
  @IsString()
  @IsNotEmpty()
  id_user!: string;

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
