import { IsBoolean } from 'class-validator';

export class UpdateAdminStatusDto {
  @IsBoolean({ message: 'isActive must be a boolean value' })
  isActive!: boolean;
}
