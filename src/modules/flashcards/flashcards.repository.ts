import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFlashcardDTO } from './DTOs/createFlashcard.dto';
import { UpdateFlashcardDTO } from './DTOs/updateFlashcard.dto';
import { ReviewDifficulty, Subject } from '../../generated/prisma/client';

@Injectable()
export class FlashcardsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateFlashcardDTO) {
    return this.prisma.flashcard.create({ data });
  }

  async findByUser(id_user: string, subject?: Subject) {
    return this.prisma.flashcard.findMany({
      where: { id_user, ...(subject ? { subject } : {}) },
      orderBy: { createdAt: 'desc' },
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

  async createReview(id_flashcard: string, id_user: string, difficulty: ReviewDifficulty) {
    const [review] = await this.prisma.$transaction([
      this.prisma.flashcardReview.create({
        data: { id_flashcard, id_user, difficulty },
      }),
      this.prisma.flashcard.update({
        where: { id_flashcard },
        data: { lastReviewedAt: new Date() },
      }),
    ]);
    return review;
  }
}
