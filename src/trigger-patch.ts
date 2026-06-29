import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function main() {
  // Find a user and product to test
  const user = await prisma.user.findFirst({ where: { username: "kassir" } });
  const product = await prisma.product.findFirst({ where: { barcode: "12345678" } });

  if (!user || !product) {
    console.error("User or product not found in DB");
    return;
  }

  console.log("User:", user.username, "Role:", user.role, "ShopId:", user.shopId);
  console.log("Product:", product.name, "ID:", product.id, "ShopId:", product.shopId);

  // Generate JWT token (secret is 'shopflow')
  const token = jwt.sign(
    { sub: user.id, role: user.role, shopId: user.shopId },
    'shopflow'
  );

  const payload = {
    name: product.name,
    model: product.model,
    unit: product.unit,
    barcode: product.barcode,
    code: product.code || '',
    costPrice: product.costPrice,
    sellPrice: product.sellPrice,
    price: product.price,
    quantity: product.quantity,
    branchId: product.branchId,
    userId: user.id,
    shopId: user.shopId,
  };

  console.log("Sending PATCH with payload:", payload);

  try {
    const res = await fetch(`http://localhost:3000/products/${product.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("Status:", res.status);
    const body = await res.text();
    console.log("Response Body:", body);
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
