import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ChatbotService } from './chatbot.service';
import { GenerateQuestionsDTO } from './DTOs/generateQuestions.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly service: ChatbotService) {}

  @Post('generate')
  async generateQuestions(@CurrentUser() user: AuthenticatedUser, @Body() data: GenerateQuestionsDTO) {
    return this.service.generateQuestions(data, user.id_user);
  }
}
