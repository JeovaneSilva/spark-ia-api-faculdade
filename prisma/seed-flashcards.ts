// Cria flashcards pré-definidos para demonstração.
// Uso: npx tsx prisma/seed-flashcards.ts <email-do-usuario>
// Idempotente: não duplica cards (mesmo usuário + mesma pergunta).
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Subject } from '../src/generated/prisma/client';

const DEMO_FLASHCARDS: Array<{ subject: Subject; topic: string; question: string; answer: string }> = [
  { subject: Subject.MATEMATICA, topic: 'Geometria', question: 'Qual a fórmula da área de um círculo?', answer: 'A = π · r², em que r é o raio.' },
  { subject: Subject.MATEMATICA, topic: 'Porcentagem', question: 'Como calcular um aumento percentual de 20% sobre um valor V?', answer: 'V · 1,20 (fator de multiplicação = 1 + 20/100).' },
  { subject: Subject.FISICA, topic: 'Dinâmica', question: 'Qual a 2ª Lei de Newton?', answer: 'F = m · a: a força resultante é igual à massa vezes a aceleração.' },
  { subject: Subject.FISICA, topic: 'Eletrodinâmica', question: 'O que diz a 1ª Lei de Ohm?', answer: 'U = R · i: a tensão é igual à resistência vezes a corrente elétrica.' },
  { subject: Subject.QUIMICA, topic: 'Estequiometria', question: 'Quantas partículas há em 1 mol de uma substância?', answer: '6,02 × 10²³ (constante de Avogadro).' },
  { subject: Subject.QUIMICA, topic: 'Ácidos e bases', question: 'Qual o pH de uma solução neutra a 25 °C?', answer: 'pH = 7.' },
  { subject: Subject.BIOLOGIA, topic: 'Citologia', question: 'Qual organela é responsável pela respiração celular?', answer: 'A mitocôndria, que produz ATP.' },
  { subject: Subject.BIOLOGIA, topic: 'Genética', question: 'O que são alelos?', answer: 'Formas alternativas de um mesmo gene, localizadas no mesmo locus de cromossomos homólogos.' },
  { subject: Subject.HISTORIA, topic: 'Brasil República', question: 'Em que ano foi proclamada a República no Brasil?', answer: '1889, por um golpe militar liderado pelo Marechal Deodoro da Fonseca.' },
  { subject: Subject.HISTORIA, topic: 'Era Vargas', question: 'O que foi o Estado Novo?', answer: 'Regime autoritário de Getúlio Vargas (1937–1945), com censura, centralização do poder e Constituição de 1937.' },
  { subject: Subject.GEOGRAFIA, topic: 'Climatologia', question: 'Qual fenômeno aquece anormalmente as águas do Pacífico equatorial?', answer: 'El Niño.' },
  { subject: Subject.FILOSOFIA, topic: 'Filosofia política', question: 'Qual a ideia central do contrato social em Rousseau?', answer: 'A legitimidade do poder vem da vontade geral, um pacto entre os cidadãos.' },
  { subject: Subject.SOCIOLOGIA, topic: 'Clássicos', question: 'O que é "fato social" para Durkheim?', answer: 'Maneiras de agir, pensar e sentir exteriores ao indivíduo e dotadas de poder coercitivo.' },
  { subject: Subject.PORTUGUES, topic: 'Funções da linguagem', question: 'Qual função da linguagem tem foco no emissor?', answer: 'Função emotiva (ou expressiva), marcada pela 1ª pessoa e pela subjetividade.' },
  { subject: Subject.LITERATURA, topic: 'Modernismo', question: 'Qual obra inaugurou o Modernismo brasileiro em 1922?', answer: 'A Semana de Arte Moderna (SP) marca o início; "Pauliceia Desvairada", de Mário de Andrade, é de 1922.' },
  { subject: Subject.INGLES, topic: 'Gramática', question: 'Qual a diferença entre "since" e "for" no Present Perfect?', answer: '"Since" indica o ponto de partida (since 2020); "for" indica a duração (for three years).' },
  { subject: Subject.MATEMATICA, topic: 'Funções', question: 'Qual a fórmula de Bhaskara para ax² + bx + c = 0?', answer: 'x = (−b ± √Δ) / 2a, com Δ = b² − 4ac.' },
  { subject: Subject.MATEMATICA, topic: 'Probabilidade', question: 'Como se calcula a probabilidade de um evento?', answer: 'Casos favoráveis ÷ casos possíveis (com eventos igualmente prováveis).' },
  { subject: Subject.MATEMATICA, topic: 'Progressões', question: 'Qual o termo geral de uma PA?', answer: 'aₙ = a₁ + (n − 1) · r, em que r é a razão.' },
  { subject: Subject.MATEMATICA, topic: 'Estatística', question: 'Qual a diferença entre média, moda e mediana?', answer: 'Média: soma ÷ quantidade. Moda: valor mais frequente. Mediana: valor central dos dados ordenados.' },
  { subject: Subject.FISICA, topic: 'Cinemática', question: 'Qual a fórmula da velocidade média?', answer: 'vm = Δs / Δt (variação de posição dividida pelo intervalo de tempo).' },
  { subject: Subject.FISICA, topic: 'Energia', question: 'Qual a fórmula da energia cinética?', answer: 'Ec = m · v² / 2.' },
  { subject: Subject.FISICA, topic: 'Termologia', question: 'Quais são as três formas de propagação do calor?', answer: 'Condução, convecção e irradiação.' },
  { subject: Subject.FISICA, topic: 'Ondulatória', question: 'Qual a relação entre velocidade, frequência e comprimento de onda?', answer: 'v = λ · f.' },
  { subject: Subject.QUIMICA, topic: 'Ligações químicas', question: 'Qual a diferença entre ligação iônica e covalente?', answer: 'Iônica: transferência de elétrons (metal + não metal). Covalente: compartilhamento de elétrons (não metais).' },
  { subject: Subject.QUIMICA, topic: 'Tabela periódica', question: 'O que são os gases nobres e por que são pouco reativos?', answer: 'Elementos do grupo 18; têm a camada de valência completa (8 elétrons, ou 2 no hélio).' },
  { subject: Subject.QUIMICA, topic: 'Química orgânica', question: 'Qual o grupo funcional dos álcoois?', answer: 'Hidroxila (−OH) ligada a carbono saturado.' },
  { subject: Subject.QUIMICA, topic: 'Soluções', question: 'Como calcular a concentração comum de uma solução?', answer: 'C = massa do soluto (g) ÷ volume da solução (L).' },
  { subject: Subject.BIOLOGIA, topic: 'Ecologia', question: 'O que é uma cadeia alimentar e quem são os produtores?', answer: 'Sequência de transferência de energia entre seres vivos; produtores são os autótrofos (como plantas e algas), que fazem fotossíntese.' },
  { subject: Subject.BIOLOGIA, topic: 'Fisiologia', question: 'Qual a função dos glóbulos vermelhos (hemácias)?', answer: 'Transportar oxigênio pelo corpo, por meio da hemoglobina.' },
  { subject: Subject.BIOLOGIA, topic: 'Evolução', question: 'Qual a ideia central da seleção natural de Darwin?', answer: 'Indivíduos com características mais adaptadas ao ambiente tendem a sobreviver e se reproduzir mais.' },
  { subject: Subject.BIOLOGIA, topic: 'Fotossíntese', question: 'Qual a equação geral da fotossíntese?', answer: '6 CO₂ + 6 H₂O + luz → C₆H₁₂O₆ + 6 O₂.' },
  { subject: Subject.HISTORIA, topic: 'Brasil Colônia', question: 'Em que ano os portugueses chegaram ao Brasil?', answer: '1500, com a expedição de Pedro Álvares Cabral.' },
  { subject: Subject.HISTORIA, topic: 'Idade Contemporânea', question: 'Quais foram as principais causas da Revolução Francesa (1789)?', answer: 'Crise econômica, desigualdade entre os estados sociais e ideias iluministas contra o absolutismo.' },
  { subject: Subject.HISTORIA, topic: 'Segunda Guerra', question: 'Quando começou e terminou a Segunda Guerra Mundial?', answer: 'De 1939 (invasão da Polônia) a 1945.' },
  { subject: Subject.HISTORIA, topic: 'Ditadura militar', question: 'Qual ato institucional endureceu a ditadura militar em 1968?', answer: 'O AI-5, que ampliou a censura e a repressão.' },
  { subject: Subject.GEOGRAFIA, topic: 'Demografia', question: 'O que é urbanização?', answer: 'Crescimento da população urbana em relação à rural, geralmente ligado à industrialização.' },
  { subject: Subject.GEOGRAFIA, topic: 'Biomas', question: 'Qual é o maior bioma brasileiro?', answer: 'A Amazônia, que ocupa cerca de 49% do território.' },
  { subject: Subject.GEOGRAFIA, topic: 'Geopolítica', question: 'O que foi a Guerra Fria?', answer: 'Disputa ideológica e geopolítica entre EUA (capitalismo) e URSS (socialismo), sem confronto direto, de 1947 a 1991.' },
  { subject: Subject.FILOSOFIA, topic: 'Filosofia antiga', question: 'Qual o método de Sócrates?', answer: 'A maiêutica: fazer perguntas para levar o interlocutor a "dar à luz" o próprio conhecimento.' },
  { subject: Subject.FILOSOFIA, topic: 'Racionalismo', question: 'O que significa "Penso, logo existo"?', answer: 'Frase de Descartes: a dúvida sobre tudo prova a existência de quem pensa.' },
  { subject: Subject.SOCIOLOGIA, topic: 'Clássicos', question: 'O que é "mais-valia" para Karl Marx?', answer: 'A diferença entre o valor produzido pelo trabalhador e o salário que recebe, apropriada pelo capitalista.' },
  { subject: Subject.SOCIOLOGIA, topic: 'Cultura', question: 'O que é etnocentrismo?', answer: 'Julgar outras culturas pelos valores da própria, considerando-a superior.' },
  { subject: Subject.PORTUGUES, topic: 'Gramática', question: 'Qual a diferença entre "mal" e "mau"?', answer: '"Mal" é o oposto de bem (advérbio). "Mau" é o oposto de bom (adjetivo).' },
  { subject: Subject.LITERATURA, topic: 'Realismo', question: 'Quem escreveu "Dom Casmurro" e qual a dúvida central da obra?', answer: 'Machado de Assis; se Capitu traiu ou não Bentinho.' },
  { subject: Subject.INGLES, topic: 'Vocabulário', question: 'O que significa "although" e como se usa?', answer: '"Embora/apesar de que": introduz uma ideia de contraste (Although it rained, we went out).' },
];

async function main() {
  const email = process.argv[2];
  if (!email) {
    throw new Error('Informe o e-mail do usuário: npx tsx prisma/seed-flashcards.ts <email>');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error(`Usuário não encontrado: ${email}`);

    let created = 0;
    for (const card of DEMO_FLASHCARDS) {
      const exists = await prisma.flashcard.findFirst({
        where: { id_user: user.id_user, question: card.question },
        select: { id_flashcard: true },
      });
      if (exists) continue;
      await prisma.flashcard.create({ data: { ...card, id_user: user.id_user } });
      created++;
    }
    console.log(`${created} flashcards criados, ${DEMO_FLASHCARDS.length - created} já existiam.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
