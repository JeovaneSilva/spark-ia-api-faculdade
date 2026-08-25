import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { ChatbotRepository } from './chatbot.repository';
import { QUESTION_GENERATOR } from './question-generator.interface';
import { FakeQuestionGenerator } from './generators/fake-question.generator';

@Module({
  controllers: [ChatbotController],
  providers: [
    ChatbotService,
    ChatbotRepository,
    { provide: QUESTION_GENERATOR, useClass: FakeQuestionGenerator },
  ],
})
export class ChatbotModule {}
