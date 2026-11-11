import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateFlashcardDTO } from './DTOs/updateFlashcard.dto';
import { ReviewDifficulty, Subject } from '../../generated/prisma/client';

// Formato ja normalizado pelo service (question/answer resolvidos pra string,
// nunca undefined) -- diferente do CreateFlashcardDTO, que aceita omitir.
export interface FlashcardCreateData {
  question: string;
  questionImage: string | null;
  answer: string;
  answerImage: string | null;
  subject: Subject;
  topic?: string;
}

@Injectable()
export class FlashcardsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: FlashcardCreateData, id_user: string) {
    return this.prisma.flashcard.create({ data: { ...data, id_user } });
  }

  async findByUser(id_user: string, subject?: Subject) {
    return this.prisma.flashcard.findMany({
      where: { id_user, ...(subject ? { subject } : {}) },
      orderBy: { createdAt: 'desc' },
      // só a revisão mais recente: é o que define quando o cartão volta
      include: {
        reviews: { orderBy: { reviewedAt: 'desc' }, take: 1 },
      },
    });
  }

  async findById(id_flashcard: string) {
    return this.prisma.flashcard.findUnique({ where: { id_flashcard } });
  }

  async update(id_flashcard: string, data: UpdateFlashcardDTO) {
    return this.prisma.flashcard.update({ where: { id_flashcard }, data });
  }

  async delete(id_flashcard: string) {
    return this.prisma.flashcard.delete({ where: { id_flashcard } });
  }

  async createReview(
    id_flashcard: string,
    id_user: string,
    difficulty: ReviewDifficulty,
    isCorrect: boolean,
  ) {
    const [review] = await this.prisma.$transaction([
      this.prisma.flashcardReview.create({
        data: { id_flashcard, id_user, difficulty, isCorrect },
      }),
      this.prisma.flashcard.update({
        where: { id_flashcard },
        data: { lastReviewedAt: new Date() },
      }),
    ]);
    return review;
  }
}
