import { Body, Controller, Get, Post, Query, UseGuards, Request } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { RefundType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
  shopId?: string;
}

@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) { }

  @Get()
  findAll(
    @Request() req,
    @Query('shopId') shopId?: string,
    @Query('branchId') branchId?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    const effectiveShopId = req.user.role === 'bigAdmin' ? shopId : req.user.shopId;
    return this.returnsService.findAll(effectiveShopId!, branchId, sellerId);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateReturnDto) {
    const shopId = req.user.role === 'bigAdmin' ? dto.shopId : req.user.shopId;
    return this.returnsService.create({ ...dto, shopId: shopId! } as any);
  }
}

