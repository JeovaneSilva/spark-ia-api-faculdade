import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, ChatbotModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
