import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsXlsxSerializer } from './products-xlsx.serializer';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductsXlsxSerializer],
})
export class ProductsModule {}
