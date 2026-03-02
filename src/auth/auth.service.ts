import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new UnauthorizedException('Login yoki parol noto\'g\'ri');
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('Login yoki parol noto\'g\'ri');
    return user;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    const payload = { sub: user.id, role: user.role };
    const token = await this.jwtService.signAsync(payload);
    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        username: user.username,
        role: user.role,
        branchId: user.branchId,
        createdAt: user.createdAt,
      },
    };
  }
}
