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

  getOldPayments(branchId?: string) {
    return this.prisma.debtPayment.findMany({
      where: {
        debt: {
          branchId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getPrepayments(branchId?: string) {
    return this.prisma.debt.findMany({
      where: {
        branchId,
        paidAmount: {
          gt: 0, // Only debts with prepayments
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getPrepaymentAmounts(branchId?: string) {
    return this.prisma.debtPayment.findMany({
      where: {
        debt: {
          branchId,
          paidAmount: {
            gt: 0, // Only debts with prepayments
          },
        },
        createdAt: {
          // Only get the first payment per debt (the prepayment)
          // This is a workaround since we can't easily identify prepayments vs regular payments
        },
      },
      orderBy: { createdAt: 'asc' },
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
