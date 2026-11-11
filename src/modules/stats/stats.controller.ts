import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { StatsService } from './stats.service';
import { parseTzOffset } from './streak';

@UseGuards(AuthGuard('jwt'))
@Controller('stats')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  // tzOffset = Date#getTimezoneOffset() do navegador: "hoje" e a sequência de
  // dias seguem o dia do usuário, não o do servidor (UTC).
  @Get('summary')
  async getSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query('tzOffset') tzOffset?: string,
  ) {
    return this.service.getSummary(user.id_user, parseTzOffset(tzOffset));
  }
}
