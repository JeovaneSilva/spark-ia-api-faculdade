import { NotFoundException } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsRepository } from './questions.repository';

const question = (id: string, correctOption: 'A' | 'B') => ({
  id_question: id,
  statement: `enunciado ${id}`,
  optionA: 'a',
  optionB: 'b',
  optionC: 'c',
  optionD: 'd',
  optionE: 'e',
  correctOption,
  explanation: `explicação ${id}`,
});

describe('QuestionsService - simulado', () => {
  let repository: jest.Mocked<
    Pick<
      QuestionsRepository,
      | 'findEnemQuestionIds'
      | 'findByIds'
      | 'findEnemExam'
      | 'createSimuladoAttempts'
    >
  >;
  let service: QuestionsService;

  beforeEach(() => {
    repository = {
      findEnemQuestionIds: jest.fn(),
      findByIds: jest.fn(),
      findEnemExam: jest.fn(),
      createSimuladoAttempts: jest.fn(),
    };
    service = new QuestionsService(
      repository as unknown as QuestionsRepository,
    );
  });

  it('sorteia no máximo "count" questões e NÃO revela gabarito nem explicação', async () => {
    repository.findEnemQuestionIds.mockResolvedValue(['1', '2', '3', '4']);
    repository.findByIds.mockImplementation(
      (ids) => Promise.resolve(ids.map((id) => question(id, 'A'))) as never,
    );

    const result = await service.createSimulado(2);

    expect(result).toHaveLength(2);
    for (const item of result) {
      expect(item).not.toHaveProperty('correctOption');
      expect(item).not.toHaveProperty('explanation');
    }
  });

  it('corrige as respostas, devolve o gabarito e salva as tentativas', async () => {
    repository.findByIds.mockResolvedValue([
      question('1', 'A'),
      question('2', 'B'),
    ] as never);

    const result = await service.submitSimulado(
      'user-1',
      [
        { id_question: '1', answer: 'A' as never },
        { id_question: '2', answer: 'C' as never },
      ],
      120,
    );

    expect(result.total).toBe(2);
    expect(result.correct).toBe(1);
    expect(result.results.find((r) => r.id_question === '2')).toMatchObject({
      isCorrect: false,
      correctOption: 'B',
    });
    expect(repository.createSimuladoAttempts).toHaveBeenCalledWith(
      'user-1',
      120,
      expect.arrayContaining([
        { id_question: '1', userAnswer: 'A', isCorrect: true },
      ]),
      undefined,
    );
  });

  it('prova oficial: grava o ano na sessão de estudo', async () => {
    repository.findByIds.mockResolvedValue([question('1', 'A')] as never);

    await service.submitSimulado(
      'user-1',
      [{ id_question: '1', answer: 'A' as never }],
      60,
      2023,
    );

    expect(repository.createSimuladoAttempts).toHaveBeenCalledWith(
      'user-1',
      60,
      expect.any(Array),
      2023,
    );
  });

  it('rejeita o envio quando alguma questão não existe', async () => {
    repository.findByIds.mockResolvedValue([question('1', 'A')] as never);

    await expect(
      service.submitSimulado('user-1', [
        { id_question: '1', answer: 'A' as never },
        { id_question: 'inexistente', answer: 'B' as never },
      ]),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.createSimuladoAttempts).not.toHaveBeenCalled();
  });
});

describe('QuestionsService - Simular ENEM', () => {
  let repository: jest.Mocked<Pick<QuestionsRepository, 'findEnemExam'>>;
  let service: QuestionsService;

  beforeEach(() => {
    repository = { findEnemExam: jest.fn() };
    service = new QuestionsService(
      repository as unknown as QuestionsRepository,
    );
  });

  it.each([
    ['1', 1, 90],
    ['2', 91, 180],
    ['completa', 1, 180],
  ] as const)('dia %s usa o intervalo %i–%i', async (day, from, to) => {
    repository.findEnemExam.mockResolvedValue([question('1', 'A')] as never);

    await service.createEnemExam(2023, day);

    expect(repository.findEnemExam).toHaveBeenCalledWith(2023, from, to);
  });

  it('devolve as questões na ordem do repositório, sem gabarito nem explicação', async () => {
    repository.findEnemExam.mockResolvedValue([
      question('a', 'A'),
      question('b', 'B'),
    ] as never);

    const result = await service.createEnemExam(2023, '1');

    expect(result.map((item) => item.id_question)).toEqual(['a', 'b']);
    for (const item of result) {
      expect(item).not.toHaveProperty('correctOption');
      expect(item).not.toHaveProperty('explanation');
    }
  });

  it('404 quando não há questões da prova', async () => {
    repository.findEnemExam.mockResolvedValue([]);

    await expect(service.createEnemExam(1999, '2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
