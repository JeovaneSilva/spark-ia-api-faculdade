import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Subject } from '../../../generated/prisma/client';

// id_user nao vem do client -- e derivado do token autenticado no controller.
// question/answer sao opcionais aqui porque um lado do card pode ser so
// imagem -- a regra "precisa ter texto OU imagem" e validada no service,
// que enxerga os dois campos juntos (o DTO nao consegue validar isso sozinho).
export class CreateFlashcardDTO {
  @IsOptional()
  @IsString()
  question?: string;

  // null explicito remove a imagem; ausente mantem a atual (em update).
  @IsOptional()
  @IsString()
  questionImage?: string | null;

  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @IsString()
  answerImage?: string | null;

  @IsEnum(Subject)
  subject!: Subject;

  @IsOptional()
  @IsString()
  topic?: string;
}
