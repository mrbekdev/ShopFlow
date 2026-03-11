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
  finishedNonId: string;
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
          finishedNonId: data.finishedNonId,
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

      // 3. Increment finished product (Non)
      await tx.non.update({
        where: { id: data.finishedNonId },
        data: { quantity: { increment: data.outputQuantity } },
      });

      await tx.productHistory.create({
        data: {
          productId: data.materials[0]?.productId || '', // Fallback if no materials
          userId: data.createdBy,
          action: 'PRODUCTION_ADD',
          changes: JSON.stringify({ reason: `Ishlab chiqarish orqali ${data.outputQuantity} ta ${data.finishedProductName} qo'shildi` }),
        },
      });

      return production;
    });
  }
}
