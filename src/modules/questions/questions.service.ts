import { Injectable, NotFoundException } from '@nestjs/common';
import { FindQuestionsFilter, QuestionsRepository } from './questions.repository';

@Injectable()
export class QuestionsService {
  constructor(private readonly repository: QuestionsRepository) {}

  async findMany(filter: FindQuestionsFilter) {
    return this.repository.findMany(filter);
  }

  async findById(id_question: string) {
    const question = await this.repository.findById(id_question);
    if (!question) {
      throw new NotFoundException('Questão não encontrada');
    }
    return question;
  }
}
