import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateTransferDto {
  productId: string;
  productName: string;
  quantity: number;
  fromBranchId: string;
  toBranchId: string;
  transferredBy: string;
}

@Injectable()
export class TransfersService {
  constructor(private readonly prisma: PrismaService) { }

  findAll(branchId?: string) {
    return this.prisma.branchTransfer.findMany({
      where: branchId
        ? {
          OR: [{ fromBranchId: branchId }, { toBranchId: branchId }],
        }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateTransferDto) {
    return this.prisma.$transaction(async (tx) => {
      // Create the transfer record
      const transfer = await tx.branchTransfer.create({
        data: {
          productId: data.productId,
          productName: data.productName,
          quantity: data.quantity,
          fromBranchId: data.fromBranchId,
          toBranchId: data.toBranchId,
          transferredBy: data.transferredBy,
        }
      });

      // Decrease from branch product stock
      const fromProduct = await tx.product.findUnique({ where: { id: data.productId } });
      if (!fromProduct || fromProduct.quantity < data.quantity) {
        throw new Error("Yetarli mahsulot yo'q yoki mahsulot topilmadi");
      }

      const updatedFromProduct = await tx.product.update({
        where: { id: data.productId },
        data: { quantity: { decrement: data.quantity } },
      });

      // Log history for sender branch
      await tx.productHistory.create({
        data: {
          productId: updatedFromProduct.id,
          userId: data.transferredBy,
          action: 'UPDATE',
          changes: JSON.stringify({
            reason: "Boshqa filialga o'tkazildi",
            deductedAmount: data.quantity,
            oldAmount: fromProduct.quantity,
            newAmount: updatedFromProduct.quantity,
          }),
        },
      });

      // Check if product exists in destination branch by BARCODE
      let toProduct = await tx.product.findFirst({
        where: { barcode: fromProduct.barcode, branchId: data.toBranchId },
      });

      if (toProduct) {
        // If it exists in destination branch, just increment quantity
        // Also check if it was 'DELETED', if so, reactivate it optionally.
        const isDeleted = toProduct.status === 'DELETED';
        const newQuantity = isDeleted ? data.quantity : toProduct.quantity + data.quantity;

        const updatedToProduct = await tx.product.update({
          where: { id: toProduct.id },
          data: {
            quantity: newQuantity,
            status: 'ACTIVE'
          },
        });

        // Log history for receiver branch (existing product)
        await tx.productHistory.create({
          data: {
            productId: updatedToProduct.id,
            userId: data.transferredBy,
            action: 'UPDATE',
            changes: JSON.stringify({
              reason: "Boshqa filialdan o'tkazildi",
              addedAmount: data.quantity,
              oldAmount: isDeleted ? 0 : toProduct.quantity,
              newAmount: newQuantity,
            }),
          },
        });
      } else {
        // If it does not exist in destination branch, create a brand new product exactly the same
        toProduct = await tx.product.create({
          data: {
            name: fromProduct.name,
            model: fromProduct.model,
            unit: fromProduct.unit,
            barcode: fromProduct.barcode, // Exact same barcode so they match globally
            costPrice: fromProduct.costPrice,
            sellPrice: fromProduct.sellPrice,
            price: fromProduct.price,
            quantity: data.quantity,
            type: fromProduct.type, // Preserve product type (MATERIAL or PRODUCT)
            status: 'ACTIVE',
            branchId: data.toBranchId,
          },
        });

        // Log history for receiver branch (new product)
        await tx.productHistory.create({
          data: {
            productId: toProduct.id,
            userId: data.transferredBy,
            action: 'CREATE',
            changes: JSON.stringify({
              reason: "Boshqa filialdan yangi mahsulot o'tkazildi",
              ...toProduct
            }),
          },
        });
      }

      return transfer;
    });
  }
}
