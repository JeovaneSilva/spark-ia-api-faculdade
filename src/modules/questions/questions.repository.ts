import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuestionType, Subject } from '../../generated/prisma/client';

export interface FindQuestionsFilter {
  type?: QuestionType;
  subject?: Subject;
  topic?: string;
  id_chatbot_session?: string;
}

@Injectable()
export class QuestionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(filter: FindQuestionsFilter) {
    return this.prisma.question.findMany({
      where: {
        ...(filter.type ? { type: filter.type } : {}),
        ...(filter.subject ? { subject: filter.subject } : {}),
        ...(filter.topic ? { topic: filter.topic } : {}),
        ...(filter.id_chatbot_session ? { id_chatbot_session: filter.id_chatbot_session } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id_question: string) {
    return this.prisma.question.findUnique({ where: { id_question } });
  }
}
