import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatbotService } from './chatbot.service';
import { GenerateQuestionsDTO } from './DTOs/generateQuestions.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly service: ChatbotService) {}

  @Post('generate')
  async generateQuestions(@Body() data: GenerateQuestionsDTO) {
    return this.service.generateQuestions(data);
  }
}
