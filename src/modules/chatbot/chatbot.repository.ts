import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuestionType } from '../../generated/prisma/client';
import { GeneratedQuestion } from './question-generator.interface';

@Injectable()
export class ChatbotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(id_user: string, requestedTopic: string) {
    return this.prisma.chatbotSession.create({
      data: { id_user, requestedTopic },
    });
  }

  // subject vem em cada questao individualmente (classificado pelo gerador a
  // partir do conteudo) -- nao e mais um valor unico pro lote inteiro.
  async createQuestions(id_chatbot_session: string, topic: string, questions: GeneratedQuestion[]) {
    return this.prisma.question.createManyAndReturn({
      data: questions.map((question) => ({
        ...question,
        topic,
        type: QuestionType.CHATBOT_GENERATED,
        id_chatbot_session,
      })),
    });
  }
}
