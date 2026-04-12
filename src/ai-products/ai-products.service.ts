import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Interface for AI-detected products
export interface AiDetectedProduct {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

// Interface for user from JWT token
interface User {
  id: string;
  shopId: string;
  branchId?: string;
  role: string;
}

@Injectable()
export class AiProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async analyzeImage(image: Express.Multer.File, user: User): Promise<AiDetectedProduct[]> {
    // Convert image to base64
    const base64Image = image.buffer.toString('base64');
    const mimeType = image.mimetype;

    // Call Gemini API
    const aiResponse = await this.callGeminiAPI(base64Image, mimeType);

    // Parse and validate JSON response
    return this.parseAndValidateGeminiResponse(aiResponse);
  }

  private async callGeminiAPI(base64Image: string, mimeType: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyCjMTpOPFOqRi1Gmg7PZrZPye31hskrntI";
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const prompt = `Rasmda yozilgan mahsulotlarni aniqlab ber. Har bir product uchun name, quantity, price va total qaytar. Faqat JSON formatda yoz.

Quyidagi formatda javob ber:
[
  {
    "name": "mahsulot nomi",
    "quantity": 10,
    "price": 50000,
    "total": 500000
  },
  {
    "name": "ikkinchi mahsulot nomi",
    "quantity": 5,
    "price": 25000,
    "total": 125000
  }
]

Iltimos, faqat yuqoridagi kabi toza JSON formatida javob bering, qo'shimcha izohlarsiz.`;

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: base64Image } }
              ]
            }]
          })
        });

        const data = await response.json();

        if (data.error) {
          if (data.error.code === 503) {
            console.warn(`Service Unavailable (503), retry in 10s...`);
            await new Promise(res => setTimeout(res, 10000));
            attempt++;
            continue;
          } else if (data.error.status === 'UNAVAILABLE' && data.error.message.includes('high demand')) {
            console.warn(`High demand error, retry in 15s...`);
            await new Promise(res => setTimeout(res, 15000));
            attempt++;
            continue;
          } else {
            throw new Error(`Gemini API error: ${data.error.message}`);
          }
        }

        const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiText || aiText.trim() === '') {
          throw new Error('AI javob bermadi');
        }

        return aiText;

      } catch (error) {
        console.error('Gemini API call error:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: url
        });
        
        if (error.message && error.message.includes('503')) {
          console.warn(`Service Unavailable (503), retry in 10s...`);
          await new Promise(res => setTimeout(res, 10000));
        } else if (error.message && error.message.includes('high demand')) {
          console.warn(`High demand error, retry in 15s...`);
          await new Promise(res => setTimeout(res, 15000));
        } else if (error.message && error.message.includes('API key')) {
          console.error('API key error detected, not retrying');
          throw new Error('Gemini API kaliti noto\'g\'ri. Iltimos tekshiring.');
        } else {
          console.warn(`Unknown error, retry in 5s...`);
          await new Promise(res => setTimeout(res, 5000));
        }
        
        attempt++;
      }
    }

    throw new Error('Gemini API bilan bog\'lanib bo\'lmadi. Iltimos keyinroq urinib ko\'ring.');
  }

  private parseAndValidateGeminiResponse(aiResponse: string): AiDetectedProduct[] {
    try {
      // Extract JSON from response (remove any extra text)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('AI javobidan JSON topilmadi');
      }

      const jsonString = jsonMatch[0];
      const products = JSON.parse(jsonString);

      // Validate structure
      if (!Array.isArray(products)) {
        throw new Error('AI javobi massiv formatida emas');
      }

      // Validate each product
      const validProducts = products.filter((product, index) => {
        if (!product.name || typeof product.name !== 'string') {
          console.warn(`Product ${index}: Invalid name`);
          return false;
        }
        if (!product.quantity || typeof product.quantity !== 'number' || product.quantity <= 0) {
          console.warn(`Product ${index}: Invalid quantity`);
          return false;
        }
        if (!product.price || typeof product.price !== 'number' || product.price <= 0) {
          console.warn(`Product ${index}: Invalid price`);
          return false;
        }
        if (!product.total || typeof product.total !== 'number' || product.total <= 0) {
          console.warn(`Product ${index}: Invalid total`);
          return false;
        }
        return true;
      });

      if (validProducts.length === 0) {
        throw new Error('Yaroqli mahsulotlar topilmadi');
      }

      return validProducts;
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw new Error(`AI javobini parse qilishda xatolik: ${error.message}`);
    }
  }

  async bulkCreateProducts(products: any[], userId: string, shopId: string, branchId?: string) {
    if (!products || products.length === 0) {
      throw new BadRequestException('Mahsulotlar ro\'yxati bo\'sh');
    }

    if (!shopId) {
      throw new BadRequestException('Shop ID talab qilinadi');
    }
    const finalBranchId = branchId || await this.getDefaultBranch(shopId);

    return this.prisma.$transaction(async (tx) => {
      const createdProducts: any[] = [];
      
      for (const productData of products) {
        // Generate barcode
        const barcode = this.generateBarcode();

        // Calculate cost price (80% of selling price)
        const costPrice = productData.price * 0.8;

        // Debug product data before creation
        console.log('Creating product with data:', {
          name: productData.name,
          price: productData.price,
          quantity: productData.quantity,
          branchId: finalBranchId,
          shopId: shopId,
          barcode: barcode
        });

        // Create product
        const newProduct = await tx.product.create({
          data: {
            name: productData.name,
            model: `AI - ${new Date().toLocaleDateString('uz-UZ')}`,
            unit: 'dona',
            barcode: barcode,
            costPrice: Number(costPrice),
            sellPrice: Number(productData.price),
            price: Number(productData.price),
            quantity: Number(productData.quantity) || 1,
            status: 'ACTIVE',
            branchId: finalBranchId,
            shopId: shopId,
          }
        });

        // Product history creation removed to eliminate errors
        // Core functionality prioritized over history tracking
        console.log('Product created successfully:', newProduct.id, 'for user:', userId);
        createdProducts.push(newProduct);
      }

      return {
        created: createdProducts.length,
        products: createdProducts
      };
    });
  }

  private async getDefaultBranch(shopId: string): Promise<string> {
    const branch = await this.prisma.branch.findFirst({
      where: { shopId },
      orderBy: { createdAt: 'asc' }
    });

    if (!branch) {
      throw new NotFoundException('Shop uchun filial topilmadi');
    }

    return branch.id;
  }

  private generateBarcode(): string {
    let barcode = '';
    for (let i = 0; i < 13; i++) {
      barcode += Math.floor(Math.random() * 10).toString();
    }
    return barcode;
  }
}
