import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  try {
    const workers = await prisma.worker.findMany();
    console.log(`Found ${workers.length} workers.`);

    for (const worker of workers) {
      console.log(`Checking worker: ${worker.name} (ID: ${worker.id}, Rate: ${worker.otRate}, Wage: ${worker.wage})`);
      
      const atts = await prisma.attendance.findMany({
        where: {
          workerId: worker.id,
          otUnits: { gt: 0 }
        },
        orderBy: { date: 'desc' },
        take: 5
      });

      if (atts.length === 0) {
        console.log(`  No OT records found.`);
      } else {
        console.log(`  Found ${atts.length} recent OT records:`);
        for (const att of atts) {
          console.log(`    Date: ${att.date.toISOString().split('T')[0]}, Status: ${att.status}, OT Units: ${att.otUnits}, OT Rate At Time: ${att.otRateAtTime}, Wage At Time: ${att.wageAtTime}`);
          if (att.otRateAtTime === 0) {
            console.log(`    ⚠️  WARNING: OT Rate is 0! OT Pay will be 0.`);
          }
        }
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
