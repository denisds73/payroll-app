import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const types = ['Food', 'Other', 'Site'];

  for (const name of types) {
    await prisma.expenseType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

main()
  .then(() => {
    console.log('✅ Expense types seeded successfully!');
  })
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
