import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import {
  ExplainMistakeParams,
  FlashcardDraft,
  GeneratedQuestion,
  GenerateQuestionsParams,
  QuestionGenerator,
  QuestionToSummarize,
} from '../question-generator.interface';
import { AnswerOption, Subject } from '../../../generated/prisma/client';

const QUESTIONS_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          statement: { type: 'string' },
          optionA: { type: 'string' },
          optionB: { type: 'string' },
          optionC: { type: 'string' },
          optionD: { type: 'string' },
          optionE: { type: 'string' },
          correctOption: { type: 'string', enum: Object.values(AnswerOption) },
          explanation: { type: 'string' },
          subject: { type: 'string', enum: Object.values(Subject) },
        },
        required: [
          'statement',
          'optionA',
          'optionB',
          'optionC',
          'optionD',
          'optionE',
          'correctOption',
          'explanation',
          'subject',
        ],
      },
    },
  },
  required: ['questions'],
};

const FLASHCARD_SCHEMA = {
  type: 'object',
  properties: {
    question: { type: 'string' },
    answer: { type: 'string' },
  },
  required: ['question', 'answer'],
};

type RawGeneratedQuestion = Omit<
  GeneratedQuestion,
  'correctOption' | 'subject'
> & {
  correctOption: string;
  subject: string;
};

/**
 * Implementação real do QuestionGenerator usando a API do Gemini (Google).
 * Troca a implementação fake sem tocar em controller/service — só muda o
 * provider registrado no ChatbotModule (ver QUESTION_GENERATOR_PROVIDER).
 */
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 2000;

@Injectable()
export class GeminiQuestionGenerator implements QuestionGenerator {
  private readonly logger = new Logger(GeminiQuestionGenerator.name);
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada');
    }
    this.client = new GoogleGenAI({ apiKey });
    this.model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite';
  }

  async generate({
    content,
    quantity,
  }: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
    // Usa client.models.generateContent (API clássica), não client.interactions.create.
    // A Interactions API é a recomendada pela doc oficial, mas na prática ignorou o
    // response_format e devolveu texto livre em markdown em vez de JSON — testado e
    // reproduzido em 25/08/2026. generateContent + responseJsonSchema funciona.
    const response = await this.callWithRetry(() =>
      this.client.models.generateContent({
        model: this.model,
        contents: this.buildInput(content, quantity),
        config: {
          systemInstruction: this.buildSystemInstruction(),
          responseMimeType: 'application/json',
          responseJsonSchema: QUESTIONS_SCHEMA,
        },
      }),
    );

    const raw = response.text;
    if (!raw) {
      throw new InternalServerErrorException(
        'O Gemini não retornou nenhum conteúdo.',
      );
    }

    const parsed: { questions: RawGeneratedQuestion[] } = JSON.parse(raw) as {
      questions: RawGeneratedQuestion[];
    };

    return parsed.questions.map((question) => ({
      ...question,
      correctOption: question.correctOption as AnswerOption,
      subject: question.subject as Subject,
    }));
  }

  async explainMistake({
    question,
    userAnswer,
  }: ExplainMistakeParams): Promise<string> {
    const response = await this.callWithRetry(() =>
      this.client.models.generateContent({
        model: this.model,
        contents: [
          this.buildFlashcardInput(question),
          '',
          `Alternativa marcada pelo aluno (errada): ${userAnswer}`,
        ].join('\n'),
        config: {
          systemInstruction: [
            'Você é um tutor de ENEM. O aluno errou a questão abaixo.',
            'Explique em no máximo 5 frases: (1) por que a alternativa que ele marcou está errada, apontando o erro de raciocínio mais provável; (2) por que a alternativa correta está certa.',
            'Seja direto e acolhedor, sem repetir o enunciado, sem "pensar em voz alta" e sem listas longas. Responda em português do Brasil, em texto corrido.',
          ].join('\n'),
        },
      }),
    );

    const text = response.text?.trim();
    if (!text) {
      throw new InternalServerErrorException(
        'O Gemini não retornou nenhum conteúdo.',
      );
    }
    return text;
  }

  async summarizeAsFlashcard(
    question: QuestionToSummarize,
  ): Promise<FlashcardDraft> {
    const response = await this.callWithRetry(() =>
      this.client.models.generateContent({
        model: this.model,
        contents: this.buildFlashcardInput(question),
        config: {
          systemInstruction: this.buildFlashcardInstruction(),
          responseMimeType: 'application/json',
          responseJsonSchema: FLASHCARD_SCHEMA,
        },
      }),
    );

    const raw = response.text;
    if (!raw) {
      throw new InternalServerErrorException(
        'O Gemini não retornou nenhum conteúdo.',
      );
    }

    const draft: FlashcardDraft = JSON.parse(raw) as FlashcardDraft;
    if (!draft.question?.trim() || !draft.answer?.trim()) {
      throw new InternalServerErrorException(
        'Não foi possível criar o flashcard agora.',
      );
    }
    return { question: draft.question.trim(), answer: draft.answer.trim() };
  }

  // Sobrecarga, limite de requisições e falhas de rede costumam passar em
  // poucos segundos.
  private async callWithRetry<T>(call: () => Promise<T>): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await call();
      } catch (error) {
        this.logFailure(error);
        if (attempt === MAX_ATTEMPTS || !this.isTransientError(error)) {
          throw this.toHttpException(error);
        }
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_BASE_DELAY_MS * attempt),
        );
      }
    }
  }

  private logFailure(error: unknown): void {
    const { status, message } = error as { status?: number; message?: string };
    this.logger.error(
      `Falha ao chamar o Gemini (status ${status ?? 'sem status'}): ${message?.slice(0, 300)}`,
    );
  }

  // Sem status significa que a requisição nem chegou a ter resposta (erro de rede).
  private isTransientError(error: unknown): boolean {
    const { status, message } = error as { status?: number; message?: string };
    return (
      status === undefined ||
      status === 429 ||
      status >= 500 ||
      (status === 403 && this.isGoogleEdgeBlock(message))
    );
  }

  // A infraestrutura do Google recusa parte das conexões vindas do Koyeb com uma
  // página HTML; erros reais de chave ou permissão da API vêm em JSON.
  private isGoogleEdgeBlock(message?: string): boolean {
    return message?.includes('<!DOCTYPE html') ?? false;
  }

  private toHttpException(error: unknown): Error {
    if (this.isTransientError(error)) {
      return new ServiceUnavailableException(
        'O gerador de questões está sobrecarregado no momento. Tente novamente em instantes.',
      );
    }
    return new InternalServerErrorException(
      'Não foi possível gerar as questões agora.',
    );
  }

  private buildSystemInstruction(): string {
    return [
      'Você é um especialista em elaborar questões de múltipla escolha no estilo das provas do ENEM (Exame Nacional do Ensino Médio) do Brasil.',
      'Cada questão deve ter um enunciado contextualizado, como nas provas reais do ENEM, e 5 alternativas (A a E) plausíveis, com apenas uma correta.',
      'Os distratores (alternativas erradas) devem ser plausíveis, não óbvios, mas claramente incorretos para quem domina o conteúdo.',
      '',
      'Sobre a explicação: seja direto e objetivo. Escreva só o raciocínio final que comprova a alternativa correta,' +
        ' em no máximo 3-4 frases. Nunca demonstre tentativas, correções, recontagens ou "pensar em voz alta" —' +
        ' se precisar calcular algo, calcule uma vez, com cuidado, e apresente só o resultado final e por que está certo.',
      '',
      'Sobre a disciplina de cada questão: o conteúdo enviado pode não indicar uma disciplina óbvia, ou pode misturar' +
        ' vários assuntos. Para cada questão gerada, classifique-a na disciplina do ENEM que melhor representa o que' +
        ' ela está avaliando (ex.: um texto sobre um evento esportivo pode gerar tanto uma questão de História quanto' +
        ' uma de Matemática, dependendo do que a questão pede). Só gere questões em disciplinas plausíveis a partir do' +
        ' conteúdo — não force um assunto que não tem relação nenhuma com o que foi enviado.',
      '',
      'Responda sempre em português do Brasil.',
    ].join('\n');
  }

  private buildFlashcardInstruction(): string {
    return [
      'Você cria flashcards de estudo para o ENEM a partir de questões de múltipla escolha.',
      'Um flashcard NÃO é a questão copiada: identifique o conceito central que a questão avalia e crie uma pergunta curta e direta sobre ele.',
      'Regras da pergunta: no máximo ~140 caracteres, autossuficiente, sem citar alternativas, sem repetir o enunciado nem textos de apoio.',
      'Regras da resposta: objetiva, 1 a 2 frases (no máximo ~250 caracteres), com o fato, definição ou fórmula que o aluno precisa lembrar.',
      'Use a alternativa correta e a explicação como base da resposta. Responda sempre em português do Brasil.',
    ].join('\n');
  }

  private buildFlashcardInput(question: QuestionToSummarize): string {
    const options = [
      `A) ${question.optionA}`,
      `B) ${question.optionB}`,
      `C) ${question.optionC}`,
      `D) ${question.optionD}`,
      `E) ${question.optionE}`,
    ].join('\n');
    return [
      '--- QUESTÃO ---',
      question.statement,
      '',
      options,
      '',
      `Alternativa correta: ${question.correctOption}`,
      `Explicação: ${question.explanation ?? '(não informada)'}`,
    ].join('\n');
  }

  private buildInput(content: string, quantity: number): string {
    return [
      `Gere exatamente ${quantity} questões inéditas com base no conteúdo abaixo.`,
      'Se o conteúdo já for só um tema curto (ex.: "Revolução Francesa"), use seu próprio conhecimento sobre o assunto.',
      'Se for um texto mais longo (artigo, trecho de site), baseie as questões no que está escrito nele.',
      '',
      '--- CONTEÚDO ---',
      content,
    ].join('\n');
  }
}
