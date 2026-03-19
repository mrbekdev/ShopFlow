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
    await this.prisma.branch.delete({ where: { id } });
    return { success: true };
  }
}
