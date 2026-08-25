import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuestionType, Subject } from '../../generated/prisma/client';
import { GeneratedQuestion } from './question-generator.interface';

@Injectable()
export class ChatbotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(id_user: string, requestedTopic: string) {
    return this.prisma.chatbotSession.create({
      data: { id_user, requestedTopic },
    });
  }

  async createQuestions(
    id_chatbot_session: string,
    subject: Subject,
    topic: string,
    questions: GeneratedQuestion[],
  ) {
    return this.prisma.question.createManyAndReturn({
      data: questions.map((question) => ({
        ...question,
        subject,
        topic,
        type: QuestionType.CHATBOT_GENERATED,
        id_chatbot_session,
      })),
    });
  }
}
