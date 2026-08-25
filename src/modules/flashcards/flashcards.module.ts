import { Module } from '@nestjs/common';
import { FlashcardsController } from './flashcards.controller';
import { FlashcardsService } from './flashcards.service';
import { FlashcardsRepository } from './flashcards.repository';

@Module({
  controllers: [FlashcardsController],
  providers: [FlashcardsService, FlashcardsRepository],
})
export class FlashcardsModule {}
