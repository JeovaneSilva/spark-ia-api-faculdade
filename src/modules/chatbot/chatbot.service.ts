import { Inject, Injectable } from '@nestjs/common';
import { ChatbotRepository } from './chatbot.repository';
import { ContentExtractor } from './content-extractor';
import { GenerateQuestionsDTO } from './DTOs/generateQuestions.dto';
import { QUESTION_GENERATOR } from './question-generator.interface';
import type { QuestionGenerator } from './question-generator.interface';

const DEFAULT_QUANTITY = 5;
const TOPIC_PREVIEW_CHARS = 200;

@Injectable()
export class ChatbotService {
  constructor(
    private readonly repository: ChatbotRepository,
    private readonly contentExtractor: ContentExtractor,
    @Inject(QUESTION_GENERATOR) private readonly generator: QuestionGenerator,
  ) {}

  async generateQuestions(data: GenerateQuestionsDTO, id_user: string) {
    const quantity = data.quantity ?? DEFAULT_QUANTITY;
    const content = await this.contentExtractor.resolve(data.content);

    // requestedTopic guarda só um preview -- o texto extraído de uma URL
    // pode ter milhares de caracteres, não faz sentido logar tudo isso.
    const topicPreview =
      content.length > TOPIC_PREVIEW_CHARS
        ? `${content.slice(0, TOPIC_PREVIEW_CHARS)}...`
        : content;
    const session = await this.repository.createSession(id_user, topicPreview);

    const drafts = await this.generator.generate({ content, quantity });

    const questions = await this.repository.createQuestions(session.id_chatbot_session, topicPreview, drafts);

    return { session, questions };
  }
}
