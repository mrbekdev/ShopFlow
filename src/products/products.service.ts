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
  quantity?: number;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(branchId?: string) {
    return this.prisma.product.findMany({
      where: branchId ? { branchId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
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
}
