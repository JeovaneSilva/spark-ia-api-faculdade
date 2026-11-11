import { isDue, nextReviewAt } from './spaced-repetition';

const DAY_MS = 24 * 60 * 60 * 1000;
const reviewedAt = new Date('2026-01-10T12:00:00Z');

describe('spaced-repetition', () => {
  it('cartão nunca revisado fica pendente', () => {
    const next = nextReviewAt(undefined);
    expect(next).toBeNull();
    expect(isDue(next)).toBe(true);
  });

  it('erro deixa o cartão pendente na hora', () => {
    const next = nextReviewAt({
      difficulty: 'HARD',
      isCorrect: false,
      reviewedAt,
    });
    expect(isDue(next, reviewedAt)).toBe(true);
  });

  it.each([
    ['HARD', 1],
    ['MEDIUM', 3],
    ['EASY', 7],
  ] as const)('acerto %s volta em %i dia(s)', (difficulty, days) => {
    const next = nextReviewAt({ difficulty, isCorrect: true, reviewedAt });
    expect(next?.getTime()).toBe(reviewedAt.getTime() + days * DAY_MS);
    expect(
      isDue(next, new Date(reviewedAt.getTime() + days * DAY_MS - 1)),
    ).toBe(false);
    expect(isDue(next, new Date(reviewedAt.getTime() + days * DAY_MS))).toBe(
      true,
    );
  });
});
