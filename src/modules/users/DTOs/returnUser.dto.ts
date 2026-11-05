import { IsString } from 'class-validator';

export class ReturnUserDTO {
  @IsString()
  id_user!: string;
  @IsString()
  email!: string;
  @IsString()
  name!: string;
}
