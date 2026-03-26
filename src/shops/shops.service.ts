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

  remove(id: string) {
    return this.prisma.shop.delete({ where: { id } });
  }
}
