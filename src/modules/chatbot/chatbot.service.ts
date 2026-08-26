import { Inject, Injectable } from '@nestjs/common';
import { ChatbotRepository } from './chatbot.repository';
import { GenerateQuestionsDTO } from './DTOs/generateQuestions.dto';
import { QUESTION_GENERATOR } from './question-generator.interface';
import type { QuestionGenerator } from './question-generator.interface';

const DEFAULT_QUANTITY = 5;

@Injectable()
export class ChatbotService {
  constructor(
    private readonly repository: ChatbotRepository,
    @Inject(QUESTION_GENERATOR) private readonly generator: QuestionGenerator,
  ) {}

  async generateQuestions(data: GenerateQuestionsDTO, id_user: string) {
    const quantity = data.quantity ?? DEFAULT_QUANTITY;

    const session = await this.repository.createSession(id_user, data.topic);

    const drafts = await this.generator.generate({
      topic: data.topic,
      subject: data.subject,
      quantity,
    });

    const questions = await this.repository.createQuestions(
      session.id_chatbot_session,
      data.subject,
      data.topic,
      drafts,
    );

    return { session, questions };
  }
}
