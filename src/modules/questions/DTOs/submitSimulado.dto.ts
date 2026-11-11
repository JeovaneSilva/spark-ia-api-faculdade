import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { AnswerOption } from '../../../generated/prisma/client';

export const MAX_SIMULADO_QUESTIONS = 180;

export class SimuladoAnswerDTO {
  @IsString()
  id_question!: string;

  @IsEnum(AnswerOption)
  answer!: AnswerOption;
}

// id_user vem do token. O gabarito só é revelado na resposta deste envio.
export class SubmitSimuladoDTO {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_SIMULADO_QUESTIONS)
  @ValidateNested({ each: true })
  @Type(() => SimuladoAnswerDTO)
  answers!: SimuladoAnswerDTO[];

  // tempo gasto no simulado (o cronômetro roda no cliente)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(24 * 60 * 60)
  durationSeconds?: number;

  // preenchido quando o simulado é uma prova oficial ("Simular ENEM")
  @IsOptional()
  @IsInt()
  @Min(1998)
  @Max(2100)
  examYear?: number;
}
