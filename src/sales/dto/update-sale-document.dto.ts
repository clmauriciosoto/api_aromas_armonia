import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateSaleDocumentDto {
  @ApiPropertyOptional({
    description:
      'Número de documento (ej. boleta SII). Único, no secuencial. Enviar null para eliminarlo.',
    example: 1234567,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  documentNumber?: number | null;
}
