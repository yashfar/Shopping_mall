import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ProductsService } from './products.service';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ExportProductsQueryDto } from './dto/export-products-query.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: ListProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  // Must be declared before ':id' so it doesn't get swallowed by that route
  @Get('filters')
  getFilters() {
    return this.productsService.getFilters();
  }

  @Get('export/xlsx')
  async exportXlsx(
    @Query() query: ExportProductsQueryDto,
    @Res() response: Response,
  ) {
    const file = await this.productsService.exportXlsx(query);
    const date = new Date().toISOString().slice(0, 10);

    response.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="products-${date}.xlsx"`,
      'Content-Length': file.length,
    });
    response.send(file);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
  }
}
