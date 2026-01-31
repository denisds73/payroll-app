export interface AdvanceReportData {
  advance: AdvanceRecord;
  worker: WorkerInfo;
  generatedAt: string;
  generatedAtFormatted: string;
}

export interface AdvancePdfGeneratorState {
  isGenerating: boolean;
  error: string | null;
  success: boolean;
}

export interface AdvancePdfGeneratorActions {
  generateAndDownload: (advanceId: number) => Promise<void>;
  clear: () => void;
}

export type UseAdvancePdfGenerator = AdvancePdfGeneratorState & AdvancePdfGeneratorActions;
export interface AttendanceRecord {
  id: number;
  workerId: number;
  date: string;
  status: 'PRESENT' | 'HALF' | 'ABSENT';
  wageAtTime: number;
  otUnits: number;
  otRateAtTime: number;
  note?: string;
}

export interface AttendanceSummary {
  totalDays: number;
  totalOtUnits: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  totalBasePay: number;
  totalOtPay: number;
}

export interface ExpenseRecord {
  id: number;
  workerId: number;
  date: string;
  amount: number;
  typeId: number;
  type: {
    id: number;
    name: string;
  };
  note?: string;
}

export interface ExpenseSummary {
  total: number;
  byType: {
    [typeName: string]: {
      total: number;
      count: number;
    };
  };
  records: ExpenseRecord[];
}

export interface AdvanceRecord {
  id: number;
  workerId: number;
  date: string;
  amount: number;
  reason?: string;
}

export interface AdvanceSummary {
  total: number;
  count: number;
  records: AdvanceRecord[];
}

export interface WorkerInfo {
  id: number;
  name: string;
  phone?: string;
  wage: number;
  otRate: number;
  joinedAt: string;
  isActive: boolean;
}

export interface SalaryRecord {
  id: number;
  workerId: number;
  cycleStart: string;
  cycleEnd: string;
  basePay: number;
  otPay: number;
  grossPay: number;
  totalAdvance: number;
  totalExpense: number;
  netPay: number;
  totalPaid: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
  issuedAt?: string;
  paymentProof?: string;
}

export interface SalaryReportData {
  worker: WorkerInfo;
  salary: SalaryRecord;
  attendance: {
    records: AttendanceRecord[];
    summary: AttendanceSummary;
  };
  expenses: {
    records: ExpenseRecord[];
    summary: ExpenseSummary;
  };
  advances: {
    records: AdvanceRecord[];
    summary: AdvanceSummary;
  };
  generatedAt: string;
  generatedAtFormatted: string;
}

export interface AttendanceApiResponse {
  data: AttendanceRecord[];
}

export interface ExpenseApiResponse {
  data: ExpenseRecord[];
}

export interface AdvanceApiResponse {
  data: AdvanceRecord[];
}

export interface WorkerApiResponse {
  data: WorkerInfo;
}

export interface SalaryApiResponse {
  data: SalaryRecord;
}

export interface PdfGeneratorState {
  isGenerating: boolean;
  error: string | null;
  success: boolean;
}

export interface PdfGeneratorActions {
  generateAndDownload: (salaryId: number) => Promise<void>;
  clear: () => void;
}

export type UseSalaryPdfGenerator = PdfGeneratorState & PdfGeneratorActions;

export interface FormattingOptions {
  locale?: string;
  currency?: string;
  dateFormat?: 'short' | 'long' | 'full';
}
