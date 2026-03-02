import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

interface CreateUserDto {
  fullName: string;
  phone: string;
  username: string;
  password: string;
  role: UserRole;
  branchId: string;
}

interface UpdateUserDto {
  fullName?: string;
  phone?: string;
  username?: string;
  password?: string;
  role?: UserRole;
  branchId?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(data: CreateUserDto) {
    const hashed = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashed,
      },
    });
  }

  async update(id: string, data: UpdateUserDto) {
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    try {
      return await this.prisma.user.update({ where: { id }, data: updateData });
    } catch {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.user.delete({ where: { id } });
      return { success: true };
    } catch {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }
  }
}
