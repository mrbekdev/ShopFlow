import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateTransferDto {
  productId: string;
  productName: string;
  quantity: number;
  fromBranchId: string;
  toBranchId: string;
  transferredBy: string;
}

@Injectable()
export class TransfersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(branchId?: string) {
    return this.prisma.branchTransfer.findMany({
      where: branchId
        ? {
            OR: [{ fromBranchId: branchId }, { toBranchId: branchId }],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateTransferDto) {
    return this.prisma.$transaction(async (tx) => {
      const client = tx as any;
      const transfer = await client.branchTransfer.create({ data });

      // Decrease from branch product stock
      const fromProduct = await client.product.findUnique({ where: { id: data.productId } });
      if (fromProduct) {
        await client.product.update({
          where: { id: data.productId },
          data: { quantity: { decrement: data.quantity } },
        });

        // Check if product exists in destination branch
        const toProduct = await client.product.findFirst({
          where: { name: fromProduct.name, branchId: data.toBranchId },
        });

        if (toProduct) {
          await client.product.update({
            where: { id: toProduct.id },
            data: { quantity: { increment: data.quantity } },
          });
        } else {
          await client.product.create({
            data: {
              name: fromProduct.name,
              model: fromProduct.model,
              unit: fromProduct.unit,
              barcode: fromProduct.barcode + '-' + Date.now().toString(36),
              costPrice: fromProduct.costPrice,
              sellPrice: fromProduct.sellPrice,
              quantity: data.quantity,
              branchId: data.toBranchId,
            },
          });
        }
      }

      return transfer;
    });
  }
}
