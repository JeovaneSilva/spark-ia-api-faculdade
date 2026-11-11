import { Injectable } from '@nestjs/common';
import { StatsRepository } from './stats.repository';
import { calculateStreak, dayKey } from './streak';

interface SubjectTotals {
  correct: number;
  total: number;
}

@Injectable()
export class StatsService {
  constructor(private readonly repository: StatsRepository) {}

  async getSummary(id_user: string, tzOffsetMinutes: number) {
    const [
      reviewDates,
      attemptDates,
      answeredQuestions,
      questionOutcomes,
      flashcardOutcomes,
    ] = await Promise.all([
      this.repository.findReviewDates(id_user),
      this.repository.findAttemptDates(id_user),
      this.repository.countAnsweredQuestions(id_user),
      this.repository.findQuestionOutcomes(id_user),
      this.repository.findFlashcardOutcomes(id_user),
    ]);

    const today = dayKey(new Date(), tzOffsetMinutes);
    const activityDays = new Set(
      [...reviewDates, ...attemptDates].map((date) =>
        dayKey(date, tzOffsetMinutes),
      ),
    );

    const bySubject = new Map<string, SubjectTotals>();
    const addOutcome = (subject: string | null, isCorrect: boolean) => {
      if (!subject) return;
      const totals = bySubject.get(subject) ?? { correct: 0, total: 0 };
      totals.total += 1;
      if (isCorrect) totals.correct += 1;
      bySubject.set(subject, totals);
    };
    questionOutcomes.forEach((o) =>
      addOutcome(o.question.subject, o.isCorrect),
    );
    flashcardOutcomes.forEach((o) =>
      addOutcome(o.flashcard.subject, o.isCorrect),
    );

    return {
      streakDays: calculateStreak(activityDays, today),
      reviewedToday: reviewDates.filter(
        (date) => dayKey(date, tzOffsetMinutes) === today,
      ).length,
      answeredQuestions,
      bySubject: [...bySubject.entries()]
        .map(([subject, totals]) => ({ subject, ...totals }))
        .sort((a, b) => b.total - a.total),
    };
  }
}
