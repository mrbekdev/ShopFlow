import { Body, Controller, Get, Request, Post, Query, UseGuards } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class CreateTransferDto {
  productId: string;
  productName: string;
  quantity: number;
  fromBranchId: string;
  toBranchId: string;
  transferredBy: string;
  shopId: string;
}

@Controller('transfers')
@UseGuards(JwtAuthGuard)
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Get()
  findAll(@Request() req, @Query('shopId') shopId?: string, @Query('branchId') branchId?: string) {
    const effectiveShopId = req.user.role === 'bigAdmin' ? shopId : req.user.shopId;
    return this.transfersService.findAll(effectiveShopId!, branchId);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateTransferDto) {
    const shopId = req.user.role === 'bigAdmin' ? dto.shopId : req.user.shopId;
    return this.transfersService.create({ ...dto, shopId: shopId! });
  }
}

