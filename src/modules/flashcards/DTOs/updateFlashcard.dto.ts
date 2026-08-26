import { PartialType } from '@nestjs/mapped-types';
import { CreateFlashcardDTO } from './createFlashcard.dto';

// id_user ja nao existe no CreateFlashcardDTO (vem do token), entao nao
// precisa mais de OmitType aqui.
export class UpdateFlashcardDTO extends PartialType(CreateFlashcardDTO) {}
