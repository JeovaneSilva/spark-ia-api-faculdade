import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

// id_user nao vem do client -- e derivado do token autenticado no controller.
// subject tambem nao vem mais do client -- cada questao gerada e classificada
// pelo proprio gerador a partir do conteudo enviado (ver GeneratedQuestion.subject).
export class GenerateQuestionsDTO {
  // Aceita um tema curto, um texto colado, ou uma URL -- resolvido pelo
  // ContentExtractor antes de chegar no gerador.
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  content!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  quantity?: number;
}
