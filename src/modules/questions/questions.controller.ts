import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QuestionsService } from './questions.service';
import { QuestionType, Subject } from '../../generated/prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateAttemptDTO } from './DTOs/createAttempt.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('questions')
export class QuestionsController {
  constructor(private readonly service: QuestionsService) {}

  @Get()
  async findMany(
    @Query('type') type?: QuestionType,
    @Query('subject') subject?: Subject,
    @Query('topic') topic?: string,
    @Query('id_chatbot_session') id_chatbot_session?: string,
    @Query('examYear') examYear?: string,
  ) {
    return this.service.findMany({
      type,
      subject,
      topic,
      id_chatbot_session,
      examYear: examYear ? Number(examYear) : undefined,
    });
  }

  @Get('enem/years')
  async findEnemYears() {
    return this.service.findEnemYears();
  }

  // precisa vir antes de enem/:year/:number, senão "progress" seria
  // interpretado como o parametro :number
  @Get('enem/:year/progress')
  async findEnemProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('year') year: string,
  ) {
    return this.service.findEnemProgress(Number(year), user.id_user);
  }

  @Get('enem/:year/:number')
  async findEnemQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('year') year: string,
    @Param('number') number: string,
  ) {
    return this.service.findEnemQuestion(
      Number(year),
      Number(number),
      user.id_user,
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post(':id/attempts')
  async answerQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() data: CreateAttemptDTO,
  ) {
    return this.service.answerQuestion(id, user.id_user, data.answer);
  }
}
