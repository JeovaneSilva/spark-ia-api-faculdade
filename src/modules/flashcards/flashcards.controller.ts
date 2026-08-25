import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { CreateFlashcardDTO } from './DTOs/createFlashcard.dto';
import { UpdateFlashcardDTO } from './DTOs/updateFlashcard.dto';
import { CreateFlashcardReviewDTO } from './DTOs/createFlashcardReview.dto';
import { Subject } from '../../generated/prisma/client';

@Controller('flashcards')
export class FlashcardsController {
  constructor(private readonly service: FlashcardsService) {}

  @Post()
  async create(@Body() data: CreateFlashcardDTO) {
    return this.service.create(data);
  }

  @Get()
  async findByUser(@Query('id_user') id_user: string, @Query('subject') subject?: Subject) {
    return this.service.findByUser(id_user, subject);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateFlashcardDTO) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Post(':id/review')
  async createReview(@Param('id') id: string, @Body() data: CreateFlashcardReviewDTO) {
    return this.service.createReview(id, data);
  }
}
