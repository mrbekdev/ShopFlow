import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { NonvoyService } from './nonvoy.service';

class ProductionMaterialDto {
  productId: string;
  productName: string;
  quantity: number;
}

class CreateProductionDto {
  branchId: string;
  createdBy: string;
  finishedProductId: string;
  finishedProductName: string;
  outputQuantity: number;
  expenses?: number;
  materials: ProductionMaterialDto[];
}

@Controller('nonvoy-products')
export class NonvoyController {
  constructor(private readonly nonvoyService: NonvoyService) { }

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    return this.nonvoyService.findAll(branchId);
  }

  @Post()
  create(@Body() dto: CreateProductionDto) {
    return this.nonvoyService.create(dto);
  }
}
