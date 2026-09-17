import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuestionType, Subject } from '../../generated/prisma/client';

export interface FindQuestionsFilter {
  type?: QuestionType;
  subject?: Subject;
  topic?: string;
  id_chatbot_session?: string;
  examYear?: number;
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
        ...(filter.examYear ? { examYear: filter.examYear } : {}),
      },
      orderBy: filter.examYear ? { examNumber: 'asc' } : { createdAt: 'desc' },
    });
  }

  async findById(id_question: string) {
    return this.prisma.question.findUnique({ where: { id_question } });
  }

  async findEnemYears() {
    const rows = await this.prisma.question.findMany({
      where: { type: 'ENEM_OFFICIAL' },
      select: { examYear: true },
      distinct: ['examYear'],
      orderBy: { examYear: 'desc' },
    });
    return rows.map((row) => row.examYear).filter((year): year is number => year !== null);
  }

  async findEnemQuestion(examYear: number, examNumber: number) {
    return this.prisma.question.findUnique({
      where: { examYear_examNumber: { examYear, examNumber } },
    });
  }
}
