import type { ReviewDifficulty } from '../../generated/prisma/client';

const DAY_MS = 24 * 60 * 60 * 1000;

// Intervalos fixos até a próxima revisão depois de um acerto. Errar deixa o
// cartão pendente na hora. Derivado do histórico de FlashcardReview -- não há
// coluna própria pra "próxima revisão", então não existe dado duplicado.
const INTERVAL_DAYS: Record<ReviewDifficulty, number> = {
  HARD: 1,
  MEDIUM: 3,
  EASY: 7,
};

export interface LastReview {
  difficulty: ReviewDifficulty;
  isCorrect: boolean;
  reviewedAt: Date;
}

/** Quando o cartão volta a ficar pendente; null = nunca revisado (pendente já). */
export function nextReviewAt(last?: LastReview): Date | null {
  if (!last) return null;
  if (!last.isCorrect) return last.reviewedAt;
  return new Date(
    last.reviewedAt.getTime() + INTERVAL_DAYS[last.difficulty] * DAY_MS,
  );
}

export function isDue(next: Date | null, now = new Date()): boolean {
  return next === null || next.getTime() <= now.getTime();
}
