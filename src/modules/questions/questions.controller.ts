import { Controller, Get, Param, Query } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionType, Subject } from '../../generated/prisma/client';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly service: QuestionsService) {}

  @Get()
  async findMany(
    @Query('type') type?: QuestionType,
    @Query('subject') subject?: Subject,
    @Query('topic') topic?: string,
    @Query('id_chatbot_session') id_chatbot_session?: string,
  ) {
    return this.service.findMany({ type, subject, topic, id_chatbot_session });
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
