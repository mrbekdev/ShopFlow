import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateNonvoyProductDto {
  expenses: number;
  totalCost: number;
  productName: string;
  model: string;
  outputQuantity: number;
  sellPrice: number;
  branchId: string;
  createdBy: string;
}

@Injectable()
export class NonvoyService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(branchId?: string) {
    return this.prisma.nonvoyProduct.findMany({
      where: branchId ? { branchId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateNonvoyProductDto) {
    return this.prisma.$transaction(async (tx) => {
      const client = tx as any;
      const nonvoy = await client.nonvoyProduct.create({ data });

      // Also add to regular products for selling
      await client.product.create({
        data: {
          name: data.productName,
          model: data.model,
          unit: 'dona',
          barcode: 'NV-' + Date.now().toString(36),
          costPrice: data.totalCost / data.outputQuantity,
          sellPrice: data.sellPrice,
          quantity: data.outputQuantity,
          branchId: data.branchId,
        },
      });

      return nonvoy;
    });
  }
}
