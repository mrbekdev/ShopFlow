import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RefundType } from '@prisma/client';

interface CreateReturnDto {
  saleId?: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
  refundAmount: number;
  refundType: RefundType;
  branchId: string;
  sellerId: string;
}

@Injectable()
export class ReturnsService {
  constructor(private readonly prisma: PrismaService) { }

  findAll(branchId?: string, sellerId?: string) {
    return this.prisma.productReturn.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        ...(sellerId ? { sellerId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateReturnDto) {
    return this.prisma.$transaction(async (tx) => {
      const client = tx as any;
      const ret = await client.productReturn.create({ data });

      await client.product.update({
        where: { id: data.productId },
        data: { quantity: { increment: data.quantity } },
      });

      return ret;
    });
  }
}
