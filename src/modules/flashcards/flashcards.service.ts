import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FlashcardsRepository } from './flashcards.repository';
import { CreateFlashcardDTO } from './DTOs/createFlashcard.dto';
import { UpdateFlashcardDTO } from './DTOs/updateFlashcard.dto';
import { CreateFlashcardReviewDTO } from './DTOs/createFlashcardReview.dto';
import { Subject } from '../../generated/prisma/client';

@Injectable()
export class FlashcardsService {
  constructor(private readonly repository: FlashcardsRepository) {}

  async create(data: CreateFlashcardDTO, id_user: string) {
    const question = data.question?.trim() ?? '';
    const questionImage = data.questionImage ?? null;
    const answer = data.answer?.trim() ?? '';
    const answerImage = data.answerImage ?? null;

    this.assertHasContent(question, questionImage, 'A pergunta');
    this.assertHasContent(answer, answerImage, 'A resposta');

    return this.repository.create(
      {
        question,
        questionImage,
        answer,
        answerImage,
        subject: data.subject,
        topic: data.topic,
      },
      id_user,
    );
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

  async update(
    id_flashcard: string,
    id_user: string,
    data: UpdateFlashcardDTO,
  ) {
    const existing = await this.findOwnedById(id_flashcard, id_user);

    // so recalcula o lado que veio no patch; o lado nao enviado mantem o
    // valor atual do banco, entao a validacao precisa olhar o resultado
    // combinado, nao so o que chegou nesse request.
    const question =
      data.question !== undefined ? data.question.trim() : existing.question;
    const questionImage =
      data.questionImage !== undefined
        ? data.questionImage
        : existing.questionImage;
    const answer =
      data.answer !== undefined ? data.answer.trim() : existing.answer;
    const answerImage =
      data.answerImage !== undefined ? data.answerImage : existing.answerImage;

    this.assertHasContent(question, questionImage, 'A pergunta');
    this.assertHasContent(answer, answerImage, 'A resposta');

    return this.repository.update(id_flashcard, {
      ...data,
      question,
      questionImage,
      answer,
      answerImage,
    });
  }

  async delete(id_flashcard: string, id_user: string) {
    await this.findOwnedById(id_flashcard, id_user);
    return this.repository.delete(id_flashcard);
  }

  async createReview(
    id_flashcard: string,
    id_user: string,
    data: CreateFlashcardReviewDTO,
  ) {
    await this.findOwnedById(id_flashcard, id_user);
    return this.repository.createReview(
      id_flashcard,
      id_user,
      data.difficulty,
      data.isCorrect,
    );
  }

  private assertHasContent(text: string, image: string | null, label: string) {
    if (!text && !image) {
      throw new BadRequestException(`${label} precisa ter texto ou imagem.`);
    }
  }
}
