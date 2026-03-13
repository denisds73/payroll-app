import { Calendar, Download, Eye } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import PdfService from '../../features/pdf-export/services/pdfService';
import { buildWeeklyReportPdf } from '../../features/pdf-export/utils/weeklyReportPdfBuilder';
import { workersAPI } from '../../services/api';
import PdfPreviewModal from '../modals/PdfPreviewModal';
import Button from '../ui/Button';

interface AttendanceDetail {
  date: string;
  status: 'PRESENT' | 'HALF' | 'ABSENT';
  otUnits: number;
}

interface ExpenseDetail {
  date: string;
  amount: number;
  note: string;
  type: string;
}

interface WeeklyReport {
  startDate: string;
  endDate: string;
  attendanceCount: number;
  otUnits: number;
  earning: number;
  expenseFood: number;
  expenseGeneral: number;
  expensesTotal: number;
  netEarning: number;
  attendances: AttendanceDetail[];
  expenses: ExpenseDetail[];
}

interface WeeklyReportTabProps {
  worker: {
    id: number;
    name: string;
    phone?: string;
  };
}

interface DayInfo {
  date: string;
  isInRange: boolean;
}

const DAY_NAMES = ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'ச'];

function getWeekDays(startDate: string, endDate: string): DayInfo[] {
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');

  const sunday = new Date(start);
  sunday.setUTCDate(sunday.getUTCDate() - start.getUTCDay());

  const days: DayInfo[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const isInRange = d >= start && d <= end;
    days.push({ date: dateStr, isInRange });
  }
  return days;
}

function getAttendanceMarking(status: string, otUnits: number): string {
  let marking = '';
  switch (status.toUpperCase()) {
    case 'PRESENT': marking = 'x'; break;
    case 'ABSENT': marking = 'a'; break;
    case 'HALF': marking = '/'; break;
    default: return '';
  }
  const ot = otUnits ?? 0;
  if (ot > 0) {
    marking += ' ';
    if (ot === 0.5) marking += '/';
    else if (ot === 1.0) marking += 'x';
    else if (ot === 1.5) marking += 'x/';
    else if (ot >= 2.0) marking += 'xx';
    else marking += `(${ot})`;
  }
  return marking;
}

export default function WeeklyReportTab({ worker }: WeeklyReportTabProps) {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchWeeklyReport();
  }, [worker.id]);

  const fetchWeeklyReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await workersAPI.getWeeklyReport(worker.id);
      setReports(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load weekly report');
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    return reports.reduce(
      (acc, week) => ({
        attendanceCount: acc.attendanceCount + week.attendanceCount,
        otUnits: acc.otUnits + week.otUnits,
        earning: acc.earning + week.earning,
        expenseGeneral: acc.expenseGeneral + week.expenseGeneral,
        expenseFood: acc.expenseFood + week.expenseFood,
        expensesTotal: acc.expensesTotal + week.expensesTotal,
        netEarning: acc.netEarning + week.netEarning,
      }),
      {
        attendanceCount: 0,
        otUnits: 0,
        earning: 0,
        expenseGeneral: 0,
        expenseFood: 0,
        expensesTotal: 0,
        netEarning: 0,
      }
    );
  }, [reports]);

  const shortDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const data = {
        worker: { id: worker.id, name: worker.name, phone: worker.phone },
        reports: reports,
        totals: totals,
        generatedAt: new Date().toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      };
      const docDef = buildWeeklyReportPdf(data);
      await PdfService.generateAndDownloadPdf(
        docDef, 
        `Weekly_Report_${worker.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`
      );
      toast.success('PDF generated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePreviewPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setError(null);
      const data = {
        worker: { id: worker.id, name: worker.name, phone: worker.phone },
        reports: reports,
        totals: totals,
        generatedAt: new Date().toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      };
      const docDef = buildWeeklyReportPdf(data);
      const url = await PdfService.getPdfUrl(docDef);
      setPdfUrl(url);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Preview error:', err);
      toast.error('Failed to prepare preview');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const closePreview = useCallback(() => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setIsPreviewOpen(false);
  }, [pdfUrl]);

  if (loading) {
    return (
      <div className="px-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-surface rounded-lg h-10" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-6 p-4 bg-error/10 border border-error/20 rounded-lg text-error text-xs font-bold uppercase tracking-wide">
        {error}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 bg-surface rounded-full flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-7 h-7 text-text-secondary" />
        </div>
        <h3 className="text-base font-medium text-text-primary mb-1">No data yet</h3>
        <p className="text-text-secondary text-sm">Current cycle has not started or has no data.</p>
      </div>
    );
  }

  // Define column widths for consistent grid
  const COL_WEEK = 'w-24 shrink-0';
  const COL_DAY = 'flex-1 text-center';
  const COL_ATT_COUNT = 'w-16 shrink-0';
  const COL_OT = 'w-10 shrink-0';
  const COL_EARN = 'w-24 shrink-0';
  const COL_EXP_GEN = 'w-24 shrink-0';
  const COL_EXP_FOOD = 'w-20 shrink-0';
  const COL_EXP_TOTAL = 'w-24 shrink-0';
  const COL_NET = 'w-28 shrink-0';

  // Divider Style — visible separator between major column groups
  const DIVIDER = 'border-l-2 border-border/60';

  return (
    <>
      <div className="w-full">
        {/* 1. Title Bar (Sticky top-0) */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-card border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
            <h3 className="text-sm font-bold text-text-primary tracking-tight">Weekly Breakdown</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={handlePreviewPdf}
              loading={isGeneratingPdf && isPreviewOpen}
              className="flex items-center gap-2 px-4 border border-border bg-background hover:bg-surface-hover transition-colors text-xs font-bold uppercase"
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleDownloadPdf}
              loading={isGeneratingPdf && !isPreviewOpen}
              className="flex items-center gap-2 px-4 shadow-sm text-xs font-bold uppercase"
            >
              <Download className="w-3.5 h-3.5" /> Download Report
            </Button>
          </div>
        </div>

        {/* 2. Column Headers (Sticky top-[61px]) */}
        <div className="w-full">
          <div className="sticky top-[61px] z-20 flex items-center px-6 bg-surface/95 backdrop-blur-md border-b-2 border-border shadow-sm">
            <div className={`${COL_WEEK} font-bold text-xs text-text-secondary uppercase tracking-widest text-center py-3`}>
              வாரம்
            </div>
            {DAY_NAMES.map((day) => (
              <div key={day} className={`${COL_DAY} font-bold text-xs text-text-secondary uppercase tracking-widest py-3`}>
                {day}
              </div>
            ))}
            
            {/* Divider Group 1: Stats */}
            <div className={`${COL_ATT_COUNT} ${DIVIDER} font-bold text-xs text-blue-400 uppercase tracking-widest text-center leading-tight py-3`}>
              வேலை<br />நாட்கள்
            </div>
            <div className={`${COL_OT} font-bold text-xs text-blue-400 uppercase tracking-widest text-center py-3`}>
              OT
            </div>
            <div className={`${COL_EARN} font-bold text-xs text-blue-400 uppercase tracking-widest text-center py-3`}>
              சம்பளம்
            </div>
            
            {/* Divider Group 2: Expenses */}
            <div className={`${COL_EXP_GEN} ${DIVIDER} font-bold text-xs text-amber-500 uppercase tracking-widest text-center py-3`}>
              செலவு
            </div>
            <div className={`${COL_EXP_FOOD} font-bold text-xs text-amber-500 uppercase tracking-widest text-center py-3`}>
              சாப்பாடு
            </div>
            <div className={`${COL_EXP_TOTAL} font-bold text-xs text-amber-500 uppercase tracking-widest text-center leading-tight py-3`}>
              மொத்த<br />செலவு
            </div>
            
            {/* Divider Group 3: Net */}
            <div className={`${COL_NET} ${DIVIDER} font-bold text-xs text-emerald-500 uppercase tracking-widest text-center py-3`}>
              வரவு
            </div>
          </div>

          {/* 3. Report Rows */}
          <div className="px-0">
            {reports.map((week, index) => {
              const weekDays = getWeekDays(week.startDate, week.endDate);
              return (
                <div key={index} className={`flex items-center px-6 transition-colors border-b border-border/30 ${index % 2 === 0 ? 'bg-background/40' : 'bg-surface/20'} hover:bg-surface-hover/50`}>
                  <div className={`${COL_WEEK} text-xs font-semibold text-text-primary text-center py-2.5`}>
                    {shortDate(week.startDate)} – {shortDate(week.endDate)}
                  </div>
                  {weekDays.map((day, di) => {
                    const att = week.attendances.find((a) => a.date === day.date);
                    return (
                      <div key={di} className={`${COL_DAY} text-xs py-2.5 ${!day.isInRange ? 'opacity-20' : 'text-text-primary font-medium'}`}>
                        {day.isInRange && att ? getAttendanceMarking(att.status, att.otUnits) : ''}
                      </div>
                    );
                  })}
                  
                  {/* Row Stats Divider */}
                  <div className={`${COL_ATT_COUNT} ${DIVIDER} text-center text-xs font-bold text-text-primary py-2.5`}>{week.attendanceCount}</div>
                  <div className={`${COL_OT} text-center text-xs text-text-secondary py-2.5`}>{week.otUnits}</div>
                  <div className={`${COL_EARN} text-center text-xs font-bold text-blue-400 py-2.5`}>{formatCurrency(week.earning)}</div>
                  
                  {/* Row Expenses Divider */}
                  <div className={`${COL_EXP_GEN} ${DIVIDER} text-center text-xs text-text-secondary py-2.5`}>{formatCurrency(week.expenseGeneral)}</div>
                  <div className={`${COL_EXP_FOOD} text-center text-xs text-text-secondary py-2.5`}>{formatCurrency(week.expenseFood)}</div>
                  <div className={`${COL_EXP_TOTAL} text-center text-xs font-bold text-amber-500 py-2.5`}>{formatCurrency(week.expensesTotal)}</div>
                  
                  {/* Row Net Divider */}
                  <div className={`${COL_NET} ${DIVIDER} text-center text-sm font-black text-emerald-500 py-2.5`}>{formatCurrency(week.netEarning)}</div>
                </div>
              );
            })}
          </div>

          {/* 4. Totals Bar (Sticky Bottom) */}
          <div className="sticky bottom-0 z-20 flex items-center px-6 bg-surface border-t-2 border-border shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
            <div className={`${COL_WEEK} font-black text-xs text-text-primary uppercase tracking-widest text-center py-4`}>மொத்தம்</div>
            {DAY_NAMES.map((_, i) => (
              <div key={i} className={`${COL_DAY}`} />
            ))}
            
            {/* Totals Stats Divider */}
            <div className={`${COL_ATT_COUNT} ${DIVIDER} text-center text-sm font-black text-text-primary py-4`}>{totals.attendanceCount}</div>
            <div className={`${COL_OT} text-center text-xs font-bold text-text-secondary py-4`}>{totals.otUnits}</div>
            <div className={`${COL_EARN} text-center text-sm font-black text-blue-500 py-4`}>{formatCurrency(totals.earning)}</div>
            
            {/* Totals Expenses Divider */}
            <div className={`${COL_EXP_GEN} ${DIVIDER} text-center text-xs font-bold text-text-secondary py-4`}>{formatCurrency(totals.expenseGeneral)}</div>
            <div className={`${COL_EXP_FOOD} text-center text-xs font-bold text-text-secondary py-4`}>{formatCurrency(totals.expenseFood)}</div>
            <div className={`${COL_EXP_TOTAL} text-center text-sm font-black text-amber-500 py-4`}>{formatCurrency(totals.expensesTotal)}</div>
            
            {/* Totals Net Divider */}
            <div className={`${COL_NET} ${DIVIDER} text-center text-base font-black text-emerald-500 py-4`}>{formatCurrency(totals.netEarning)}</div>
          </div>
        </div>
      </div>

      <PdfPreviewModal isOpen={isPreviewOpen} onClose={closePreview} title={`Weekly Report - ${worker.name}`} pdfUrl={pdfUrl} onDownload={handleDownloadPdf} />
    </>
  );
}
