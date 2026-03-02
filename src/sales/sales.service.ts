import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentType, UserRole } from '@prisma/client';

interface SaleItemInput {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

interface CreateSaleInput {
  items: SaleItemInput[];
  totalAmount: number;
  paymentType: PaymentType;
  cashAmount?: number;
  cardAmount?: number;
  terminalAmount?: number;
  debtAmount?: number;
  customerName?: string;
  customerPhone?: string;
  prepayment?: number;
  prepaymentType?: PaymentType;
  sellerId: string;
  sellerRole: UserRole;
  branchId: string;
}

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(branchId?: string, sellerId?: string) {
    return this.prisma.sale.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        ...(sellerId ? { sellerId } : {}),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateSaleInput) {
    return this.prisma.$transaction(async (tx) => {
      const client = tx as any;
      const sale = await client.sale.create({
        data: {
          totalAmount: data.totalAmount,
          paymentType: data.paymentType,
          cashAmount: data.cashAmount,
          cardAmount: data.cardAmount,
          terminalAmount: data.terminalAmount,
          debtAmount: data.debtAmount,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          prepayment: data.prepayment,
          prepaymentType: data.prepaymentType,
          sellerId: data.sellerId,
          sellerRole: data.sellerRole,
          branchId: data.branchId,
          items: {
            create: data.items.map((i) => ({
              productId: i.productId,
              productName: i.productName,
              quantity: i.quantity,
              price: i.price,
              total: i.total,
            })),
          },
        },
        include: { items: true },
      });

      // Decrease product quantities
      for (const item of data.items) {
        await client.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // Create debt if there is any remaining amount to be paid
      if (data.debtAmount && data.debtAmount > 0) {
        await client.debt.create({
          data: {
            saleId: sale.id,
            customerName: data.customerName!,
            customerPhone: data.customerPhone!,
            totalDebt: data.debtAmount,
            paidAmount: 0,
            remaining: data.debtAmount,
            branchId: data.branchId,
            sellerId: data.sellerId,
          },
        });
      }

      return sale;
    });
  }
}
