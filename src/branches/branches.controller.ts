import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { BranchesService } from './branches.service';

class CreateBranchDto {
  name: string;
  address?: string;
}

class UpdateBranchDto {
  name?: string;
  address?: string;
}

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll() {
    return this.branchesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}
