import { Body, Controller, Post } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { GenerateQuestionsDTO } from './DTOs/generateQuestions.dto';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly service: ChatbotService) {}

  @Post('generate')
  async generateQuestions(@Body() data: GenerateQuestionsDTO) {
    return this.service.generateQuestions(data);
  }
}
