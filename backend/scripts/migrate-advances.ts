import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting data migration to link advances to salaries...');
  
  const workers = await prisma.worker.findMany({
    select: { id: true, name: true }
  });

  for (const worker of workers) {
    console.log(`Processing worker: ${worker.name} (ID: ${worker.id})`);
    
    // Get all salaries for this worker ordered by date
    const salaries = await prisma.salary.findMany({
      where: { workerId: worker.id },
      orderBy: { cycleEnd: 'asc' }
    });

    for (const salary of salaries) {
      // Find advances that should have been deducted by this salary
      // Current rule was date <= cycleEnd
      const result = await prisma.advance.updateMany({
        where: {
          workerId: worker.id,
          salaryId: null,
          date: { lte: salary.cycleEnd }
        },
        data: {
          salaryId: salary.id
        }
      });
      
      if (result.count > 0) {
        console.log(`  Linked ${result.count} advances to Salary ID: ${salary.id} (Cycle End: ${salary.cycleEnd.toISOString().split('T')[0]})`);
      }
    }
  }

  console.log('Migration complete!');
}

migrate()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
