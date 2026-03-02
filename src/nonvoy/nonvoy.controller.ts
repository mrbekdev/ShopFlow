import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { NonvoyService } from './nonvoy.service';

class CreateNonvoyProductDto {
  expenses: number;
  totalCost: number;
  productName: string;
  model: string;
  outputQuantity: number;
  sellPrice: number;
  branchId: string;
  createdBy: string;
}

@Controller('nonvoy-products')
export class NonvoyController {
  constructor(private readonly nonvoyService: NonvoyService) {}

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    return this.nonvoyService.findAll(branchId);
  }

  @Post()
  create(@Body() dto: CreateNonvoyProductDto) {
    return this.nonvoyService.create(dto);
  }
}
