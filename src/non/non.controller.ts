import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { NonService } from './non.service';

@Controller('non')
export class NonController {
  constructor(private readonly nonService: NonService) {}

  @Get()
  findAll(@Query('branchId') branchId?: string) {
    return this.nonService.findAll(branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.nonService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.nonService.create(data);
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
