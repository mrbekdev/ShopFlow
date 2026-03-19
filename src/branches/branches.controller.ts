import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class CreateBranchDto {
  name: string;
  address?: string;
  type?: BranchType;
  shopId: string;
}

class UpdateBranchDto {
  name?: string;
  address?: string;
  type?: BranchType;
  shopId: string;
}

@Controller('branches')
@UseGuards(JwtAuthGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) { }

  @Get()
  findAll(@Request() req, @Query('shopId') shopId?: string) {
    const effectiveShopId = req.user.role === 'bigAdmin' ? shopId : req.user.shopId;
    return this.branchesService.findAll(effectiveShopId);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateBranchDto) {
    const shopId = req.user.role === 'bigAdmin' ? dto.shopId : req.user.shopId;
    return this.branchesService.create({ ...dto, shopId: shopId! });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Request() req, @Body() dto: UpdateBranchDto) {
    const shopId = req.user.role === 'bigAdmin' ? dto.shopId : req.user.shopId;
    return this.branchesService.update(id, shopId!, dto as any);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req, @Query('shopId') shopId?: string) {
    const effectiveShopId = req.user.role === 'bigAdmin' ? shopId : req.user.shopId;
    return this.branchesService.remove(id, effectiveShopId!);
  }
}
