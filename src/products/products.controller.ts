import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors, BadRequestException, UseGuards, Request } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Unit } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class CreateProductDto {
  name: string;
  model: string;
  unit: Unit;
  barcode?: string;
  code?: string;
  costPrice: number;
  sellPrice: number;
  price: number;
  quantity: number;
  branchId: string;
  userId: string;
  shopId: string;
}

class BatchCreateProductDto {
  name: string;
  description?: string;
  price: number;
  category?: string;
  unit: Unit;
  barcode?: string;
  minQuantity?: number;
  stock: number;
  isActive: boolean;
}

class BatchCreateRequestDto {
  products: BatchCreateProductDto[];
}

class UpdateProductDto {
  name?: string;
  model?: string;
  unit?: Unit;
  barcode?: string;
  code?: string;
  costPrice?: number;
  sellPrice?: number;
  price?: number;
  quantity?: number;
  userId: string;
  shopId: string;
}

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get('bulk')
  getBulk() {
    return { message: 'Bulk endpoint' };
  }

  @Delete('bulk')
  deleteMany(@Request() req, @Body() body: { ids: string[], userId: string, shopId?: string }) {
    const shopId = req.user.role === 'bigAdmin' ? body.shopId : req.user.shopId;
    return this.productsService.deleteMany(body.ids, body.userId, shopId!);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req, @Query('shopId') queryShopId?: string) {
    const shopId = req.user.role === 'bigAdmin' ? queryShopId : req.user.shopId;
    return this.productsService.findOne(id, shopId!);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string, @Request() req, @Query('shopId') queryShopId?: string) {
    const shopId = req.user.role === 'bigAdmin' ? queryShopId : req.user.shopId;
    return this.productsService.getHistory(id, shopId!);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('shopId') shopId?: string,
    @Query('branchId') branchId?: string,
    @Query('barcode') barcode?: string,
  ) {
    const effectiveShopId = req.user.role === 'bigAdmin' ? shopId : req.user.shopId;
    return this.productsService.findAll(effectiveShopId!, branchId, barcode);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateProductDto) {
    console.log('Backend received quantity:', dto.quantity, 'type:', typeof dto.quantity);
    const shopId = req.user.role === 'bigAdmin' ? dto.shopId : req.user.shopId;
    return this.productsService.create({ ...dto, shopId: shopId! });
  }

  @Post('analyze-image')
  @UseInterceptors(FileInterceptor('image'))
  async analyzeImage(@Request() req, @UploadedFile() image: Express.Multer.File) {
    if (!image) {
      throw new BadRequestException('Rasm yuborilmadi');
    }

    const shopId = req.user.shopId;
    const userId = req.user.id;
    
    return this.productsService.analyzeImage(image, userId, shopId);
  }

  @Post('batch')
  async createBatch(@Request() req, @Body() dto: BatchCreateRequestDto) {
    const shopId = req.user.shopId;
    const userId = req.user.id;
    
    // Get default branch for the shop
    const defaultBranch = await this.productsService.getDefaultBranch(shopId);
    
    return this.productsService.createBatch(dto.products, userId, shopId, defaultBranch.id);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @Request() req,
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
      const shopId = req.user.role === 'bigAdmin' ? (row.shopId || req.query.shopId) : req.user.shopId;

      const record: CreateProductDto = {
        name: row.Name ?? row.name ?? '',
        model: row.Model ?? row.model ?? '',
        unit,
        barcode: String(row.Barcode ?? row.barcode ?? ''),
        code: String(row.Code ?? row.code ?? ''),
        costPrice: Number(row.CostPrice ?? row.costPrice ?? 0),
        sellPrice: Number(row.SellPrice ?? row.sellPrice ?? 0),
        price: Number(row.Price ?? row.price ?? 0),
        quantity: Number(row.Quantity ?? row.quantity ?? 0),
        branchId,
        userId,
        shopId: shopId!,
      };

      if (!record.code) delete record.code;

      return record;
    }).filter(r => r.name);

    if (!data.length) {
      throw new BadRequestException('Yaroqli mahsulot qatorlari topilmadi');
    }

    return this.productsService.importMany(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Request() req, @Body() dto: UpdateProductDto) {
    const shopId = req.user.role === 'bigAdmin' ? dto.shopId : req.user.shopId;
    return this.productsService.update(id, { ...dto, shopId: shopId! });
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req, @Query('userId') userId: string, @Query('shopId') queryShopId?: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    const shopId = req.user.role === 'bigAdmin' ? queryShopId : req.user.shopId;
    return this.productsService.remove(id, userId, shopId!);
  }
}
