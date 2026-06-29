import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const id = "1a600acf-0de7-4973-896a-255330f57ef3";
  const shopId = "default-shop-id";
  const userId = "baa9fa7c-415b-45d7-a01e-00083e8a96eb"; // kassir user id

  const updateData: any = {
    name: "Mahsulot nomi (updated)",
    model: "Modeli",
    unit: "dona",
    barcode: "12345678",
    code: "1001",
    costPrice: 5000,
    sellPrice: 8000,
    price: 7000,
    quantity: 10,
    branchId: "e382a79b-cf31-48b3-b801-8160475b44c0",
  };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const oldProduct = await tx.product.findFirst({ where: { id, shopId } });
      if (!oldProduct) {
        console.log("oldProduct not found");
        return;
      }
      console.log("Found oldProduct:", oldProduct);

      const product = await tx.product.update({
        where: { id },
        data: {
          ...updateData,
          code: updateData.code === "" ? null : updateData.code
        }
      });
      console.log("Updated product successfully:", product);
      return product;
    });
  } catch (error) {
    console.error("Prisma transaction error:", error);
  }
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
