import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateFlashcardDTO } from './createFlashcard.dto';

// id_user não entra no update — dono do flashcard não muda depois de criado.
export class UpdateFlashcardDTO extends PartialType(
  OmitType(CreateFlashcardDTO, ['id_user'] as const),
) {}
