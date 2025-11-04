export class CreateProductDto {
  name: string;
  shortDescription: string;
  description: string;
  discountPrice: number;
  price: number;
  image: string;
  attributesIds?: number[];
}
