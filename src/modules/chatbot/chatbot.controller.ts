import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ChatbotService } from './chatbot.service';
import { GenerateQuestionsDTO } from './DTOs/generateQuestions.dto';

class RenameChatbotSessionDTO {
  requestedTopic: string;
}

@UseGuards(AuthGuard('jwt'))
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly service: ChatbotService) {}

  @Get('sessions')
  async listSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listSessions(user.id_user);
  }

  @Patch('sessions/:id')
  async renameSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() data: RenameChatbotSessionDTO,
  ) {
    return this.service.renameSession(user.id_user, id, data.requestedTopic);
  }

  @Delete('sessions/:id')
  async deleteSession(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.service.deleteSession(user.id_user, id);
    return { success: true };
  }

  @Post('generate')
  async generateQuestions(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: GenerateQuestionsDTO,
  ) {
    return this.service.generateQuestions(data, user.id_user);
  }
}
