import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      username: true,
      role: true,
      shopId: true,
      branchId: true,
    }
  });
  console.log("USERS:", JSON.stringify(users, null, 2));

  const branches = await prisma.branch.findMany({
    select: {
      id: true,
      name: true,
      shopId: true,
    }
  });
  console.log("BRANCHES:", JSON.stringify(branches, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
