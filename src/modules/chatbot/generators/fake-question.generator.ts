import { Injectable } from '@nestjs/common';
import { AnswerOption } from '../../../generated/prisma/client';
import {
  GeneratedQuestion,
  GenerateQuestionsParams,
  QuestionGenerator,
} from '../question-generator.interface';

/**
 * Implementação fake — não chama nenhuma API de IA, só devolve questões de
 * exemplo. Serve pra validar o pipeline inteiro (controller -> service ->
 * repository -> Prisma) sem gastar nada. Troque pela implementação real
 * (Anthropic) no provider do ChatbotModule quando estiver pronto pra testar
 * qualidade de geração de verdade.
 */
@Injectable()
export class FakeQuestionGenerator implements QuestionGenerator {
  async generate({ topic, quantity }: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
    return Array.from({ length: quantity }, (_, index) => ({
      statement: `[EXEMPLO] Questão ${index + 1} sobre "${topic}" — gerada pelo FakeQuestionGenerator.`,
      optionA: 'Alternativa A (exemplo)',
      optionB: 'Alternativa B (exemplo)',
      optionC: 'Alternativa C (exemplo)',
      optionD: 'Alternativa D (exemplo)',
      optionE: 'Alternativa E (exemplo)',
      correctOption: AnswerOption.A,
      explanation: 'Explicação de exemplo — a implementação real vai preencher isso com uma justificativa de verdade.',
    }));
  }
}
