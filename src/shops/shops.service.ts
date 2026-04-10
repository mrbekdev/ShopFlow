import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.shop.findMany({
      include: { _count: { select: { branches: true, users: true } } }
    });
  }

  findOne(id: string) {
    return this.prisma.shop.findUnique({
      where: { id },
      include: { _count: { select: { branches: true, users: true } } }
    });
  }

  create(data: { name: string; phone?: string; address?: string; hasBakery?: boolean; subscriptionStart?: Date; subscriptionEnd?: Date }) {
    return this.prisma.shop.create({ data });
  }

  update(id: string, data: { name?: string; phone?: string; address?: string; hasBakery?: boolean; subscriptionStart?: Date; subscriptionEnd?: Date }) {
    return this.prisma.shop.update({ where: { id }, data });
  }

  async remove(id: string) {
    try {
      // Use transaction to handle cascading delete
      await this.prisma.$transaction(async (tx) => {
        // Delete related records first
        await tx.productHistory.deleteMany({ where: { product: { shopId: id } } });
        await tx.saleItem.deleteMany({ where: { sale: { shopId: id } } });
        await tx.debtPayment.deleteMany({ where: { debt: { shopId: id } } });
        await tx.debt.deleteMany({ where: { shopId: id } });
        await tx.productReturn.deleteMany({ where: { shopId: id } });
        await tx.sale.deleteMany({ where: { shopId: id } });
        await tx.product.deleteMany({ where: { shopId: id } });
        await tx.productionMaterial.deleteMany({ where: { production: { shopId: id } } });
        await tx.productionRecord.deleteMany({ where: { shopId: id } });
        await tx.nonvoyProduct.deleteMany({ where: { shopId: id } });
        await tx.non.deleteMany({ where: { shopId: id } });
        await tx.branchTransfer.deleteMany({ where: { shopId: id } });
        await tx.user.deleteMany({ where: { shopId: id } });
        await tx.branch.deleteMany({ where: { shopId: id } });
        
        // Finally delete the shop
        await tx.shop.delete({ where: { id } });
      });
      
      return { success: true, message: "Do'kon o'chirildi" };
    } catch (error) {
      console.error('Shop delete error:', error);
      throw new Error(`Do'kon o'chirishda xatolik: ${error.message}`);
    }
  }
}
