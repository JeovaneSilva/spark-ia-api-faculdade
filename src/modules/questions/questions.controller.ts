import {
  BadRequestException,
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
import {
  MAX_SIMULADO_QUESTIONS,
  SubmitSimuladoDTO,
} from './DTOs/submitSimulado.dto';

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

  // Rotas fixas (simulado) precisam vir antes de :id.
  @Get('simulado')
  async createSimulado(
    @Query('count') count?: string,
    @Query('subjects') subjects?: string,
  ) {
    const validSubjects = new Set<string>(Object.values(Subject));
    const parsedSubjects = (subjects ?? '')
      .split(',')
      .filter((subject) => validSubjects.has(subject)) as Subject[];
    const parsedCount = Math.trunc(Number(count));

    return this.service.createSimulado(
      Number.isFinite(parsedCount) && parsedCount > 0
        ? Math.min(parsedCount, MAX_SIMULADO_QUESTIONS)
        : undefined,
      parsedSubjects,
    );
  }

  // ?ano=2023&dia=1|2|completa
  @Get('simulado/enem')
  async createEnemExam(@Query('ano') ano?: string, @Query('dia') dia?: string) {
    const year = Number(ano);
    if (!Number.isInteger(year) || year < 1998 || year > 2100) {
      throw new BadRequestException('Informe um ano válido (ano=2023).');
    }
    if (dia !== '1' && dia !== '2' && dia !== 'completa') {
      throw new BadRequestException('O dia deve ser 1, 2 ou completa.');
    }
    return this.service.createEnemExam(year, dia);
  }

  @Post('simulado/submit')
  async submitSimulado(
    @CurrentUser() user: AuthenticatedUser,
    @Body() data: SubmitSimuladoDTO,
  ) {
    return this.service.submitSimulado(
      user.id_user,
      data.answers,
      data.durationSeconds,
      data.examYear,
    );
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
