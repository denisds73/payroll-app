import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillWageData() {
  console.log('Starting backfill...');

  // 1. Create wage history for all existing workers
  const workers = await prisma.worker.findMany();

  for (const worker of workers) {
    // Check if worker already has wage history
    const existingHistory = await prisma.wageHistory.findFirst({
      where: { workerId: worker.id },
    });

    if (!existingHistory) {
      await prisma.wageHistory.create({
        data: {
          workerId: worker.id,
          wage: worker.wage,
          otRate: worker.otRate,
          effectiveFrom: worker.joinedAt,
          reason: 'Initial wage (backfilled)',
        },
      });
      console.log(`Created wage history for worker ${worker.id}`);
    }
  }

  // 2. Update existing attendance records with worker's current wage
  const attendances = await prisma.attendance.findMany({
    where: {
      OR: [{ wageAtTime: 0 }, { otRateAtTime: 0 }],
    },
    include: { worker: true },
  });

  for (const attendance of attendances) {
    await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        wageAtTime: attendance.worker.wage,
        otRateAtTime: attendance.worker.otRate,
      },
    });
    console.log(`Updated attendance ${attendance.id}`);
  }

  console.log('Backfill complete!');
}

backfillWageData()
  .catch((e) => {
    console.error('Error during backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
