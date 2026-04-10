import { 
  Controller, 
  Post, 
  UploadedFile, 
  UseInterceptors, 
  Body, 
  BadRequestException,
  UseGuards,
  Request 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiProductsService, AiDetectedProduct } from './ai-products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// DTO for bulk product creation
class BulkCreateProductDto {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

class BulkCreateRequestDto {
  products: BulkCreateProductDto[];
  branchId?: string;
}

@Controller('ai-products')
@UseGuards(JwtAuthGuard)
export class AiProductsController {
  constructor(private readonly aiProductsService: AiProductsService) {}

  @Post('analyze')
  @UseInterceptors(FileInterceptor('image'))
  async analyzeImage(
    @Request() req,
    @UploadedFile() image: Express.Multer.File,
  ) {
    if (!image) {
      throw new BadRequestException('Rasm yuborilmadi');
    }

    try {
      const products = await this.aiProductsService.analyzeImage(image, req.user);
      return {
        success: true,
        data: products,
        message: `${products.length} ta mahsulot topildi`
      };
    } catch (error) {
      throw new BadRequestException(
        `Rasmni analiz qilishda xatolik: ${error.message}`
      );
    }
  }

  @Post('bulk-create')
  async bulkCreate(
    @Request() req,
    @Body() dto: BulkCreateRequestDto,
  ) {
    if (!dto.products || dto.products.length === 0) {
      throw new BadRequestException('Mahsulotlar ro\'yxati bo\'sh');
    }

    // Validate user
    if (!req.user) {
      throw new BadRequestException('Foydalanuvchi autentifikatsiyadan o\'tmagan');
    }

    // JWT strategy returns { userId, role, shopId } — use userId not id
    const userId = req.user.userId || req.user.id;
    const shopId = req.user.shopId;

    if (!userId) {
      throw new BadRequestException('Foydalanuvchi ID topilmadi');
    }
    if (!shopId) {
      throw new BadRequestException('Shop ID topilmadi');
    }

    try {
      const result = await this.aiProductsService.bulkCreateProducts(
        dto.products,
        userId,
        shopId,
        dto.branchId || undefined
      );
      
      return {
        success: true,
        data: result,
        message: `${result.created} ta mahsulot muvaffaqiyatli yaratildi`
      };
    } catch (error) {
      throw new BadRequestException(
        `Mahsulotlarni yaratishda xatolik: ${error.message}`
      );
    }
  }
}
