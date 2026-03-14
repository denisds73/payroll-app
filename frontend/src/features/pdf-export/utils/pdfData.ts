import {
  advancesAPI,
  attendanceAPI,
  expensesAPI,
  salariesAPI,
  workersAPI,
} from '../../../services/api';
import type {
  AdvanceRecord,
  AdvanceReportData,
  AdvanceSummary,
  AttendanceRecord,
  AttendanceSummary,
  ExpenseRecord,
  ExpenseSummary,
  SalaryRecord,
  SalaryReportData,
  WorkerInfo,
} from '../types/pdf.types';
import { formatDateTime } from './pdfFormatters';

export async function fetchSalaryReportData(salaryId: number): Promise<SalaryReportData> {
  try {
    console.log('📊 Fetching salary report data for ID:', salaryId);

    const salaryResponse = await salariesAPI.getById(salaryId);
    const salary: SalaryRecord = salaryResponse.data;

    console.log('✅ Salary fetched:', salary);
    return await buildReportDataFromSalary(salary);
  } catch (error) {
    console.error('❌ Error fetching salary report data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to fetch salary report data: ${errorMessage}`);
  }
}

export async function fetchPreviewReportData(workerId: number, cycleStats: any): Promise<SalaryReportData> {
  try {
    console.log('📊 Fetching provisional report data for worker ID:', workerId);
    const mockSalary: SalaryRecord = {
      id: 0,
      workerId,
      cycleStart: cycleStats.cycleStart,
      cycleEnd: cycleStats.cycleEnd,
      basePay: cycleStats.basePay,
      otPay: cycleStats.otPay,
      grossPay: cycleStats.grossPay,
      totalAdvance: cycleStats.totalAdvance,
      totalExpense: cycleStats.totalExpense,
      unpaidBalance: cycleStats.totalNetPayable,
      openingBalance: cycleStats.openingBalance,
      netPay: cycleStats.netPay,
      totalPaid: 0,
      status: 'PENDING',
    };
    return await buildReportDataFromSalary(mockSalary);
  } catch (error) {
    console.error('❌ Error fetching provisional report data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to fetch preview report data: ${errorMessage}`);
  }
}

async function buildReportDataFromSalary(salary: SalaryRecord): Promise<SalaryReportData> {
    const workerResponse = await workersAPI.getById(salary.workerId);
    const worker: WorkerInfo = workerResponse.data;

    console.log('✅ Worker fetched:', worker.name);

    const startDate = salary.cycleStart.split('T')[0];
    const endDate = salary.cycleEnd.split('T')[0];

    console.log('📅 Fetching records for period:', startDate, 'to', endDate);

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const months: { month: number; year: number }[] = [];
    
    let current = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);
    while (current <= endDateObj) {
      months.push({
        month: current.getMonth() + 1,
        year: current.getFullYear(),
      });
      current.setMonth(current.getMonth() + 1);
    }

    console.log('📅 Fetching records for months:', months);

    const [attendanceResponses, expensesResponse, advancesResponse, weeklyReportResponse] = await Promise.all([
      Promise.all(months.map(m => attendanceAPI.getByWorkerAndMonth(salary.workerId, m.month, m.year))),
      expensesAPI.getByWorker(salary.workerId, { startDate, endDate }),
      advancesAPI.getByWorker(salary.workerId, { startDate, endDate }),
      workersAPI.getWeeklyReport(salary.workerId, startDate, endDate),
    ]);

    const allAttendanceRecords: AttendanceRecord[] = attendanceResponses.flatMap(r => r.data);
    const allExpenseRecords: ExpenseRecord[] = expensesResponse.data;
    const allAdvanceRecords: AdvanceRecord[] = advancesResponse.data;
    const allWeeklyReports = weeklyReportResponse.data;

    const attendanceRecords = filterRecordsByDateRange(allAttendanceRecords, startDate, endDate);
    const expenseRecords = filterRecordsByDateRange(allExpenseRecords, startDate, endDate);
    const advanceRecords = filterRecordsByDateRange(allAdvanceRecords, startDate, endDate);
    
    // Filter weekly reports strictly spanning the current cycle
    const start = startDate.split('T')[0];
    const end = endDate.split('T')[0];
    const weeklyReports = allWeeklyReports.filter((w: any) => {
      const wStart = w.startDate.split('T')[0];
      const wEnd = w.endDate.split('T')[0];
      // Include the week if it overlaps with the cycle period
      return wStart <= end && wEnd >= start;
    });

    console.log('✅ Records filtered for period:', {
      attendance: attendanceRecords.length,
      expenses: expenseRecords.length,
      advances: advanceRecords.length,
      weeklyReports: weeklyReports.length,
    });

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
      weeklyReports,
    };

    console.log('✅ Report data compiled successfully');
    return reportData;
}

export async function fetchAdvanceReportData(advanceId: number) {
  try {
    console.log('Fetching advance data for ID:', advanceId);

    const advanceResponse = await advancesAPI.getById(advanceId);
    const advance: AdvanceRecord = advanceResponse.data;

    console.log('Advance fetched', advance);

    const workerResponse = await workersAPI.getById(advance.workerId);
    const worker: WorkerInfo = workerResponse.data;

    console.log('Worker info fetched', worker);

    const now = new Date();
    const generatedAt = now.toISOString();
    const generatedAtFormatted = formatDateTime(generatedAt);

    const reportData: AdvanceReportData = {
      advance,
      worker,
      generatedAt,
      generatedAtFormatted,
    };

    console.log('Advance report data generated successfully');
    return reportData;
  } catch (error) {
    console.error('Error fetching advance report data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to fetch advance report data: ${errorMessage}`);
  }
}

function filterRecordsByDateRange<T extends { date: string }>(
  records: T[],
  startDate: string,
  endDate: string,
): T[] {
  // Ensure we compare strings in YYYY-MM-DD format
  const start = startDate.split('T')[0];
  const end = endDate.split('T')[0];

  return records.filter((record) => {
    const recordDate = record.date.split('T')[0];
    return recordDate >= start && recordDate <= end;
  });
}

function calculateAttendanceSummary(records: AttendanceRecord[]): AttendanceSummary {
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
