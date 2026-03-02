import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Default branch
    let branch = await this.prisma.branch.findFirst();
    if (!branch) {
      branch = await this.prisma.branch.create({
        data: {
          name: 'Asosiy filial',
          address: 'Toshkent',
        },
      });
    }

    // Default admin user
    const adminUsername = 'admin';
    const existingAdmin = await this.prisma.user.findUnique({ where: { username: adminUsername } });
    if (!existingAdmin) {
      const hashed = await bcrypt.hash('admin123', 10);
      await this.prisma.user.create({
        data: {
          fullName: 'Admin',
          phone: '+998901234567',
          username: adminUsername,
          password: hashed,
          role: 'admin',
          branchId: branch.id,
        },
      });
    }
  }
}
