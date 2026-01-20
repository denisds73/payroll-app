
import {
  attendanceAPI,
  advancesAPI,
  expensesAPI,
  salariesAPI,
  workersAPI,
} from '../../../services/api';
import type {
  SalaryReportData,
  AttendanceRecord,
  ExpenseRecord,
  AdvanceRecord,
  AttendanceSummary,
  ExpenseSummary,
  AdvanceSummary,
  WorkerInfo,
  SalaryRecord,
} from '../types/pdf.types';
import { formatDateTime } from './pdfFormatters';

export async function fetchSalaryReportData(
  salaryId: number,
): Promise<SalaryReportData> {
  try {
    console.log('📊 Fetching salary report data for ID:', salaryId);

    const salaryResponse = await salariesAPI.getById(salaryId);
    const salary: SalaryRecord = salaryResponse.data;

    console.log('✅ Salary fetched:', salary);

    const workerResponse = await workersAPI.getById(salary.workerId);
    const worker: WorkerInfo = workerResponse.data;

    console.log('✅ Worker fetched:', worker.name);

    const startDate = salary.cycleStart.split('T')[0];
    const endDate = salary.cycleEnd.split('T')[0];

    console.log('📅 Fetching records for period:', startDate, 'to', endDate);

    const [attendanceResponse, expensesResponse, advancesResponse] =
      await Promise.all([
        attendanceAPI.getByWorkerAndMonth(
          salary.workerId,
          new Date(startDate).getMonth() + 1,
          new Date(startDate).getFullYear(),
        ),
        expensesAPI.getByWorker(salary.workerId, { startDate, endDate }),
        advancesAPI.getByWorker(salary.workerId, { startDate, endDate }),
      ]);

    console.log('✅ Records fetched:', {
      attendance: attendanceResponse.data.length,
      expenses: expensesResponse.data.length,
      advances: advancesResponse.data.length,
    });

    const attendanceRecords: AttendanceRecord[] = attendanceResponse.data;
    const expenseRecords: ExpenseRecord[] = expensesResponse.data;
    const advanceRecords: AdvanceRecord[] = advancesResponse.data;

    const attendanceSummary = calculateAttendanceSummary(attendanceRecords);
    const expenseSummary = calculateExpenseSummary(expenseRecords);
    const advanceSummary = calculateAdvanceSummary(advanceRecords);

    const now = new Date();
    const generatedAt = now.toISOString();
    const generatedAtFormatted = formatDateTime(generatedAt);

    const reportData: SalaryReportData = {
      worker,
      salary,
      attendance: {
        records: attendanceRecords,
        summary: attendanceSummary,
      },
      expenses: {
        records: expenseRecords,
        summary: expenseSummary,
      },
      advances: {
        records: advanceRecords,
        summary: advanceSummary,
      },
      generatedAt,
      generatedAtFormatted,
    };

    console.log('✅ Report data compiled successfully');
    return reportData;
  } catch (error) {
    console.error('❌ Error fetching salary report data:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    throw new Error(`Failed to fetch salary report data: ${errorMessage}`);
  }
}

function calculateAttendanceSummary(
  records: AttendanceRecord[],
): AttendanceSummary {
  let presentDays = 0;
  let halfDays = 0;
  let absentDays = 0;
  let totalOtUnits = 0;
  let totalBasePay = 0;
  let totalOtPay = 0;

  for (const record of records) {
    if (record.status === 'PRESENT') {
      presentDays += 1;
      totalBasePay += record.wageAtTime;
    } else if (record.status === 'HALF') {
      halfDays += 1;
      totalBasePay += record.wageAtTime * 0.5;
    } else if (record.status === 'ABSENT') {
      absentDays += 1;
    }

    const otUnits = record.otUnits ?? 0;
    totalOtUnits += otUnits;
    totalOtPay += otUnits * record.otRateAtTime;
  }

  const totalDays = presentDays + halfDays * 0.5;

  return {
    totalDays,
    totalOtUnits,
    presentDays,
    halfDays,
    absentDays,
    totalBasePay,
    totalOtPay,
  };
}

function calculateExpenseSummary(records: ExpenseRecord[]): ExpenseSummary {
  let total = 0;
  const byType: { [typeName: string]: { total: number; count: number } } = {};

  for (const record of records) {
    total += record.amount;

    const typeName = record.type.name;

    if (!byType[typeName]) {
      byType[typeName] = { total: 0, count: 0 };
    }

    byType[typeName].total += record.amount;
    byType[typeName].count += 1;
  }

  return {
    total,
    byType,
    records,
  };
}

function calculateAdvanceSummary(records: AdvanceRecord[]): AdvanceSummary {
  const total = records.reduce((sum, record) => sum + record.amount, 0);

  return {
    total,
    count: records.length,
    records,
  };
}
