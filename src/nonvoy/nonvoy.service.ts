import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ProductionMaterialDto {
  productId: string;
  productName: string;
  quantity: number;
}

interface CreateProductionDto {
  branchId: string;
  createdBy: string;
  finishedProductId: string;
  finishedProductName: string;
  outputQuantity: number;
  expenses?: number;
  materials: ProductionMaterialDto[];
}

@Injectable()
export class NonvoyService {
  constructor(private readonly prisma: PrismaService) { }

  findAll(branchId?: string) {
    return this.prisma.productionRecord.findMany({
      where: branchId ? { branchId } : undefined,
      include: {
        materials: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateProductionDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Production Record
      const production = await tx.productionRecord.create({
        data: {
          branchId: data.branchId,
          createdBy: data.createdBy,
          finishedProductId: data.finishedProductId,
          finishedProductName: data.finishedProductName,
          outputQuantity: data.outputQuantity,
          expenses: data.expenses,
          materials: {
            create: data.materials.map(m => ({
              productId: m.productId,
              productName: m.productName,
              quantity: m.quantity,
            })),
          },
        },
      });

      // 2. Deduct materials
      for (const m of data.materials) {
        await tx.product.update({
          where: { id: m.productId },
          data: { quantity: { decrement: m.quantity } },
        });

        await tx.productHistory.create({
          data: {
            productId: m.productId,
            userId: data.createdBy,
            action: 'PRODUCTION_DEDUCT',
            changes: JSON.stringify({ reason: `Ishlab chiqarish (ID: ${production.id}) uchun ${m.quantity} ta(kg) sarflandi` }),
          },
        });
      }

      // 3. Increment finished product
      await tx.product.update({
        where: { id: data.finishedProductId },
        data: { quantity: { increment: data.outputQuantity } },
      });

      await tx.productHistory.create({
        data: {
          productId: data.finishedProductId,
          userId: data.createdBy,
          action: 'PRODUCTION_ADD',
          changes: JSON.stringify({ reason: `Ishlab chiqarish orqali ${data.outputQuantity} qo'shildi` }),
        },
      });

      return production;
    });
  }
}
