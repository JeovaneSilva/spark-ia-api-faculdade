import { AnswerOption, Subject } from '../../generated/prisma/client';

/**
 * Token de injeção — permite trocar a implementação (fake hoje, Anthropic
 * amanhã) só mudando o provider registrado no ChatbotModule, sem tocar
 * no service nem no controller que a consomem.
 */
export const QUESTION_GENERATOR = Symbol('QUESTION_GENERATOR');

export interface GenerateQuestionsParams {
  /** Texto já extraído (artigo, trecho colado, ou apenas um tema curto) -- nunca uma URL crua. */
  content: string;
  quantity: number;
}

/** Formato de uma questão ainda não persistida — sem id, sem vínculo com sessão. */
export interface GeneratedQuestion {
  statement: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctOption: AnswerOption;
  explanation?: string;
  // Não vem mais do cliente -- o gerador classifica a partir do conteúdo enviado.
  subject: Subject;
}

export interface QuestionGenerator {
  generate(params: GenerateQuestionsParams): Promise<GeneratedQuestion[]>;
}
