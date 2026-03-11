import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Unit } from '@prisma/client';

interface CreateProductDto {
  name: string;
  model: string;
  unit: Unit;
  barcode?: string;
  costPrice: number;
  sellPrice: number;
  price: number;
  quantity: number;
  branchId: string;
  userId: string;
}

function generateBarcode(): string {
  // Generate a 13-digit numeric barcode (EAN-13 style)
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
  costPrice?: number;
  sellPrice?: number;
  price?: number;
  quantity?: number;
  userId: string;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) { }

  findAll(branchId?: string, barcode?: string) {
    return this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        ...(branchId ? { branchId } : {}),
        ...(barcode ? { barcode } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getHistory(productId: string) {
    return this.prisma.productHistory.findMany({
      where: { productId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
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
          } while (await tx.product.findFirst({ where: { barcode: newBarcode } }));
          productData.barcode = newBarcode;
        }

        // Check if product with this barcode exists in the branch
        const existingProduct = await tx.product.findFirst({
          where: {
            barcode: productData.barcode,
            branchId: productData.branchId
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
    return this.prisma.$transaction(async (tx) => {
      const { userId, ...productData } = data;

      // Auto-generate barcode if not provided
      if (!productData.barcode) {
        let newBarcode: string;
        do {
          newBarcode = generateBarcode();
        } while (await tx.product.findFirst({ where: { barcode: newBarcode } }));
        productData.barcode = newBarcode;
      }

      // Check if product with this barcode exists in the same branch
      const existingProduct = await tx.product.findFirst({
        where: {
          barcode: productData.barcode,
          branchId: productData.branchId,
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
        const { userId, ...updateData } = data;

        const oldProduct = await tx.product.findUnique({ where: { id } });
        if (!oldProduct) throw new NotFoundException('Mahsulot topilmadi');

        const product = await tx.product.update({ where: { id }, data: updateData });

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

  async remove(id: string, userId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
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

  async deleteMany(ids: string[], userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.product.updateMany({
        where: { id: { in: ids } },
        data: { status: 'DELETED' },
      });

      for (const id of ids) {
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
}
