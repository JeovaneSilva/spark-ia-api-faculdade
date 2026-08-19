# spark-ia-api

API do Spark IA: plataforma de estudos para o ENEM, com módulo de flashcards, banco de questões e um chatbot que gera questões modelo ENEM a partir do conteúdo que o aluno quer estudar.

## Stack

- NestJS (TypeScript) + Prisma ORM + PostgreSQL
- Autenticação via `@nestjs/jwt`

## Comandos

```bash
npm install
npm run start:dev      # dev com watch
npm run test            # unit
npm run test:e2e        # e2e
npx prisma migrate dev  # aplicar migration a partir do schema.prisma
```

## Arquitetura

Controller → Service → Repository. Organização por módulo em `src/modules/<feature>/` (ex.: `auth`, `users`).

## Convenções do banco (Prisma)

Definidas em `prisma/schema.prisma` a partir do model `User` — sigam o padrão em qualquer entidade nova:

- PK: `id_<entidade> String @id @default(uuid(7))` (UUID v7, não Integer)
- Campos em inglês, camelCase (`name`, `email`, não `nome`, `senha`)
- Datas: `DateTime`, nunca `Date`
- Timestamps padrão: `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
- Tabelas mapeadas para snake_case plural via `@@map("...")`
- Enums para conjuntos fechados de domínio (ex.: disciplinas do ENEM), texto livre só quando o valor é realmente variável (ex.: tema/assunto)
- Evitar contadores/dados duplicados quando dá pra derivar por relação (ex.: não guardar "quantidade de questões respondidas" se existe a tabela de tentativas para agregar)

## Domínio

- `Question`: banco de questões, tanto oficiais do ENEM (`type = ENEM_OFFICIAL`) quanto geradas pelo chatbot (`type = CHATBOT_GENERATED`, com `id_chatbot_session` apontando para a sessão que a gerou)
- `Flashcard` / `FlashcardReview`: cartões de estudo e histórico de revisão
- `QuestionAttempt`: tentativa de resposta de um usuário a uma questão, opcionalmente vinculada a uma `StudySession`
- `ChatbotSession`: sessão de geração de questões pelo chatbot
- `StudySession`: sessão de estudo (banco de questões, chatbot ou flashcards)

## Antes de mudar o schema ou a arquitetura

Este projeto ainda não tem pasta `docs/` com ADRs formais — decisões de modelagem e arquitetura ficam registradas aqui neste arquivo por enquanto. Ao propor uma mudança de convenção (tipo de PK, nomenclatura, etc.), verifique primeiro o que já está em `prisma/schema.prisma` e nas migrations em `prisma/migrations/` antes de sugerir algo novo.