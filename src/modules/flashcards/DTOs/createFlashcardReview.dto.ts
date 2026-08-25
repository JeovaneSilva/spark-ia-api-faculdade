import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ReviewDifficulty } from '../../../generated/prisma/client';

export class CreateFlashcardReviewDTO {
  @IsString()
  @IsNotEmpty()
  id_user!: string;

  @IsEnum(ReviewDifficulty)
  difficulty!: ReviewDifficulty;
}
