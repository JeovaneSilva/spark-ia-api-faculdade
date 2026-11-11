import { calculateStreak, dayKey, parseTzOffset } from './streak';

describe('streak', () => {
  it('conta dias seguidos terminando hoje', () => {
    const days = new Set([
      '2026-03-10',
      '2026-03-09',
      '2026-03-08',
      '2026-03-05',
    ]);
    expect(calculateStreak(days, '2026-03-10')).toBe(3);
  });

  it('mantém a sequência de ontem se hoje ainda não teve atividade', () => {
    const days = new Set(['2026-03-09', '2026-03-08']);
    expect(calculateStreak(days, '2026-03-10')).toBe(2);
  });

  it('zera quando o último dia foi antes de ontem', () => {
    expect(calculateStreak(new Set(['2026-03-07']), '2026-03-10')).toBe(0);
  });

  it('atravessa virada de mês', () => {
    const days = new Set(['2026-03-01', '2026-02-28']);
    expect(calculateStreak(days, '2026-03-01')).toBe(2);
  });

  it('dayKey respeita o fuso (Brasil = offset 180)', () => {
    // 01:00 UTC ainda é "ontem" em Brasília
    expect(dayKey(new Date('2026-03-10T01:00:00Z'), 180)).toBe('2026-03-09');
    expect(dayKey(new Date('2026-03-10T01:00:00Z'), 0)).toBe('2026-03-10');
  });

  it('parseTzOffset ignora lixo e limita o intervalo', () => {
    expect(parseTzOffset(undefined)).toBe(0);
    expect(parseTzOffset('abc')).toBe(0);
    expect(parseTzOffset('180')).toBe(180);
    expect(parseTzOffset('99999')).toBe(840);
  });
});
