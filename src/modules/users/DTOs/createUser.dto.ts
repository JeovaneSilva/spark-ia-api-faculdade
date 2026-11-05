import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;
  @IsString()
  @IsEmail()
  email!: string;
  @IsString()
  @MinLength(8)
  password!: string;
}
