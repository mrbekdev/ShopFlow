import { Body, Controller, Get, Post, Query, UseGuards, Request } from '@nestjs/common';
import { SalesService } from './sales.service';
import { PaymentType, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class SaleItemDto {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

class CreateSaleDto {
  items: SaleItemDto[];
  totalAmount: number;
  paymentType: PaymentType;
  cashAmount?: number;
  cardAmount?: number;
  terminalAmount?: number;
  debtAmount?: number;
  customerName?: string;
  customerPhone?: string;
  prepayment?: number;
  prepaymentType?: PaymentType;
  sellerId: string;
  sellerRole: UserRole;
  branchId: string;
  shopId?: string;
}

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) { }

  @Get('stats')
  getStats(
    @Request() req,
    @Query('shopId') shopId?: string,
    @Query('branchId') branchId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const effectiveShopId = req.user.role === 'bigAdmin' ? shopId : req.user.shopId;
    return this.salesService.getStats(effectiveShopId!, branchId, dateFrom, dateTo);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('shopId') shopId?: string,
    @Query('branchId') branchId?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    const effectiveShopId = req.user.role === 'bigAdmin' ? shopId : req.user.shopId;
    return this.salesService.findAll(effectiveShopId!, branchId, sellerId);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateSaleDto) {
    const shopId = req.user.role === 'bigAdmin' ? dto.shopId : req.user.shopId;
    return this.salesService.create({ ...dto, shopId: shopId! });
  }
}

