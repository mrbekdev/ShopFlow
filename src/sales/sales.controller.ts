import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { PaymentType, UserRole } from '@prisma/client';

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
}

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) { }

  @Get('stats')
  getStats(
    @Query('branchId') branchId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.salesService.getStats(branchId, dateFrom, dateTo);
  }

  @Get()
  findAll(
    @Query('branchId') branchId?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    return this.salesService.findAll(branchId, sellerId);
  }

  @Post()
  create(@Body() dto: CreateSaleDto) {
    return this.salesService.create(dto);
  }
}
