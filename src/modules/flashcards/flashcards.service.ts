import { Injectable, NotFoundException } from '@nestjs/common';
import { FlashcardsRepository } from './flashcards.repository';
import { CreateFlashcardDTO } from './DTOs/createFlashcard.dto';
import { UpdateFlashcardDTO } from './DTOs/updateFlashcard.dto';
import { CreateFlashcardReviewDTO } from './DTOs/createFlashcardReview.dto';
import { Subject } from '../../generated/prisma/client';

@Injectable()
export class FlashcardsService {
  constructor(private readonly repository: FlashcardsRepository) {}

  async create(data: CreateFlashcardDTO, id_user: string) {
    return this.repository.create(data, id_user);
  }

  async findByUser(id_user: string, subject?: Subject) {
    return this.repository.findByUser(id_user, subject);
  }

  // 404 tanto se o flashcard nao existe quanto se existe mas e de outro
  // usuario -- nao revela pra quem nao e dono se o recurso sequer existe.
  async findOwnedById(id_flashcard: string, id_user: string) {
    const flashcard = await this.repository.findById(id_flashcard);
    if (!flashcard || flashcard.id_user !== id_user) {
      throw new NotFoundException('Flashcard não encontrado');
    }
    return flashcard;
  }

  async update(id_flashcard: string, id_user: string, data: UpdateFlashcardDTO) {
    await this.findOwnedById(id_flashcard, id_user);
    return this.repository.update(id_flashcard, data);
  }

  async delete(id_flashcard: string, id_user: string) {
    await this.findOwnedById(id_flashcard, id_user);
    return this.repository.delete(id_flashcard);
  }

  async createReview(id_flashcard: string, id_user: string, data: CreateFlashcardReviewDTO) {
    await this.findOwnedById(id_flashcard, id_user);
    return this.repository.createReview(id_flashcard, id_user, data.difficulty);
  }
}
