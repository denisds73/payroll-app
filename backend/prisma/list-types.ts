import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const types = await prisma.expenseType.findMany();
  console.log('Current Expense Types:');
  console.table(types);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
