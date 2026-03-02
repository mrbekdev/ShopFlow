import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TransfersService } from './transfers.service';

class CreateTransferDto {
  productId: string;
  productName: string;
  quantity: number;
  fromBranchId: string;
  toBranchId: string;
  transferredBy: string;
}

@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    return this.transfersService.findAll(branchId);
  }

  @Post()
  create(@Body() dto: CreateTransferDto) {
    return this.transfersService.create(dto);
  }
}
