import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

const toInt = ({ value }: { value: unknown }): unknown => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return Number(value);
};

export class GetPublicProductsQueryDto {
  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
