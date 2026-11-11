const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_TZ_OFFSET_MINUTES = 14 * 60;

/** Normaliza o offset enviado pelo navegador (Date#getTimezoneOffset, em minutos). */
export function parseTzOffset(raw?: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) return 0;
  return Math.max(
    -MAX_TZ_OFFSET_MINUTES,
    Math.min(MAX_TZ_OFFSET_MINUTES, Math.trunc(value)),
  );
}

/** Dia (AAAA-MM-DD) de um instante no fuso do usuário. */
export function dayKey(date: Date, tzOffsetMinutes: number): string {
  return new Date(date.getTime() - tzOffsetMinutes * 60_000)
    .toISOString()
    .slice(0, 10);
}

function previousDay(key: string): string {
  return new Date(Date.parse(`${key}T00:00:00Z`) - DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/**
 * Dias seguidos com atividade. Se hoje ainda não teve, a sequência de ontem
 * continua valendo (o usuário ainda pode estudar hoje sem perdê-la).
 */
export function calculateStreak(days: Set<string>, today: string): number {
  let cursor = days.has(today) ? today : previousDay(today);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = previousDay(cursor);
  }
  return streak;
}
