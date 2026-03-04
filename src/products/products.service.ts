import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Unit } from '@prisma/client';

interface CreateProductDto {
  name: string;
  model: string;
  unit: Unit;
  barcode: string;
  costPrice: number;
  sellPrice: number;
  price: number;
  quantity: number;
  branchId: string;
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
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

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

    const result = await this.prisma.product.createMany({
      data: rows,
      skipDuplicates: true,
    });

    return { count: result.count };
  }

  create(data: CreateProductDto) {
    return this.prisma.product.create({ data });
  }

  async update(id: string, data: UpdateProductDto) {
    try {
      return await this.prisma.product.update({ where: { id }, data });
    } catch {
      throw new NotFoundException('Mahsulot topilmadi');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.product.delete({ where: { id } });
      return { success: true };
    } catch {
      throw new NotFoundException('Mahsulot topilmadi');
    }
  }

  async deleteMany(ids: string[]) {
    const result = await this.prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { status: 'DELETED' },
    });
    return { count: result.count };
  }
}
