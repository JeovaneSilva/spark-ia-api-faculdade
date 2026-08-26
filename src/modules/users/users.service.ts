import { ConflictException, Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDTO } from './DTOs/createUser.dto';
import { ReturnUserDTO } from './DTOs/returnUser.dto';
import * as bcrypt from 'bcrypt';

export type User = any;

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async findUserByEmail(email: string){
    const user = await this.repository.findUserByEmail(email);

    return user
  }

  async createUser(data: CreateUserDTO) {
    const userExists = await this.findUserByEmail(data.email);
    if (userExists) {
      throw new ConflictException('Usuario já existe');
    }
    const hash = await bcrypt.hash(data.password, 10);
    return this.repository.createUser({...data, password: hash});
  }

  async findOrCreateFromGoogle(email:string, name:string) {
    const userExist = await this.findUserByEmail(email);
    if (!userExist) {
      const newUser = await this.repository.createFromGoogle(email, name);
      return newUser;
    }
    return userExist;
  }

  async findUserById(id_user: string): Promise<ReturnUserDTO | null> {
    const user = await this.repository.findUserById(id_user);
    return user ? {id_user: user.id_user, email: user.email, name: user.name} : null;
  }

  async deleteUser(id_user: string): Promise<ReturnUserDTO> {
    const user = await this.repository.deleteUser(id_user);
    // nunca devolver o hash da senha na resposta
    return { id_user: user.id_user, email: user.email, name: user.name };
  }

  async updateUser(id_user: string, data: Partial<CreateUserDTO>): Promise<ReturnUserDTO> {
    const password = data.password ? await bcrypt.hash(data.password, 10) : undefined;
    const updatedData = { ...data, password };
    const user = await this.repository.updateUser(id_user, updatedData);
    // nunca devolver o hash da senha na resposta
    return { id_user: user.id_user, email: user.email, name: user.name };
  }

}
