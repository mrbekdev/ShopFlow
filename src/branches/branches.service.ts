import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.branch.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(data: { name: string; address?: string }) {
    return this.prisma.branch.create({ data });
  }

  async update(id: string, data: { name?: string; address?: string }) {
    try {
      return await this.prisma.branch.update({ where: { id }, data });
    } catch {
      throw new NotFoundException('Filial topilmadi');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.branch.delete({ where: { id } });
      return { success: true };
    } catch {
      throw new NotFoundException('Filial topilmadi');
    }
  }
}
