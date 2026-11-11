import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuestionType } from '../../generated/prisma/client';
import { GeneratedQuestion } from './question-generator.interface';

@Injectable()
export class ChatbotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(
    id_user: string,
    requestedTopic: string,
    inputContent: string,
  ) {
    return this.prisma.chatbotSession.create({
      data: { id_user, requestedTopic, inputContent },
    });
  }

  async findSessionsByUser(id_user: string) {
    return this.prisma.chatbotSession.findMany({
      where: { id_user },
      orderBy: { createdAt: 'desc' },
      include: {
        questions: {
          include: {
            attempts: {
              where: { id_user },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                userAnswer: true,
                isCorrect: true,
              },
            },
          },
        },
      },
    });
  }

  async updateSessionTitle(
    id_chatbot_session: string,
    id_user: string,
    requestedTopic: string,
  ) {
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

  // Filtra pelo dono da sessao para um usuario nao ler questao de outro.
  async findQuestionOfUser(id_question: string, id_user: string) {
    return this.prisma.question.findFirst({
      where: { id_question, chatbotSession: { id_user } },
    });
  }

  // Questao oficial do ENEM (publica) ou gerada numa conversa do proprio usuario.
  async findAccessibleQuestion(id_question: string, id_user: string) {
    return this.prisma.question.findFirst({
      where: {
        id_question,
        OR: [{ type: 'ENEM_OFFICIAL' }, { chatbotSession: { id_user } }],
      },
    });
  }

  async findLatestAttempt(id_question: string, id_user: string) {
    return this.prisma.questionAttempt.findFirst({
      where: { id_question, id_user },
      orderBy: { createdAt: 'desc' },
    });
  }

  // subject vem em cada questao individualmente (classificado pelo gerador a
  // partir do conteudo) -- nao e mais um valor unico pro lote inteiro.
  async createQuestions(
    id_chatbot_session: string,
    topic: string,
    questions: GeneratedQuestion[],
  ) {
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
