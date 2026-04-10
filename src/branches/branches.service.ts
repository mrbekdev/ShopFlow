  import { BranchType, Prisma } from '@prisma/client';
  import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(shopId?: string) {
    return this.prisma.branch.findMany({
      where: {
        ...(shopId ? { shopId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: { name: string; address?: string; shopId: string; type?: BranchType }) {
    if (data.type === BranchType.NONVOY) {
      const shop = await this.prisma.shop.findUnique({ where: { id: data.shopId } });
      if (!shop?.hasBakery) {
        throw new BadRequestException("Ushbu do'konda nonvoyxona ochishga ruxsat yo'q");
      }
    }
    return this.prisma.branch.create({ data });
  }

  async update(id: string, shopId: string, data: { name?: string; address?: string; type?: BranchType }) {
    const branch = await this.prisma.branch.findFirst({ where: { id, shopId } });
    if (!branch) {
      throw new NotFoundException('Filial topilmadi');
    }

    if (data.type === BranchType.NONVOY && branch.type !== BranchType.NONVOY) {
      const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop?.hasBakery) {
        throw new BadRequestException("Ushbu do'konda nonvoyxona ruxsati yo'q");
      }
    }

    return this.prisma.branch.update({ where: { id }, data });
  }

  async remove(id: string, shopId: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id, shopId } });
    if (!branch) {
      throw new NotFoundException('Filial topilmadi');
    }
    
    try {
      // Use transaction to handle cascading delete
      await this.prisma.$transaction(async (tx) => {
        // Delete related records first
        await tx.productHistory.deleteMany({ where: { product: { branchId: id } } });
        await tx.saleItem.deleteMany({ where: { sale: { branchId: id } } });
        await tx.debtPayment.deleteMany({ where: { debt: { branchId: id } } });
        await tx.debt.deleteMany({ where: { branchId: id } });
        await tx.productReturn.deleteMany({ where: { branchId: id } });
        await tx.sale.deleteMany({ where: { branchId: id } });
        await tx.product.deleteMany({ where: { branchId: id } });
        await tx.productionMaterial.deleteMany({ where: { production: { branchId: id } } });
        await tx.productionRecord.deleteMany({ where: { branchId: id } });
        await tx.nonvoyProduct.deleteMany({ where: { branchId: id } });
        await tx.non.deleteMany({ where: { branchId: id } });
        await tx.branchTransfer.deleteMany({ where: { OR: [{ fromBranchId: id }, { toBranchId: id }] } });
        
        // Set users branchId to null
        await tx.user.updateMany({ where: { branchId: id }, data: { branchId: null } });
        
        // Finally delete the branch
        await tx.branch.delete({ where: { id } });
      });
      
      return { success: true, message: "Filial o'chirildi" };
    } catch (error) {
      console.error('Branch delete error:', error);
      throw new Error(`Filial o'chirishda xatolik: ${error.message}`);
    }
  }
}
