import { Injectable, NotFoundException } from '@nestjs/common';
import {
  FindQuestionsFilter,
  QuestionsRepository,
} from './questions.repository';
import { AnswerOption } from '../../generated/prisma/client';

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

  async findEnemYears() {
    return this.repository.findEnemYears();
  }

  async findEnemQuestion(
    examYear: number,
    examNumber: number,
    id_user: string,
  ) {
    const question = await this.repository.findEnemQuestion(
      examYear,
      examNumber,
    );
    if (!question) {
      throw new NotFoundException('Questão não encontrada');
    }

    const attempt = await this.repository.findLatestAttempt(
      question.id_question,
      id_user,
    );

    return {
      ...question,
      myAttempt: attempt
        ? { userAnswer: attempt.userAnswer, isCorrect: attempt.isCorrect }
        : null,
    };
  }

  async findEnemProgress(examYear: number, id_user: string) {
    return this.repository.findEnemProgress(examYear, id_user);
  }

  async answerQuestion(
    id_question: string,
    id_user: string,
    answer: AnswerOption,
  ) {
    const question = await this.findById(id_question);
    const isCorrect = answer === question.correctOption;
    await this.repository.createAttempt(
      id_question,
      id_user,
      answer,
      isCorrect,
    );

    return {
      isCorrect,
      userAnswer: answer,
      correctOption: question.correctOption,
      explanation: question.explanation,
    };
  }
}
