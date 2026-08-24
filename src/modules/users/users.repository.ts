import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDTO } from './DTOs/createUser.dto';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: CreateUserDTO) {
    return this.prisma.user.create({
      data: data,
    });
  }

  async createFromGoogle(email:string, name:string) {
    return this.prisma.user.create({
      data: {
        email,
        name,
        password: null,
      },
    });
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email: email },
    });
  }

  async findUserById(id_user: string) {
    return this.prisma.user.findUnique({
      where: { id_user: id_user },
    });
  }

  async deleteUser(id_user: string) {
    return this.prisma.user.delete({
      where: { id_user: id_user },
    });
  }

  async updateUser(id_user: string, data: Partial<CreateUserDTO>) {
    return this.prisma.user.update({
      where: { id_user: id_user },
      data: data,
    });
  }
}
