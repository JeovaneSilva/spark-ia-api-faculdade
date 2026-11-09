import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import {
  GeneratedQuestion,
  GenerateQuestionsParams,
  QuestionGenerator,
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

type RawGeneratedQuestion = Omit<GeneratedQuestion, 'correctOption' | 'subject'> & {
  correctOption: string;
  subject: string;
};

/**
 * Implementação real do QuestionGenerator usando a API do Gemini (Google).
 * Troca a implementação fake sem tocar em controller/service — só muda o
 * provider registrado no ChatbotModule (ver QUESTION_GENERATOR_PROVIDER).
 */
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

  async generate({ content, quantity }: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
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
      throw new InternalServerErrorException('O Gemini não retornou nenhum conteúdo.');
    }

    const parsed: { questions: RawGeneratedQuestion[] } = JSON.parse(raw);

    return parsed.questions.map((question) => ({
      ...question,
      correctOption: question.correctOption as AnswerOption,
      subject: question.subject as Subject,
    }));
  }

  // Sobrecarga, limite de requisições e falhas de rede costumam passar numa
  // segunda tentativa alguns segundos depois.
  private async callWithRetry<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error) {
      this.logFailure(error);
      if (!this.isTransientError(error)) {
        throw this.toHttpException(error);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        return await call();
      } catch (retryError) {
        this.logFailure(retryError);
        throw this.toHttpException(retryError);
      }
    }
  }

  private logFailure(error: unknown): void {
    const { status, message } = error as { status?: number; message?: string };
    this.logger.error(
      `Falha ao chamar o Gemini (status ${status ?? 'sem status'}): ${message}`,
    );
  }

  // Sem status significa que a requisição nem chegou a ter resposta (erro de rede).
  private isTransientError(error: unknown): boolean {
    const status = (error as { status?: number })?.status;
    return status === undefined || status === 429 || status >= 500;
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
