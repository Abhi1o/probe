import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: ['USER', 'ADMIN', 'DEVELOPER'], default: 'USER' })
  @IsEnum(['USER', 'ADMIN', 'DEVELOPER'])
  @IsOptional()
  role?: string;
}
