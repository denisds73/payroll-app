import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  try {
    const atts = await prisma.attendance.findMany({
      where: {
        otUnits: { gt: 0 }
      },
      orderBy: { date: 'desc' },
      include: { worker: { select: { name: true } } }
    });

    console.log(`Found ${atts.length} records with OT > 0:`);
    for (const att of atts) {
      console.log(`Worker: ${att.worker.name}, Date: ${att.date.toISOString().split('T')[0]}, Status: ${att.status}, OT Units: ${att.otUnits}, OT Rate: ${att.otRateAtTime}`);
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
