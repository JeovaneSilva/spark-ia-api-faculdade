import { Body, Controller, Delete, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateUserDTO } from './DTOs/createUser.dto';
import { ReturnUserDTO } from './DTOs/returnUser.dto';
import { UpdateUserDTO } from './DTOs/updateUser.dto';

@Controller('users')
export class usersController {
  constructor(private readonly service: UsersService) {}

  // Cadastro — precisa ficar público, é assim que a conta é criada.
  @Post()
  async createUser(@Body() data: CreateUserDTO) {
   const user = await this.service.createUser(data);
   return user ? 'Usuário criado com sucesso' : 'Erro ao criar usuário';
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findUserByEmail(@Query('email') email: string): Promise<ReturnUserDTO | null>  {
    const user = await this.service.findUserByEmail(email)
    return user ? {id_user: user.id_user, email: user.email, name: user.name} : null;
  }

  // /me em vez de receber id_user por fora — só dá pra consultar/editar/
  // apagar a própria conta, o id vem do token, não do que o client manda.
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async findMe(@CurrentUser() user: AuthenticatedUser): Promise<ReturnUserDTO | null> {
    return this.service.findUserById(user.id_user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('me')
  async deleteMe(@CurrentUser() user: AuthenticatedUser) {
    return this.service.deleteUser(user.id_user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  async updateMe(@CurrentUser() user: AuthenticatedUser, @Body() data: UpdateUserDTO) {
    return this.service.updateUser(user.id_user, data);
  }
}
