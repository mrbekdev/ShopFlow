import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentType, UserRole } from '@prisma/client';

interface SaleItemInput {
  productId?: string;
  nonId?: string;
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
  shopId: string;
}

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) { }

  findAll(shopId: string, branchId?: string, sellerId?: string) {
    return this.prisma.sale.findMany({
      where: {
        shopId,
        ...(branchId ? { branchId } : {}),
        ...(sellerId ? { sellerId } : {}),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }
  async getStats(shopId: string, branchId?: string, dateFrom?: string, dateTo?: string) {
    // Build date filter
    const dateFilter: any = {};
    if (dateFrom) {
      dateFilter.gte = new Date(`${dateFrom}T00:00:00.000Z`);
    }
    if (dateTo) {
      dateFilter.lte = new Date(`${dateTo}T23:59:59.999Z`);
    }

    // Fetch sales with items and related products
    const sales = await this.prisma.sale.findMany({
      where: {
        shopId,
        ...(branchId ? { branchId } : {}),
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      },
      include: {
        items: {
          include: {
            product: true,
            non: true,
          },
        },
      },
    });

    let totalRevenue = 0;
    let totalCostPrice = 0;
    let totalItemsSold = 0;

    for (const sale of (sales as any[])) {
      for (const item of (sale as any).items) {
        const sellPrice = item.price;
        const productCost = (item as any).product?.costPrice || 0;
        const nonCost = (item as any).non?.costPrice || 0;
        const costPrice = item.productId ? productCost : nonCost;
        const qty = item.quantity;

        totalRevenue += sellPrice * qty;
        totalCostPrice += costPrice * qty;
        totalItemsSold += qty;
      }
    }

    const netProfit = totalRevenue - totalCostPrice;

    return {
      salesCount: sales.length,
      totalItemsSold,
      totalRevenue: Math.round(totalRevenue),
      totalCostPrice: Math.round(totalCostPrice),
      netProfit: Math.round(netProfit),
    };
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
          shopId: data.shopId,
          items: {
            create: data.items.map((i) => ({
              productId: i.productId,
              nonId: i.nonId,
              productName: i.productName,
              quantity: i.quantity,
              price: i.price,
              total: i.total,
            })),
          },
        },
        include: { items: true },
      });

      // Decrease quantities
      for (const item of data.items) {
        if (item.productId) {
          await client.product.update({
            where: { id: item.productId },
            data: { quantity: { decrement: item.quantity } },
          });
        } else if (item.nonId) {
          await client.non.update({
            where: { id: item.nonId },
            data: { quantity: { decrement: item.quantity } },
          });
        }
      }

      // Create debt if the sale is on credit
      if (data.paymentType === 'qarz') {
        const totalDebt = data.totalAmount;
        const paidAmount = data.prepayment || 0;
        const remaining = totalDebt - paidAmount;

        const debt = await client.debt.create({
          data: {
            saleId: sale.id,
            customerName: data.customerName!,
            customerPhone: data.customerPhone!,
            totalDebt: totalDebt,
            paidAmount: paidAmount,
            remaining: remaining,
            branchId: data.branchId,
            sellerId: data.sellerId,
            shopId: data.shopId,
          },
        });

        // Create payment record for prepayment if exists
        if (paidAmount > 0) {
          await client.debtPayment.create({
            data: {
              debtId: debt.id,
              amount: paidAmount,
              paymentType: data.prepaymentType || 'naqd',
              isPrepayment: true,
              sellerId: data.sellerId,
            },
          });
        }
      }

      return sale;
    });
  }
}
