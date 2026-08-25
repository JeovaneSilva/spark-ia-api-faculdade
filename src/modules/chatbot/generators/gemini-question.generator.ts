import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import {
  GeneratedQuestion,
  GenerateQuestionsParams,
  QuestionGenerator,
} from '../question-generator.interface';
import { AnswerOption } from '../../../generated/prisma/client';

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
        ],
      },
    },
  },
  required: ['questions'],
};

type RawGeneratedQuestion = Omit<GeneratedQuestion, 'correctOption'> & {
  correctOption: string;
};

/**
 * Implementação real do QuestionGenerator usando a API do Gemini (Google).
 * Troca a implementação fake sem tocar em controller/service — só muda o
 * provider registrado no ChatbotModule (ver QUESTION_GENERATOR_PROVIDER).
 */
@Injectable()
export class GeminiQuestionGenerator implements QuestionGenerator {
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

  async generate({ topic, subject, quantity }: GenerateQuestionsParams): Promise<GeneratedQuestion[]> {
    // Usa client.models.generateContent (API clássica), não client.interactions.create.
    // A Interactions API é a recomendada pela doc oficial, mas na prática ignorou o
    // response_format e devolveu texto livre em markdown em vez de JSON — testado e
    // reproduzido em 25/08/2026. generateContent + responseJsonSchema funciona.
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: this.buildInput(topic, subject, quantity),
      config: {
        systemInstruction: this.buildSystemInstruction(),
        responseMimeType: 'application/json',
        responseJsonSchema: QUESTIONS_SCHEMA,
      },
    });

    const raw = response.text;
    if (!raw) {
      throw new InternalServerErrorException('O Gemini não retornou nenhum conteúdo.');
    }

    const parsed: { questions: RawGeneratedQuestion[] } = JSON.parse(raw);

    return parsed.questions.map((question) => ({
      ...question,
      correctOption: question.correctOption as AnswerOption,
    }));
  }

  private buildSystemInstruction(): string {
    return [
      'Você é um especialista em elaborar questões de múltipla escolha no estilo das provas do ENEM (Exame Nacional do Ensino Médio) do Brasil.',
      'Cada questão deve ter um enunciado contextualizado, como nas provas reais do ENEM, e 5 alternativas (A a E) plausíveis, com apenas uma correta.',
      'Os distratores (alternativas erradas) devem ser plausíveis, não óbvios, mas claramente incorretos para quem domina o conteúdo.',
      'Sempre inclua uma explicação clara do motivo pelo qual a alternativa correta está certa.',
      'Responda sempre em português do Brasil.',
    ].join('\n');
  }

  private buildInput(topic: string, subject: string, quantity: number): string {
    return `Gere exatamente ${quantity} questões inéditas sobre o tema "${topic}", na disciplina de ${subject}.`;
  }
}
