import { Injectable, NotFoundException } from '@nestjs/common';
import {
  FindQuestionsFilter,
  QuestionsRepository,
} from './questions.repository';
import { AnswerOption, Subject } from '../../generated/prisma/client';
import { SimuladoAnswerDTO } from './DTOs/submitSimulado.dto';

const DEFAULT_SIMULADO_QUESTIONS = 10;

// Numeração oficial do ENEM: dia 1 = 1–90 (Linguagens e Humanas),
// dia 2 = 91–180 (Natureza e Matemática).
export type EnemExamDay = '1' | '2' | 'completa';
const EXAM_RANGES: Record<EnemExamDay, [number, number]> = {
  '1': [1, 90],
  '2': [91, 180],
  completa: [1, 180],
};

// O gabarito e a explicação só são revelados na resposta do envio.
function withoutAnswer<
  T extends { correctOption?: unknown; explanation?: unknown },
>(question: T): Partial<T> {
  const publicQuestion: Partial<T> = { ...question };
  delete publicQuestion.correctOption;
  delete publicQuestion.explanation;
  return publicQuestion;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

@Injectable()
export class QuestionsService {
  constructor(private readonly repository: QuestionsRepository) {}

  // Sorteia questões oficiais do ENEM SEM gabarito nem explicação: o simulado
  // só revela a correção depois do envio das respostas.
  async createSimulado(
    count = DEFAULT_SIMULADO_QUESTIONS,
    subjects?: Subject[],
  ) {
    const ids = await this.repository.findEnemQuestionIds(subjects);
    const picked = shuffle(ids).slice(0, count);
    const questions = await this.repository.findByIds(picked);

    return shuffle(questions).map(withoutAnswer);
  }

  // "Simular ENEM": prova oficial do ano, na ordem original, sem gabarito.
  async createEnemExam(examYear: number, day: EnemExamDay) {
    const [from, to] = EXAM_RANGES[day];
    const questions = await this.repository.findEnemExam(examYear, from, to);
    if (questions.length === 0) {
      throw new NotFoundException('Não há questões dessa prova cadastradas.');
    }
    return questions.map(withoutAnswer);
  }

  async submitSimulado(
    id_user: string,
    answers: SimuladoAnswerDTO[],
    durationSeconds = 0,
    examYear?: number,
  ) {
    // uma resposta por questão (a última enviada vence)
    const byQuestion = new Map(
      answers.map((answer) => [answer.id_question, answer.answer]),
    );
    const questions = await this.repository.findByIds([...byQuestion.keys()]);
    if (questions.length !== byQuestion.size) {
      throw new NotFoundException('Alguma questão do simulado não existe.');
    }

    const results = questions.map((question) => {
      const userAnswer = byQuestion.get(question.id_question)!;
      return {
        id_question: question.id_question,
        userAnswer,
        isCorrect: userAnswer === question.correctOption,
        correctOption: question.correctOption,
        explanation: question.explanation,
      };
    });

    await this.repository.createSimuladoAttempts(
      id_user,
      durationSeconds,
      results.map(({ id_question, userAnswer, isCorrect }) => ({
        id_question,
        userAnswer,
        isCorrect,
      })),
      examYear,
    );

    return {
      total: results.length,
      correct: results.filter((result) => result.isCorrect).length,
      results,
    };
  }

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
