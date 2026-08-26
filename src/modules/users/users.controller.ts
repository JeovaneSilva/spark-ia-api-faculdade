import { Body, Controller, Delete, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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

  @UseGuards(AuthGuard('jwt'))
  @Get('id')
  async findUserById(@Query('id_user') id_user: string): Promise<ReturnUserDTO | null> {
    const user = await this.service.findUserById(id_user);
    return user ? {id_user: user.id_user, email: user.email, name: user.name} : null;
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('id')
  async deleteUser(@Query('id_user') id_user: string) {
    return this.service.deleteUser(id_user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('update')
  async updateUser(@Query('id_user') id_user: string, @Body() data: UpdateUserDTO) {

    return this.service.updateUser(id_user, data);
  }
}
