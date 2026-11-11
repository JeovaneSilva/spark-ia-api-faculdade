import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AnswerOption,
  QuestionType,
  Subject,
} from '../../generated/prisma/client';

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
        ...(filter.id_chatbot_session
          ? { id_chatbot_session: filter.id_chatbot_session }
          : {}),
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
    return rows
      .map((row) => row.examYear)
      .filter((year): year is number => year !== null);
  }

  async findEnemQuestion(examYear: number, examNumber: number) {
    return this.prisma.question.findUnique({
      where: { examYear_examNumber: { examYear, examNumber } },
    });
  }

  async findLatestAttempt(id_question: string, id_user: string) {
    return this.prisma.questionAttempt.findFirst({
      where: { id_question, id_user },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAttempt(
    id_question: string,
    id_user: string,
    userAnswer: AnswerOption,
    isCorrect: boolean,
  ) {
    return this.prisma.questionAttempt.create({
      data: { id_question, id_user, userAnswer, isCorrect },
    });
  }

  async findEnemQuestionIds(subjects?: Subject[]) {
    const rows = await this.prisma.question.findMany({
      where: {
        type: 'ENEM_OFFICIAL',
        ...(subjects?.length ? { subject: { in: subjects } } : {}),
      },
      select: { id_question: true },
    });
    return rows.map((row) => row.id_question);
  }

  // Prova oficial: questões do ano num intervalo de numeração, na ordem da prova.
  async findEnemExam(examYear: number, fromNumber: number, toNumber: number) {
    return this.prisma.question.findMany({
      where: {
        type: 'ENEM_OFFICIAL',
        examYear,
        examNumber: { gte: fromNumber, lte: toNumber },
      },
      orderBy: { examNumber: 'asc' },
    });
  }

  async findByIds(ids: string[]) {
    return this.prisma.question.findMany({
      where: { id_question: { in: ids } },
    });
  }

  // Simulado = sessão de estudo do banco de questões; as tentativas ficam
  // ligadas a ela. Tudo na mesma transação.
  async createSimuladoAttempts(
    id_user: string,
    durationSeconds: number,
    attempts: {
      id_question: string;
      userAnswer: AnswerOption;
      isCorrect: boolean;
    }[],
    examYear?: number,
  ) {
    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - durationSeconds * 1000);

    return this.prisma.$transaction(async (tx) => {
      const session = await tx.studySession.create({
        data: {
          id_user,
          type: 'QUESTION_BANK',
          startedAt,
          endedAt,
          examYear,
        },
      });
      await tx.questionAttempt.createMany({
        data: attempts.map((attempt) => ({
          ...attempt,
          id_user,
          id_study_session: session.id_study_session,
        })),
      });
      return session;
    });
  }

  async findEnemProgress(examYear: number, id_user: string) {
    const [questions, attempts] = await Promise.all([
      this.prisma.question.findMany({
        where: { type: 'ENEM_OFFICIAL', examYear },
        select: { id_question: true, examNumber: true },
        orderBy: { examNumber: 'asc' },
      }),
      this.prisma.questionAttempt.findMany({
        where: { id_user, question: { type: 'ENEM_OFFICIAL', examYear } },
        select: { id_question: true, isCorrect: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // ultima tentativa de cada questao vence (Map preserva a ultima inserção)
    const latestByQuestion = new Map(
      attempts.map((attempt) => [attempt.id_question, attempt.isCorrect]),
    );

    return questions.map((question) => ({
      examNumber: question.examNumber,
      answered: latestByQuestion.has(question.id_question),
      isCorrect: latestByQuestion.get(question.id_question) ?? null,
    }));
  }
}
