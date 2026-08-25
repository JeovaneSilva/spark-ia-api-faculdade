import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { FlashcardsModule } from './modules/flashcards/flashcards.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, ChatbotModule, FlashcardsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
