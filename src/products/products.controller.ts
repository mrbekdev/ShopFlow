import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Unit } from '@prisma/client';

class CreateProductDto {
  name: string;
  model: string;
  unit: Unit;
  barcode: string;
  costPrice: number;
  sellPrice: number;
  quantity: number;
  branchId: string;
}

class UpdateProductDto {
  name?: string;
  model?: string;
  unit?: Unit;
  barcode?: string;
  costPrice?: number;
  sellPrice?: number;
  quantity?: number;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    return this.productsService.findAll(branchId);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
