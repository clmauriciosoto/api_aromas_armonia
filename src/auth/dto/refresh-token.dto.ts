import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'refresh_token must be a string' })
  @IsNotEmpty({ message: 'refresh_token is required' })
  refresh_token: string;
}
