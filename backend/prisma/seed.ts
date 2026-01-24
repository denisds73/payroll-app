import { AttendanceStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {

  const types = ['Food', 'Other'];
  const expenseTypes = await Promise.all(
    types.map((name) =>
      prisma.expenseType.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  console.log(`✅ Created ${expenseTypes.length} expense types: Food, Other`);

  // Seed workers
  const workers = [
    { name: 'John Doe', wage: 500, joinedAt: '2025-01-01', otRate: 50 },
    { name: 'Jane Smith', wage: 600, joinedAt: '2025-02-01', otRate: 60 },
    { name: 'Bob Wilson', wage: 550, joinedAt: '2025-03-01', otRate: 55 },
  ];

  for (const worker of workers) {
    const createdWorker = await prisma.worker.create({
      data: {
        name: worker.name,
        wage: worker.wage,
        otRate: worker.otRate,
        joinedAt: new Date(`${worker.joinedAt}T00:00:00Z`),
      },
    });

    console.log(`✅ Created worker: ${createdWorker.name}`);

    const daysInMonth = 31;
    for (let day = 1; day <= daysInMonth; day++) {
      if (day <= 30) {
        const rand = Math.random();
        const status =
          rand > 0.9
            ? AttendanceStatus.ABSENT
            : rand > 0.8
              ? AttendanceStatus.HALF
              : AttendanceStatus.PRESENT;

        if (status !== AttendanceStatus.ABSENT) {
          const otUnits = Math.random() > 0.7 ? Math.floor(Math.random() * 4) : 0;
          
          await prisma.attendance.create({
            data: {
              workerId: createdWorker.id,
              date: new Date(`2025-12-${String(day).padStart(2, '0')}T00:00:00Z`),
              status,
              otUnits,
              wageAtTime: createdWorker.wage,
              otRateAtTime: createdWorker.otRate,
            },
          });
        }
      }
    }

    console.log(`✅ Created attendance for ${createdWorker.name}`);

    const numAdvances = Math.floor(Math.random() * 3);
    for (let i = 0; i < numAdvances; i++) {
      const day = Math.floor(Math.random() * 30) + 1;
      await prisma.advance.create({
        data: {
          workerId: createdWorker.id,
          amount: Math.floor(Math.random() * 1000) + 500,
          date: new Date(`2025-12-${String(day).padStart(2, '0')}T00:00:00Z`),
          reason: 'Personal need',
        },
      });
    }

    console.log(`✅ Created advances for ${createdWorker.name}`);

    const numExpenses = Math.floor(Math.random() * 4);
    for (let i = 0; i < numExpenses; i++) {
      const day = Math.floor(Math.random() * 30) + 1;
      const typeId = expenseTypes[Math.floor(Math.random() * expenseTypes.length)].id;
      await prisma.expense.create({
        data: {
          workerId: createdWorker.id,
          amount: Math.floor(Math.random() * 300) + 100,
          date: new Date(`2025-12-${String(day).padStart(2, '0')}T00:00:00Z`),
          typeId,
          note: 'Sample expense',
        },
      });
    }

    console.log(`✅ Created expenses for ${createdWorker.name}`);
  }
}

main()
  .then(() => {
    console.log('🎉 Database seeded successfully!');
  })
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
