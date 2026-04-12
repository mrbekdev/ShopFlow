import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Unit } from '@prisma/client';

interface CreateProductDto {
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

function generateBarcode(): string {
  let barcode = '';
  for (let i = 0; i < 13; i++) {
    barcode += Math.floor(Math.random() * 10).toString();
  }
  return barcode;
}

interface UpdateProductDto {
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

interface BatchCreateProductDto {
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

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) { }

  findAll(shopId: string, branchId?: string, barcode?: string) {
    return this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        shopId,
        ...(branchId ? { branchId } : {}),
        ...(barcode ? { barcode } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getHistory(productId: string, shopId: string) {
    return this.prisma.productHistory.findMany({
      where: {
        productId,
        product: { shopId }
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, shopId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, shopId },
    });
    if (!product) {
      throw new NotFoundException('Mahsulot topilmadi');
    }
    return product;
  }

  async importMany(rows: CreateProductDto[]) {
    if (!rows.length) {
      return { count: 0 };
    }

    return this.prisma.$transaction(async (tx) => {
      let count = 0;
      for (const row of rows) {
        const { userId, ...productData } = row;

        // Auto-generate barcode if not provided
        if (!productData.barcode) {
          let newBarcode: string;
          do {
            newBarcode = generateBarcode();
          } while (await tx.product.findFirst({
            where: { barcode: newBarcode, shopId: productData.shopId }
          }));
          productData.barcode = newBarcode;
        }

        // Check if product with this barcode or code exists
        const existingProduct = await tx.product.findFirst({
          where: {
            OR: [
              { barcode: productData.barcode },
              ...(productData.code ? [{ code: productData.code }] : [])
            ],
            branchId: productData.branchId,
            shopId: productData.shopId
          }
        });

        if (existingProduct) {
          const isDeleted = existingProduct.status === 'DELETED';
          const newQuantity = isDeleted ? productData.quantity : existingProduct.quantity + productData.quantity;

          await tx.product.update({
            where: { id: existingProduct.id },
            data: {
              quantity: newQuantity,
              status: 'ACTIVE' // Reactivate if it was deleted
            }
          });

          await tx.productHistory.create({
            data: {
              productId: existingProduct.id,
              userId,
              action: 'UPDATE', // Or maybe 'IMPORT_ADD'
              changes: JSON.stringify({
                reason: isDeleted ? "O'chirilgan mahsulot yangidan faollashtirildi" : "Import qilinganda miqdor qo'shildi",
                addedAmount: productData.quantity,
                oldAmount: existingProduct.quantity,
                newAmount: newQuantity
              }),
            },
          });
          count++;
        } else {
          // Create new
          const newProduct = await tx.product.create({ data: productData as any });
          await tx.productHistory.create({
            data: {
              productId: newProduct.id,
              userId,
              action: 'CREATE',
              changes: JSON.stringify(productData),
            },
          });
          count++;
        }
      }

      return { count };
    });
  }

  async create(data: CreateProductDto) {
    console.log('Service received quantity:', data.quantity, 'type:', typeof data.quantity);
    return this.prisma.$transaction(async (tx) => {
      const { userId, ...productData } = data;
      console.log('Product data before save:', productData);

      // Auto-generate barcode if not provided
      if (!productData.barcode) {
        let newBarcode: string;
        do {
          newBarcode = generateBarcode();
        } while (await tx.product.findFirst({
          where: { barcode: newBarcode, shopId: productData.shopId }
        }));
        productData.barcode = newBarcode;
      }

      // Check if product with this barcode or code exists in the same branch
      const existingProduct = await tx.product.findFirst({
        where: {
          OR: [
            { barcode: productData.barcode },
            ...(productData.code ? [{ code: productData.code }] : [])
          ],
          branchId: productData.branchId,
          shopId: productData.shopId,
        },
      });

      if (existingProduct) {
        const isDeleted = existingProduct.status === 'DELETED';
        const newQuantity = isDeleted ? productData.quantity : existingProduct.quantity + productData.quantity;

        const updatedProduct = await tx.product.update({
          where: { id: existingProduct.id },
          data: {
            quantity: newQuantity,
            status: 'ACTIVE' // Reactivate if it was 'DELETED'
          },
        });

        await tx.productHistory.create({
          data: {
            productId: updatedProduct.id,
            userId,
            action: 'UPDATE',
            changes: JSON.stringify({
              reason: isDeleted ? "O'chirilgan mahsulot yangidan faollashtirildi" : "Shtrix kod bir xil bo'lgani uchun soni qo'shildi",
              addedQuantity: productData.quantity,
              oldQuantity: existingProduct.quantity,
              newQuantity: newQuantity
            }),
          },
        });

        return updatedProduct;
      }

      // If no existing product, create a new one
      const product = await tx.product.create({ data: productData as any });

      await tx.productHistory.create({
        data: {
          productId: product.id,
          userId,
          action: 'CREATE',
          changes: JSON.stringify(productData),
        },
      });

      return product;
    });
  }

  async update(id: string, data: UpdateProductDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const { userId, shopId, ...updateData } = data;

        const oldProduct = await tx.product.findFirst({ where: { id, shopId } });
        if (!oldProduct) throw new NotFoundException('Mahsulot topilmadi');

        const product = await tx.product.update({ 
          where: { id }, 
          data: {
            ...updateData,
            code: updateData.code === "" ? null : updateData.code
          } 
        });

        await tx.productHistory.create({
          data: {
            productId: product.id,
            userId,
            action: 'UPDATE',
            changes: JSON.stringify(updateData),
          },
        });

        return product;
      });
    } catch {
      throw new NotFoundException('Mahsulot topilmadi');
    }
  }

  async remove(id: string, userId: string, shopId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Find product first to ensure it belongs to the shop
        const oldProduct = await tx.product.findFirst({ where: { id, shopId } });
        if (!oldProduct) throw new NotFoundException('Mahsulot topilmadi');

        // Use soft delete by updating status to 'DELETED'
        const product = await tx.product.update({
          where: { id },
          data: { status: 'DELETED' }
        });

        await tx.productHistory.create({
          data: {
            productId: id,
            userId,
            action: 'DELETE',
            changes: JSON.stringify({ status: 'DELETED' }),
          },
        });

        return { success: true };
      });
    } catch (e) {
      console.error('Delete error:', e);
      throw new NotFoundException('Mahsulot topilmadi yoki o\'chirib bo\'lmadi');
    }
  }

  async deleteMany(ids: string[], userId: string, shopId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Filter ids to ensure they belong to the shop
      const validProducts = await tx.product.findMany({
        where: { id: { in: ids }, shopId },
        select: { id: true }
      });
      const validIds = validProducts.map(p => p.id);

      const result = await tx.product.updateMany({
        where: { id: { in: validIds } },
        data: { status: 'DELETED' },
      });

      for (const id of validIds) {
        await tx.productHistory.create({
          data: {
            productId: id,
            userId,
            action: 'DELETE',
            changes: JSON.stringify({ status: 'DELETED' }),
          },
        });
      }

      return { count: result.count };
    });
  }

  async getDefaultBranch(shopId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { shopId },
      orderBy: { createdAt: 'asc' }
    });

    if (!branch) {
      throw new NotFoundException('Shop uchun filial topilmadi');
    }

    return branch;
  }

  async analyzeImage(image: Express.Multer.File, userId: string, shopId: string) {
    // Convert image to base64
    const base64Image = image.buffer.toString('base64');
    const mimeType = image.mimetype;

    // Call Gemini API
    const geminiResponse = await this.callGeminiAPI(base64Image, mimeType);

    // Parse the response and return product list
    return this.parseGeminiResponse(geminiResponse);
  }

  private async callGeminiAPI(base64Image: string, mimeType: string): Promise<string> {
    const apiKey = "AIzaSyCjMTpOPFOqRi1Gmg7PZrZPye31hskrntI";
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=AIzaSyBMc6rf37eqGkcsPCjEJj72YCVVa499Vmg`;

    const prompt = `Bu rasmni ko'rib, agar bir nechta mahsulot bo'lsa, ularni alohida-alohida aniqlang. Har bir mahsulot uchun quyidagi formatda ma'lumot bering:

MAHSULOT 1:
MAHSULOT NOMI: [mahsulot nomi]
NARXI: [narx (so'mda)]
MIJDORI: [miqdor]

MAHSULOT 2:
MAHSULOT NOMI: [mahsulot nomi]
NARXI: [narx (so'mda)]
MIJDORI: [miqdor]

Va hokazo...

Agar faqat bitta mahsulot bo'lsa, "MAHSULOT 1:" deb yozing.
Iltimos, faqat shu formatda javob bering, qo'shimcha izohlarsiz.`;

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

        return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'AI javob bermadi.';

      } catch (error) {
        console.error('Gemini API call error:', error);
        
        if (error.message && error.message.includes('503')) {
          console.warn(`Service Unavailable (503), retry in 10s...`);
          await new Promise(res => setTimeout(res, 10000));
        } else if (error.message && error.message.includes('high demand')) {
          console.warn(`High demand error, retry in 15s...`);
          await new Promise(res => setTimeout(res, 15000));
        } else {
          await new Promise(res => setTimeout(res, 5000));
        }
        
        attempt++;
      }
    }

    throw new Error('Gemini API bilan bog\'lanib bo\'lmadi. Iltimos keyinroq urinib ko\'ring.');
  }

  private parseGeminiResponse(aiResponse: string): { id: number; name?: string; price?: string; quantity?: string }[] {
    const products: { id: number; name?: string; price?: string; quantity?: string }[] = [];
    const lines = aiResponse.split('\n');
    let currentProduct: { name?: string; price?: string; quantity?: string } = {};
    let productIndex = 0;

    lines.forEach(line => {
      if (line.includes('MAHSULOT') && line.includes(':')) {
        if (Object.keys(currentProduct).length > 0) {
          products.push({ ...currentProduct, id: productIndex });
          productIndex++;
        }
        currentProduct = {};
      } else if (line.includes('MAHSULOT NOMI:')) {
        currentProduct.name = line.split(':')[1]?.trim();
      } else if (line.includes('NARXI:')) {
        currentProduct.price = line.split(':')[1]?.trim();
      } else if (line.includes('MIJDORI:')) {
        currentProduct.quantity = line.split(':')[1]?.trim();
      }
    });

    // Add last product
    if (Object.keys(currentProduct).length > 0) {
      products.push({ ...currentProduct, id: productIndex });
    }

    return products;
  }

  async createBatch(products: BatchCreateProductDto[], userId: string, shopId: string, branchId: string) {
    if (!products.length) {
      return { created: 0, products: [] };
    }

    return this.prisma.$transaction(async (tx) => {
      const createdProducts: any[] = [];
      
      for (const productData of products) {
        // Convert AI product data to database format
        const dbProductData: CreateProductDto = {
          name: productData.name,
          model: productData.description || '',
          unit: productData.unit,
          barcode: productData.barcode || '',
          costPrice: productData.price * 0.8, // Assume 80% of selling price
          sellPrice: productData.price,
          price: productData.price,
          quantity: productData.stock,
          branchId,
          userId,
          shopId
        };

        // Auto-generate barcode if not provided
        if (!dbProductData.barcode) {
          let newBarcode: string;
          do {
            newBarcode = generateBarcode();
          } while (await tx.product.findFirst({
            where: { barcode: newBarcode, shopId }
          }));
          dbProductData.barcode = newBarcode;
        }

        // Check if product with this barcode exists in the branch
        const existingProduct = await tx.product.findFirst({
          where: {
            barcode: dbProductData.barcode,
            branchId,
            shopId
          }
        });

        if (existingProduct) {
          // Update existing product quantity
          const newQuantity = existingProduct.quantity + dbProductData.quantity;
          const updatedProduct = await tx.product.update({
            where: { id: existingProduct.id },
            data: {
              quantity: newQuantity,
              status: productData.isActive ? 'ACTIVE' : 'DELETED'
            }
          });

          await tx.productHistory.create({
            data: {
              productId: updatedProduct.id,
              userId,
              action: 'UPDATE',
              changes: JSON.stringify({
                reason: 'AI tomonidan aniqlangan mahsulot qo\'shildi',
                addedQuantity: dbProductData.quantity,
                oldQuantity: existingProduct.quantity,
                newQuantity
              }),
            },
          });

          createdProducts.push(updatedProduct);
        } else {
          // Create new product
          const newProduct = await tx.product.create({ 
            data: {
              name: dbProductData.name,
              model: dbProductData.model,
              unit: dbProductData.unit,
              barcode: dbProductData.barcode,
              costPrice: dbProductData.costPrice,
              sellPrice: dbProductData.sellPrice,
              price: dbProductData.price,
              quantity: dbProductData.quantity,
              branchId: dbProductData.branchId,
              shopId: dbProductData.shopId,
              status: productData.isActive ? 'ACTIVE' : 'DELETED'
            } 
          });

          await tx.productHistory.create({
            data: {
              productId: newProduct.id,
              userId,
              action: 'CREATE',
              changes: JSON.stringify({
                source: 'AI Product Creation',
                ...dbProductData
              }),
            },
          });

          createdProducts.push(newProduct);
        }
      }

      return { 
        created: createdProducts.length, 
        products: createdProducts 
      };
    });
  }
}
