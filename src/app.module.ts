import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { FlashcardsModule } from './modules/flashcards/flashcards.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { StatsModule } from './modules/stats/stats.module';

@Module({
  imports: [
    // Limite geral por IP; rotas caras (IA) e de login têm limite próprio.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ChatbotModule,
    FlashcardsModule,
    QuestionsModule,
    UploadsModule,
    StatsModule,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
