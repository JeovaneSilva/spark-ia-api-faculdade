import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { FlashcardsService } from './flashcards.service';
import { CreateFlashcardDTO } from './DTOs/createFlashcard.dto';
import { UpdateFlashcardDTO } from './DTOs/updateFlashcard.dto';
import { CreateFlashcardReviewDTO } from './DTOs/createFlashcardReview.dto';
import { Subject } from '../../generated/prisma/client';

@UseGuards(AuthGuard('jwt'))
@Controller('flashcards')
export class FlashcardsController {
  constructor(private readonly service: FlashcardsService) {}

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() data: CreateFlashcardDTO) {
    return this.service.create(data, user.id_user);
  }

  @Get()
  async findByUser(@CurrentUser() user: AuthenticatedUser, @Query('subject') subject?: Subject) {
    return this.service.findByUser(user.id_user, subject);
  }

  @Get(':id')
  async findById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.findOwnedById(id, user.id_user);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() data: UpdateFlashcardDTO,
  ) {
    return this.service.update(id, user.id_user, data);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.delete(id, user.id_user);
  }

  @Post(':id/review')
  async createReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() data: CreateFlashcardReviewDTO,
  ) {
    return this.service.createReview(id, user.id_user, data);
  }
}
