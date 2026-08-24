import { Body, Controller, Delete, Get, Patch, Post, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDTO } from './DTOs/createUser.dto';
import { ReturnUserDTO } from './DTOs/returnUser.dto';
import { UpdateUserDTO } from './DTOs/updateUser.dto';

@Controller('users')
export class usersController {
  constructor(private readonly service: UsersService) {}

  @Post()
  async createUser(@Body() data: CreateUserDTO) {
   const user = await this.service.createUser(data);
   return user ? 'Usuário criado com sucesso' : 'Erro ao criar usuário';
  }

  @Get()
  async findUserByEmail(@Query('email') email: string): Promise<ReturnUserDTO | null>  {
    const user = await this.service.findUserByEmail(email)
    return user ? {id_user: user.id_user, email: user.email, name: user.name} : null;
  }
  
  @Get('id')
  async findUserById(@Query('id_user') id_user: string): Promise<ReturnUserDTO | null> {
    const user = await this.service.findUserById(id_user);
    return user ? {id_user: user.id_user, email: user.email, name: user.name} : null;
  }

  @Delete('id')
  async deleteUser(@Query('id_user') id_user: string) {
    return this.service.deleteUser(id_user);
  }
 
  @Patch('update')
  async updateUser(@Query('id_user') id_user: string, @Body() data: UpdateUserDTO) {

    return this.service.updateUser(id_user, data);
  }
}
