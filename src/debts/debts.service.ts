import { Injectable, NotFoundException } from '@nestjs/common';

import { PaymentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DebtsService {
  constructor(private readonly prisma: PrismaService) { }

  findAll(branchId?: string, sellerId?: string) {
    return this.prisma.debt.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        ...(sellerId ? { sellerId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getPayments(debtId: string) {
    return this.prisma.debtPayment.findMany({
      where: { debtId },
      orderBy: { createdAt: 'desc' },
    });
  }

  getOldPayments(branchId?: string, sellerId?: string) {
    return this.prisma.debtPayment.findMany({
      where: {
        debt: {
          ...(branchId ? { branchId } : {}),
          ...(sellerId ? { sellerId } : {}),
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getPrepayments(branchId?: string, sellerId?: string) {
    return this.prisma.debt.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        ...(sellerId ? { sellerId } : {}),
        paidAmount: {
          gt: 0, // Only debts with prepayments
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getPrepaymentAmounts(branchId?: string, sellerId?: string) {
    return this.prisma.debtPayment.findMany({
      where: {
        debt: {
          ...(branchId ? { branchId } : {}),
          ...(sellerId ? { sellerId } : {}),
        },
        isPrepayment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getRegularDebtPayments(branchId?: string, sellerId?: string) {
    return this.prisma.debtPayment.findMany({
      where: {
        debt: {
          ...(branchId ? { branchId } : {}),
          ...(sellerId ? { sellerId } : {}),
        },
        isPrepayment: false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addPayment(debtId: string, amount: number, paymentType: PaymentType) {
    return this.prisma.$transaction(async (tx) => {
      const client = tx as any;
      const debt = await client.debt.findUnique({ where: { id: debtId } });
      if (!debt) throw new NotFoundException('Qarz topilmadi');

      // Check if payment amount exceeds remaining debt
      if (amount > debt.remaining) {
        throw new Error(`To'lov summasi qolgan qarzdan katta bo'lishi mumkin emas. Qolgan qarz: ${debt.remaining} so'm`);
      }

      const payment = await client.debtPayment.create({
        data: {
          debtId,
          amount,
          paymentType,
          isPrepayment: false, // Regular payments are not prepayments
        },
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
