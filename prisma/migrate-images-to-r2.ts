import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { PrismaClient } from '../src/generated/prisma/client';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

function guessExtension(url: string, contentType: string | null): string {
  if (contentType && EXTENSION_BY_CONTENT_TYPE[contentType]) {
    return EXTENSION_BY_CONTENT_TYPE[contentType];
  }
  const match = url.match(/\.([a-zA-Z0-9]{3,4})(?:\?|$)/);
  return match ? match[1].toLowerCase() : 'png';
}

async function migrateImage(url: string, key: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`  [pulado] ${url} -> HTTP ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type');
    const buffer = Buffer.from(await response.arrayBuffer());
    const extension = guessExtension(url, contentType);
    const finalKey = `${key}.${extension}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: finalKey,
        Body: buffer,
        ContentType: contentType || 'image/png',
      }),
    );

    return `${R2_PUBLIC_URL}/${finalKey}`;
  } catch (error) {
    console.warn(`  [erro] ${url}:`, (error as Error).message);
    return null;
  }
}

const OPTION_FIELDS = ['optionA', 'optionB', 'optionC', 'optionD', 'optionE'] as const;

async function main() {
  const isTestRun = process.argv.includes('--test');

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const questions = await prisma.question.findMany({
    where: {
      type: 'ENEM_OFFICIAL',
      OR: [
        { statementImage: { startsWith: 'http', not: { startsWith: R2_PUBLIC_URL } } },
        ...OPTION_FIELDS.map((field) => ({
          [field]: { startsWith: 'http', not: { startsWith: R2_PUBLIC_URL } },
        })),
      ],
    },
    orderBy: [{ examYear: 'asc' }, { examNumber: 'asc' }],
    take: isTestRun ? 1 : undefined,
  });

  console.log(`${questions.length} questões com imagem pendente de migração.`);

  let migratedImages = 0;
  let failedImages = 0;

  for (const question of questions) {
    const keyPrefix = `enem/${question.examYear}/${question.examNumber}`;
    const updateData: Record<string, string> = {};

    console.log(`ENEM ${question.examYear} questão ${question.examNumber}`);

    if (question.statementImage?.startsWith('http') && !question.statementImage.startsWith(R2_PUBLIC_URL)) {
      const newUrl = await migrateImage(question.statementImage, `${keyPrefix}/statement`);
      if (newUrl) {
        updateData.statementImage = newUrl;
        migratedImages++;
      } else {
        failedImages++;
      }
    }

    for (const field of OPTION_FIELDS) {
      const value = question[field];
      if (value.startsWith('http') && !value.startsWith(R2_PUBLIC_URL)) {
        const newUrl = await migrateImage(value, `${keyPrefix}/${field}`);
        if (newUrl) {
          updateData[field] = newUrl;
          migratedImages++;
        } else {
          failedImages++;
        }
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.question.update({
        where: { id_question: question.id_question },
        data: updateData,
      });
    }
  }

  console.log(`\nConcluído: ${migratedImages} imagens migradas, ${failedImages} falharam (mantiveram a URL original).`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
