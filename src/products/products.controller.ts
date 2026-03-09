import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Unit, ProductType } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';

class CreateProductDto {
  name: string;
  model: string;
  unit: Unit;
  barcode?: string;
  costPrice: number;
  sellPrice: number;
  price: number;
  quantity: number;
  type?: ProductType;
  branchId: string;
  userId: string;
}

class UpdateProductDto {
  name?: string;
  model?: string;
  unit?: Unit;
  barcode?: string;
  costPrice?: number;
  sellPrice?: number;
  price?: number;
  quantity?: number;
  type?: ProductType;
  userId: string;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get('bulk')
  getBulk() {
    return { message: 'Bulk endpoint' };
  }

  @Delete('bulk')
  deleteMany(@Body() body: { ids: string[], userId: string }) {
    return this.productsService.deleteMany(body.ids, body.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.productsService.getHistory(id);
  }

  @Get()
  findAll(
    @Query('branchId') branchId?: string,
    @Query('barcode') barcode?: string,
    @Query('type') type?: ProductType,
  ) {
    return this.productsService.findAll(branchId, barcode, type);
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
    @Query('userId') userId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Fayl yuborilmadi');
    }
    if (!branchId) {
      throw new BadRequestException('branchId talab qilinadi');
    }
    if (!userId) {
      throw new BadRequestException('userId talab qilinadi');
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
        price: Number(row.Price ?? row.price ?? 0),
        quantity: Number(row.Quantity ?? row.quantity ?? 0),
        type: (row.Type ?? row.type ?? 'PRODUCT').toString().toUpperCase() === 'MATERIAL' ? ProductType.MATERIAL : ProductType.PRODUCT,
        branchId,
        userId,
      };

      return record;
    }).filter(r => r.name);

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
  remove(@Param('id') id: string, @Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.productsService.remove(id, userId);
  }
}
