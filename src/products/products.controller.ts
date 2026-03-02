import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Unit } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';

class CreateProductDto {
  name: string;
  model: string;
  unit: Unit;
  barcode: string;
  costPrice: number;
  sellPrice: number;
  quantity: number;
  branchId: string;
}

class UpdateProductDto {
  name?: string;
  model?: string;
  unit?: Unit;
  barcode?: string;
  costPrice?: number;
  sellPrice?: number;
  quantity?: number;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query('branchId') branchId?: string,
    @Query('barcode') barcode?: string,
  ) {
    return this.productsService.findAll(branchId, barcode);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @UploadedFile() file: Express.Multer.File,
    @Query('branchId') branchId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Fayl yuborilmadi');
    }
    if (!branchId) {
      throw new BadRequestException('branchId talab qilinadi');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const data: CreateProductDto[] = rows.map((row) => {
      const unitRaw = (row.Unit ?? row.unit ?? 'dona').toString().toLowerCase();
      const unit: Unit = unitRaw === 'kg' ? 'kg' : 'dona';

      const record: CreateProductDto = {
        name: row.Name ?? row.name ?? '',
        model: row.Model ?? row.model ?? '',
        unit,
        barcode: String(row.Barcode ?? row.barcode ?? ''),
        costPrice: Number(row.CostPrice ?? row.costPrice ?? 0),
        sellPrice: Number(row.SellPrice ?? row.sellPrice ?? 0),
        quantity: Number(row.Quantity ?? row.quantity ?? 0),
        branchId,
      };

      return record;
    }).filter(r => r.name && r.barcode);

    if (!data.length) {
      throw new BadRequestException('Yaroqli mahsulot qatorlari topilmadi');
    }

    return this.productsService.importMany(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
