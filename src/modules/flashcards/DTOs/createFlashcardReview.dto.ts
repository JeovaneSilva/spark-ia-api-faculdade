import { IsEnum } from 'class-validator';
import { ReviewDifficulty } from '../../../generated/prisma/client';

// id_user nao vem do client -- e derivado do token autenticado no controller.
export class CreateFlashcardReviewDTO {
  @IsEnum(ReviewDifficulty)
  difficulty!: ReviewDifficulty;
}
