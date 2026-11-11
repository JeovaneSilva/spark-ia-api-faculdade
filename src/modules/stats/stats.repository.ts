import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Janela das datas de atividade: sequências maiores que isso não importam
// para a tela e evitam ler o histórico inteiro.
const ACTIVITY_WINDOW_DAYS = 400;

const activitySince = () =>
  new Date(Date.now() - ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000);

@Injectable()
export class StatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findReviewDates(id_user: string) {
    const rows = await this.prisma.flashcardReview.findMany({
      where: { id_user, reviewedAt: { gte: activitySince() } },
      select: { reviewedAt: true },
    });
    return rows.map((row) => row.reviewedAt);
  }

  async findAttemptDates(id_user: string) {
    const rows = await this.prisma.questionAttempt.findMany({
      where: { id_user, createdAt: { gte: activitySince() } },
      select: { createdAt: true },
    });
    return rows.map((row) => row.createdAt);
  }

  async countAnsweredQuestions(id_user: string) {
    const rows = await this.prisma.questionAttempt.findMany({
      where: { id_user },
      distinct: ['id_question'],
      select: { id_question: true },
    });
    return rows.length;
  }

  // Acertos/erros de questões e de flashcards, já com a disciplina.
  async findQuestionOutcomes(id_user: string) {
    return this.prisma.questionAttempt.findMany({
      where: { id_user, question: { subject: { not: null } } },
      select: { isCorrect: true, question: { select: { subject: true } } },
    });
  }

  async findFlashcardOutcomes(id_user: string) {
    return this.prisma.flashcardReview.findMany({
      where: { id_user },
      select: { isCorrect: true, flashcard: { select: { subject: true } } },
    });
  }
}
