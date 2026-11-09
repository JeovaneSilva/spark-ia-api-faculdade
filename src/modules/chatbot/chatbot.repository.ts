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

  async findSessionsByUser(id_user: string) {
    return this.prisma.chatbotSession.findMany({
      where: { id_user },
      orderBy: { createdAt: 'desc' },
      include: {
        questions: {
          select: { id_question: true },
        },
      },
    });
  }

  async updateSessionTitle(id_chatbot_session: string, id_user: string, requestedTopic: string) {
    return this.prisma.chatbotSession.update({
      where: {
        id_chatbot_session,
        id_user,
      },
      data: { requestedTopic },
    });
  }

  async deleteSession(id_chatbot_session: string, id_user: string) {
    return this.prisma.chatbotSession.delete({
      where: {
        id_chatbot_session,
        id_user,
      },
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
