import { BadRequestException, Injectable } from '@nestjs/common';

const MAX_CONTENT_CHARS = 8000;
const FETCH_TIMEOUT_MS = 10000;

const URL_PATTERN = /^https?:\/\/\S+$/i;

/**
 * Resolve o que o usuário mandou (uma URL, ou um texto/tema já pronto) pro
 * conteúdo de texto que vai virar contexto do prompt de geração. Isolado
 * do gerador em si porque a lógica de "buscar e limpar HTML" não tem nada
 * a ver com Gemini -- outro provider usaria o mesmo texto extraído.
 */
@Injectable()
export class ContentExtractor {
  async resolve(input: string): Promise<string> {
    const trimmed = input.trim();

    if (URL_PATTERN.test(trimmed)) {
      return this.fetchAndExtract(trimmed);
    }

    return truncate(trimmed, MAX_CONTENT_CHARS);
  }

  private async fetchAndExtract(url: string): Promise<string> {
    let response: Response;
    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SparkIA-Chatbot/1.0)',
        },
      });
    } catch {
      throw new BadRequestException('Não foi possível acessar esse link.');
    }

    if (!response.ok) {
      throw new BadRequestException(
        `Não foi possível acessar esse link (HTTP ${response.status}).`,
      );
    }

    const html = await response.text();
    const text = htmlToText(html);

    if (!text) {
      throw new BadRequestException(
        'Não encontrei texto legível nessa página.',
      );
    }

    return truncate(text, MAX_CONTENT_CHARS);
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|br|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function truncate(text: string, maxChars: number): string {
  return text.length > maxChars ? `${text.slice(0, maxChars)}...` : text;
}
