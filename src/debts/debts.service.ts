import { Injectable, NotFoundException } from '@nestjs/common';

import { PaymentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DebtsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(branchId?: string) {
    return this.prisma.debt.findMany({
      where: branchId ? { branchId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  getPayments(debtId: string) {
    return this.prisma.debtPayment.findMany({
      where: { debtId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addPayment(debtId: string, amount: number, paymentType: PaymentType) {
    return this.prisma.$transaction(async (tx) => {
      const client = tx as any;
      const debt = await client.debt.findUnique({ where: { id: debtId } });
      if (!debt) throw new NotFoundException('Qarz topilmadi');

      const payment = await client.debtPayment.create({
        data: { debtId, amount, paymentType },
      });

      await client.debt.update({
        where: { id: debtId },
        data: {
          paidAmount: { increment: amount },
          remaining: { decrement: amount },
        },
      });

      return payment;
    });
  }
}
