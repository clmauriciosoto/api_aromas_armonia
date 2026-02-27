import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

/**
 * DTO for admin login request
 * Validates email and password format
 */
export class LoginDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
