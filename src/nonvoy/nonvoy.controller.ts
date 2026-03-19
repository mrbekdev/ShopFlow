import { Body, Controller, Get, Post, Query, UseGuards, Request } from '@nestjs/common';
import { NonvoyService } from './nonvoy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class ProductionMaterialDto {
  productId: string;
  productName: string;
  quantity: number;
}

class CreateProductionDto {
  branchId: string;
  createdBy: string;
  finishedNonId: string;
  finishedProductName: string;
  outputQuantity: number;
  expenses?: number;
  materials: ProductionMaterialDto[];
}

@Controller('nonvoy-products')
@UseGuards(JwtAuthGuard)
export class NonvoyController {
  constructor(private readonly nonvoyService: NonvoyService) { }

  @Get()
  findAll(@Request() req, @Query('branchId') branchId?: string) {
    return this.nonvoyService.findAll(req.user.shopId, branchId);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateProductionDto) {
    return this.nonvoyService.create({ ...dto, shopId: req.user.shopId });
  }
}

