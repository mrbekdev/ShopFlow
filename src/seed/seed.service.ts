import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Default shop
    const shop = await this.prisma.shop.upsert({
      where: { id: 'default-shop-id' },
      update: {},
      create: {
        id: 'default-shop-id',
        name: "Asosiy Do'kon",
        address: 'Toshkent',
        phone: '+998901234567',
      },
    });

    // Default branch
    const branch = await this.prisma.branch.upsert({
      where: { id: 'default-branch-id' },
      update: { shopId: shop.id },
      create: {
        id: 'default-branch-id',
        name: 'Asosiy filial',
        address: 'Toshkent',
        shopId: shop.id,
      },
    });

    // Default admin user
    const adminUsername = 'admin';
    const existingAdmin = await this.prisma.user.findUnique({ where: { username: adminUsername } });
    if (!existingAdmin) {
      const hashed = await bcrypt.hash('admin123', 10);
      await this.prisma.user.create({
        data: {
          fullName: 'Admin',
          phone: '+000000000',
          username: adminUsername,
          password: hashed,
          role: 'admin',
          shopId: shop.id,
          branchId: branch.id,
        },
      });
    }

    // Default bigAdmin user
    const bigAdminUsername = 'bigadmin';
    const existingBigAdmin = await this.prisma.user.findUnique({ where: { username: bigAdminUsername } });
    if (!existingBigAdmin) {
      const hashed = await bcrypt.hash('admin123', 10);
      await this.prisma.user.create({
        data: {
          fullName: 'Sizning Ismingiz',
          phone: '+998901234567',
          username: bigAdminUsername,
          password: hashed,
          role: 'bigAdmin',
        },
      });
    }
  }

}
