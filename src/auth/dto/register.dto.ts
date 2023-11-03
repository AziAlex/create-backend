import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString({ message: 'Password must be a string' })
    @MinLength(6)
    @MaxLength(20)
    password: string;
}
