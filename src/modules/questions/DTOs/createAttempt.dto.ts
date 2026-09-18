import { IsEnum } from 'class-validator';
import { AnswerOption } from '../../../generated/prisma/client';

// id_user nao vem do client -- e derivado do token autenticado no controller.
export class CreateAttemptDTO {
  @IsEnum(AnswerOption)
  answer!: AnswerOption;
}
