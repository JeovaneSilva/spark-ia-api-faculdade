import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { LoginDTO } from "./DTOs/login.dto";

@Injectable()
export class AuthRepository {
    constructor(private readonly prisma: PrismaService) {}

    async signIn(email:string){
        const user = await this.prisma.user.findUnique({where: {email}});
        return user
    }
}