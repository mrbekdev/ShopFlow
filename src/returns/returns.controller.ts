import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { RefundType } from '@prisma/client';

class CreateReturnDto {
  saleId?: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
  refundAmount: number;
  refundType: RefundType;
  branchId: string;
  sellerId: string;
}

@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) { }

  @Get()
  findAll(
    @Query('branchId') branchId?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    return this.returnsService.findAll(branchId, sellerId);
  }

  @Post()
  create(@Body() dto: CreateReturnDto) {
    return this.returnsService.create(dto);
  }
}
