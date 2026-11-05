import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { ChatbotRepository } from './chatbot.repository';
import { ContentExtractor } from './content-extractor';
import { QUESTION_GENERATOR } from './question-generator.interface';
import { FakeQuestionGenerator } from './generators/fake-question.generator';
import { GeminiQuestionGenerator } from './generators/gemini-question.generator';

@Module({
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    ChatbotRepository,
    ContentExtractor,
    {
      provide: QUESTION_GENERATOR,
      // Troca via env var QUESTION_GENERATOR_PROVIDER=fake|gemini — sem
      // custo nenhum enquanto ficar em "fake" (default).
      useFactory: () =>
        process.env.QUESTION_GENERATOR_PROVIDER === 'gemini'
          ? new GeminiQuestionGenerator()
          : new FakeQuestionGenerator(),
    },
  ],
})
export class ChatbotModule {}
