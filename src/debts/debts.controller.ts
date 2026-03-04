import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { PaymentType } from '@prisma/client';

class AddDebtPaymentDto {
  amount: number;
  paymentType: PaymentType;
}

@Controller('debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    return this.debtsService.findAll(branchId);
  }

  @Get(':id/payments')
  getPayments(@Param('id') id: string) {
    return this.debtsService.getPayments(id);
  }

  @Get('old-payments')
  getOldPayments(@Query('branchId') branchId?: string) {
    return this.debtsService.getOldPayments(branchId);
  }

  @Get('prepayments')
  getPrepayments(@Query('branchId') branchId?: string) {
    return this.debtsService.getPrepayments(branchId);
  }

  @Get('prepayment-amounts')
  getPrepaymentAmounts(@Query('branchId') branchId?: string) {
    return this.debtsService.getPrepaymentAmounts(branchId);
  }

  @Post(':id/payments')
  addPayment(@Param('id') id: string, @Body() dto: AddDebtPaymentDto) {
    return this.debtsService.addPayment(id, dto.amount, dto.paymentType);
  }
}
