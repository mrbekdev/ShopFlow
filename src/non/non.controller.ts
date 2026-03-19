import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request } from '@nestjs/common';
import { NonService } from './non.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('non')
@UseGuards(JwtAuthGuard)
export class NonController {
  constructor(private readonly nonService: NonService) {}

  @Get()
  findAll(@Request() req, @Query('branchId') branchId?: string) {
    return this.nonService.findAll(req.user.shopId, branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.nonService.findOne(id);
  }

  @Post()
  create(@Request() req, @Body() data: any) {
    return this.nonService.create({ ...data, shopId: req.user.shopId });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.nonService.update(id, data);
  }

  @Delete('bulk')
  bulkDelete(@Body('ids') ids: string[]) {
    return this.nonService.bulkDelete(ids);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.nonService.remove(id);
  }
}

