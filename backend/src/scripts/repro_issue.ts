import { PrismaClient, AttendanceStatus } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  try {
    // 1. Find a worker
    const worker = await prisma.worker.findFirst();
    if (!worker) {
      console.log('No worker found');
      return;
    }
    console.log(`Using worker: ${worker.name} (ID: ${worker.id})`);

    // 2. Clear any existing attendance for a test date
    const testDate = new Date('2026-02-01T00:00:00Z');
    await prisma.attendance.deleteMany({
      where: {
        workerId: worker.id,
        date: testDate
      }
    });

    // 3. Try to create an attendance with OT but NO STATUS (similar to what might happen in UI)
    // Note: This bypasses NestJS validation, but checks if Prisma/DB allows it.
    console.log('Test 1: Creating attendance with OT but invalid status...');
    try {
      const att1 = await prisma.attendance.create({
        data: {
          workerId: worker.id,
          date: testDate,
          status: '' as any, // Try empty string
          otUnits: 1,
          wageAtTime: worker.wage,
          otRateAtTime: worker.otRate
        }
      });
      console.log('✅ Created attendance with empty status:', att1);
    } catch (e) {
      console.log('❌ Failed to create attendance with empty status (as expected):', e.message);
    }

    // 4. Try to create with ABSENT and OT
    console.log('\nTest 2: Creating attendance with ABSENT and OT...');
    const att2 = await prisma.attendance.create({
      data: {
        workerId: worker.id,
        date: testDate,
        status: 'ABSENT',
        otUnits: 1,
        wageAtTime: worker.wage,
        otRateAtTime: worker.otRate
      }
    });
    console.log('✅ Created attendance with ABSENT status:', att2);

    // 5. Verify if calculateBreakdown counts it
    // We'll simulate the logic here as we can't easily call the service method without Nest context
    const cycleStart = new Date('2026-02-01T00:00:00Z');
    const cycleEnd = new Date('2026-02-28T23:59:59Z');

    const records = await prisma.attendance.findMany({
      where: {
        workerId: worker.id,
        date: { gte: cycleStart, lte: cycleEnd }
      }
    });

    console.log(`\nFound ${records.length} records in cycle.`);
    let basePay = 0;
    let otPay = 0;
    for (const record of records) {
      if (record.status === 'PRESENT') {
        basePay += record.wageAtTime;
      } else if (record.status === 'HALF') {
        basePay += record.wageAtTime * 0.5;
      }
      otPay += (record.otUnits || 0) * record.otRateAtTime;
    }

    console.log(`Calculation results: Base: ${basePay}, OT: ${otPay}, Gross: ${basePay + otPay}`);
    
    // Clean up
    await prisma.attendance.delete({ where: { id: att2.id } });

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
