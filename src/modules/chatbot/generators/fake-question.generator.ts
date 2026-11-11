import { Injectable } from '@nestjs/common';
import { AnswerOption, Subject } from '../../../generated/prisma/client';
import {
  ExplainMistakeParams,
  FlashcardDraft,
  GeneratedQuestion,
  GenerateQuestionsParams,
  QuestionGenerator,
  QuestionToSummarize,
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
  generate({
    content,
    quantity,
  }: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
    const preview =
      content.length > 60 ? `${content.slice(0, 60)}...` : content;
    const questions = Array.from({ length: quantity }, (_, index) => ({
      statement: `[EXEMPLO] Questão ${index + 1} sobre "${preview}" — gerada pelo FakeQuestionGenerator.`,
      optionA: 'Alternativa A (exemplo)',
      optionB: 'Alternativa B (exemplo)',
      optionC: 'Alternativa C (exemplo)',
      optionD: 'Alternativa D (exemplo)',
      optionE: 'Alternativa E (exemplo)',
      correctOption: AnswerOption.A,
      explanation:
        'Explicação de exemplo — a implementação real vai preencher isso com uma justificativa de verdade.',
      subject: Subject.PORTUGUES,
    }));
    return Promise.resolve(questions);
  }

  explainMistake({
    question,
    userAnswer,
  }: ExplainMistakeParams): Promise<string> {
    return Promise.resolve(
      `[EXEMPLO] Você marcou ${userAnswer}, mas o gabarito é ${question.correctOption}. ${question.explanation ?? ''}`.trim(),
    );
  }

  summarizeAsFlashcard({
    explanation,
  }: QuestionToSummarize): Promise<FlashcardDraft> {
    return Promise.resolve({
      question: '[EXEMPLO] Qual é o conceito central desta questão?',
      answer: explanation ?? 'Resposta de exemplo.',
    });
  }
}
