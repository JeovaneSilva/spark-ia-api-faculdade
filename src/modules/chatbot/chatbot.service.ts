import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatbotRepository } from './chatbot.repository';
import { ContentExtractor } from './content-extractor';
import { GenerateQuestionsDTO } from './DTOs/generateQuestions.dto';
import { QUESTION_GENERATOR } from './question-generator.interface';
import type { QuestionGenerator } from './question-generator.interface';

const DEFAULT_QUANTITY = 5;
const TOPIC_PREVIEW_CHARS = 200;

@Injectable()
export class ChatbotService {
  constructor(
    private readonly repository: ChatbotRepository,
    private readonly contentExtractor: ContentExtractor,
    @Inject(QUESTION_GENERATOR) private readonly generator: QuestionGenerator,
  ) {}

  async generateQuestions(data: GenerateQuestionsDTO, id_user: string) {
    const quantity = data.quantity ?? DEFAULT_QUANTITY;
    const content = await this.contentExtractor.resolve(data.content);

    // requestedTopic guarda só um preview -- o texto extraído de uma URL
    // pode ter milhares de caracteres, não faz sentido logar tudo isso.
    const topicPreview =
      content.length > TOPIC_PREVIEW_CHARS
        ? `${content.slice(0, TOPIC_PREVIEW_CHARS)}...`
        : content;
    const session = await this.repository.createSession(
      id_user,
      topicPreview,
      data.content,
    );

    const drafts = await this.generator.generate({ content, quantity });

    const questions = await this.repository.createQuestions(
      session.id_chatbot_session,
      topicPreview,
      drafts,
    );

    return { session, questions };
  }

  async listSessions(id_user: string) {
    const sessions = await this.repository.findSessionsByUser(id_user);

    return sessions.map((session) => ({
      id_chatbot_session: session.id_chatbot_session,
      requestedTopic: session.requestedTopic,
      inputContent: session.inputContent,
      createdAt: session.createdAt,
      questions: session.questions.map((question) => ({
        id_question: question.id_question,
        statement: question.statement,
        statementImage: question.statementImage,
        optionA: question.optionA,
        optionB: question.optionB,
        optionC: question.optionC,
        optionD: question.optionD,
        optionE: question.optionE,
        correctOption: question.correctOption,
        explanation: question.explanation,
        subject: question.subject,
        myAttempt: question.attempts[0]
          ? {
              userAnswer: question.attempts[0].userAnswer,
              isCorrect: question.attempts[0].isCorrect,
            }
          : null,
      })),
    }));
  }

  // Devolve só o rascunho (pergunta curta + resposta + disciplina); quem salva
  // o flashcard é o endpoint de flashcards, como qualquer outro cartão.
  async createFlashcardDraft(id_user: string, id_question: string) {
    const question = await this.repository.findQuestionOfUser(
      id_question,
      id_user,
    );
    if (!question) {
      throw new NotFoundException('Questão não encontrada.');
    }
    if (!question.subject) {
      throw new BadRequestException(
        'Esta questão não tem disciplina definida.',
      );
    }

    const draft = await this.generator.summarizeAsFlashcard(question);
    return { ...draft, subject: question.subject };
  }

  // Tutor: explica o erro da última tentativa do aluno nessa questão.
  async explainMistake(id_user: string, id_question: string) {
    const question = await this.repository.findAccessibleQuestion(
      id_question,
      id_user,
    );
    if (!question) {
      throw new NotFoundException('Questão não encontrada.');
    }

    const attempt = await this.repository.findLatestAttempt(
      id_question,
      id_user,
    );
    if (!attempt) {
      throw new BadRequestException(
        'Responda a questão antes de pedir a explicação.',
      );
    }
    if (attempt.isCorrect) {
      throw new BadRequestException(
        'Você acertou essa questão — não há erro para explicar.',
      );
    }

    const explanation = await this.generator.explainMistake({
      question,
      userAnswer: attempt.userAnswer,
    });
    return { explanation };
  }

  async renameSession(
    id_user: string,
    id_chatbot_session: string,
    requestedTopic: string,
  ) {
    const trimmed = requestedTopic.trim();
    if (!trimmed) {
      throw new BadRequestException('O nome da conversa não pode ficar vazio.');
    }

    return this.repository.updateSessionTitle(
      id_chatbot_session,
      id_user,
      trimmed,
    );
  }

  async deleteSession(id_user: string, id_chatbot_session: string) {
    return this.repository.deleteSession(id_chatbot_session, id_user);
  }
}
