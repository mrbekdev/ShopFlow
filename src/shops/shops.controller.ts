import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('shops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.bigAdmin)
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  findAll() {
    return this.shopsService.findAll();
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopsService.findOne(id);
  }

  @Post()
  create(@Body() dto: { name: string; phone?: string; address?: string; hasBakery?: boolean; subscriptionStart?: Date; subscriptionEnd?: Date }) {
    if (dto.subscriptionStart) dto.subscriptionStart = new Date(dto.subscriptionStart);
    if (dto.subscriptionEnd) dto.subscriptionEnd = new Date(dto.subscriptionEnd);
    return this.shopsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: { name?: string; phone?: string; address?: string; hasBakery?: boolean; subscriptionStart?: Date; subscriptionEnd?: Date }) {
    if (dto.subscriptionStart) dto.subscriptionStart = new Date(dto.subscriptionStart);
    if (dto.subscriptionEnd) dto.subscriptionEnd = new Date(dto.subscriptionEnd);
    return this.shopsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shopsService.remove(id);
  }
}
