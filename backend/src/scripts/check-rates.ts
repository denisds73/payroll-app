import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const workers = await prisma.worker.findMany({
    select: { id: true, name: true, otRate: true }
  });
  console.log('Worker OT Rates:');
  workers.forEach(w => console.log(`${w.name} (ID: ${w.id}): ${w.otRate}`));
  await prisma.$disconnect();
}
main();
