import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NonService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(shopId: string, branchId?: string) {
    return this.prisma.non.findMany({
      where: {
        shopId,
        ...(branchId ? { branchId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.non.findUnique({ where: { id } });
  }

  create(data: any) {
    return this.prisma.non.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.non.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.non.delete({ where: { id } });
  }

  bulkDelete(ids: string[]) {
    return this.prisma.non.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
