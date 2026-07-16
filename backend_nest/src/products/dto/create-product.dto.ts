import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Price in cents (matches the Product.price column)
  @IsInt()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  salePrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;
}
