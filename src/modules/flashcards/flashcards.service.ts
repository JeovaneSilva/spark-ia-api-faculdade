import { Injectable, NotFoundException } from '@nestjs/common';
import { FlashcardsRepository } from './flashcards.repository';
import { CreateFlashcardDTO } from './DTOs/createFlashcard.dto';
import { UpdateFlashcardDTO } from './DTOs/updateFlashcard.dto';
import { CreateFlashcardReviewDTO } from './DTOs/createFlashcardReview.dto';
import { Subject } from '../../generated/prisma/client';

@Injectable()
export class FlashcardsService {
  constructor(private readonly repository: FlashcardsRepository) {}

  async create(data: CreateFlashcardDTO) {
    return this.repository.create(data);
  }

  async findByUser(id_user: string, subject?: Subject) {
    return this.repository.findByUser(id_user, subject);
  }

  async findById(id_flashcard: string) {
    const flashcard = await this.repository.findById(id_flashcard);
    if (!flashcard) {
      throw new NotFoundException('Flashcard não encontrado');
    }
    return flashcard;
  }

  async update(id_flashcard: string, data: UpdateFlashcardDTO) {
    await this.findById(id_flashcard);
    return this.repository.update(id_flashcard, data);
  }

  async delete(id_flashcard: string) {
    await this.findById(id_flashcard);
    return this.repository.delete(id_flashcard);
  }

  async createReview(id_flashcard: string, data: CreateFlashcardReviewDTO) {
    await this.findById(id_flashcard);
    return this.repository.createReview(id_flashcard, data.id_user, data.difficulty);
  }
}
