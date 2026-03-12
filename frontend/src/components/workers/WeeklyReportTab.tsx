import { Calendar, Download, MessageCircle, Share2, BarChart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { workersAPI } from '../../services/api';
import PdfService from '../../features/pdf-export/services/pdfService';
import { buildWeeklyReportPdf } from '../../features/pdf-export/utils/weeklyReportPdfBuilder';

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
    default: marking = '-'; break;
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

  const netColor = (amount: number) => {
    if (amount > 0) return 'text-emerald-400';
    if (amount < 0) return 'text-red-400';
    return '';
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const data = {
        worker: { id: worker.id, name: worker.name, phone: worker.phone },
        reports: reports,
        totals: totals,
        generatedAt: new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
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

  const handleShareWhatsApp = () => {
    if (!worker.phone) {
      toast.error('Worker phone number not available');
      return;
    }

    const summaryHeader = `*வாரம் அறிக்கை (Weekly Report) - ${worker.name}*`;
    const period = reports.length > 0 
      ? `Period: ${shortDate(reports[reports.length-1].startDate)} - ${shortDate(reports[0].endDate)}`
      : '';
    
    const statsRow = `\nவேலை நாட்கள்: ${totals.attendanceCount}\nOT: ${totals.otUnits}\nசம்பளம்: ₹${totals.earning.toLocaleString('en-IN')}\nசெலவு: ₹${totals.expensesTotal.toLocaleString('en-IN')}\n*மொத்தம் (Net): ₹${totals.netEarning.toLocaleString('en-IN')}*`;
    
    const message = `${summaryHeader}\n${period}\n${statsRow}\n\nPlease check the exported PDF for full day-by-day details.`;
    
    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${worker.phone.replace(/[^0-9]/g, '')}?text=${encodedMsg}`;
    
    if (typeof (window as any).require !== 'undefined') {
      const { shell } = (window as any).require('electron');
      shell.openExternal(whatsappUrl);
    } else {
      window.open(whatsappUrl, '_blank');
    }
    toast.success('Opening WhatsApp...');
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-surface rounded-lg h-10" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error text-xs">
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

  const thBase = 'px-2 py-2.5 text-center font-semibold text-xs';
  const tdBase = 'px-2 py-2 text-center text-xs';

  return (
    <div className="space-y-4">
      {/* Actions Toolbar */}
      <div className="flex items-center justify-between bg-surface/30 p-3 rounded-lg border border-border/50">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-text-primary">பகிர் (Share Report)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-3 py-1.5 bg-card hover:bg-surface border border-border rounded-md text-xs font-medium text-text-primary transition-all disabled:opacity-50"
            title="Download PDF"
          >
            <Download className={`w-3.5 h-3.5 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
            PDF பதிவிறக்கம்
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-medium transition-all shadow-sm"
            title="Share on WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            வாட்ஸ்அப் பகிர்
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-lg">
        <div className="overflow-y-auto max-h-[calc(100vh-27rem)]">
          <table className="w-full text-xs table-fixed">
            <colgroup>
              <col className="w-[13%]" />
              {DAY_NAMES.map((_, i) => (
                <col key={i} className="w-[5%]" />
              ))}
              <col className="w-[7%]" />
              <col className="w-[5%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
            </colgroup>

            <thead className="sticky top-0 z-10">
              <tr className="bg-surface border-b-2 border-border">
                <th className="px-2 py-2.5 text-center font-semibold text-xs text-text-secondary">
                  வாரம்
                </th>
                {DAY_NAMES.map((day, i) => (
                  <th key={day} className={`${thBase} text-text-secondary ${i > 0 ? 'border-l border-border/30' : ''}`}>
                    {day}
                  </th>
                ))}
                <th className={`${thBase} text-blue-300 border-l border-border`}>
                  வேலை நாட்கள்
                </th>
                <th className={`${thBase} text-blue-300`}>OT</th>
                <th className={`${thBase} text-blue-300`}>சம்பளம்</th>
                <th className={`${thBase} text-amber-300 border-l border-border`}>
                  செலவு
                </th>
                <th className={`${thBase} text-amber-300`}>சாப்பாடு</th>
                <th className={`${thBase} text-amber-300`}>மொத்த செலவு</th>
                <th className={`${thBase} text-emerald-400 border-l border-border`}>
                  வரவு
                </th>
              </tr>
            </thead>

            <tbody>
              {reports.map((week, index) => {
                const weekDays = getWeekDays(week.startDate, week.endDate);

                return (
                  <tr
                    key={index}
                    className={`border-b border-border/40 hover:bg-surface-hover/50 transition-colors ${
                      index % 2 === 0 ? '' : 'bg-surface/20'
                    }`}
                  >
                    <td className="px-2 py-2 text-xs font-medium text-text-primary whitespace-nowrap text-center">
                      {shortDate(week.startDate)} – {shortDate(week.endDate)}
                    </td>

                    {weekDays.map((day, di) => {
                      if (!day.isInRange) return <td key={di} className={`${tdBase} ${di > 0 ? 'border-l border-border/30' : ''}`} />;
                      const att = week.attendances.find((a) => a.date === day.date);
                      return (
                        <td key={di} className={`${tdBase} text-text-primary font-medium ${di > 0 ? 'border-l border-border/30' : ''}`}>
                          {att ? getAttendanceMarking(att.status, att.otUnits) : ''}
                        </td>
                      );
                    })}

                    <td className={`${tdBase} text-text-primary border-l border-border`}>
                      {week.attendanceCount > 0 ? week.attendanceCount : '0'}
                    </td>
                    <td className={`${tdBase} text-text-primary`}>
                      {week.otUnits > 0 ? week.otUnits : '0'}
                    </td>
                    <td className={`${tdBase} text-blue-300 font-medium`}>
                      {formatCurrency(week.earning)}
                    </td>
                    <td className={`${tdBase} text-text-primary border-l border-border`}>
                      {formatCurrency(week.expenseGeneral)}
                    </td>
                    <td className={`${tdBase} text-text-primary`}>
                      {formatCurrency(week.expenseFood)}
                    </td>
                    <td className={`${tdBase} text-amber-300 font-medium`}>
                      {formatCurrency(week.expensesTotal)}
                    </td>
                    <td className={`${tdBase} font-semibold border-l border-border ${netColor(week.netEarning)}`}>
                      {formatCurrency(week.netEarning)}
                    </td>
                  </tr>
                );
              })}

              {/* Totals */}
              <tr className="bg-surface border-t-2 border-border sticky bottom-0 z-10">
                <td className="px-2 py-3 text-xs font-bold text-text-primary">
                  மொத்தம்
                </td>
                {DAY_NAMES.map((_, i) => (
                  <td key={i} className={tdBase} />
                ))}
                <td className={`${tdBase} font-bold text-blue-300 border-l border-border`}>
                  {totals.attendanceCount}
                </td>
                <td className={`${tdBase} font-bold text-blue-300`}>
                  {totals.otUnits}
                </td>
                <td className={`${tdBase} font-bold text-blue-300`}>
                  {formatCurrency(totals.earning)}
                </td>
                <td className={`${tdBase} font-bold text-amber-300 border-l border-border`}>
                  {formatCurrency(totals.expenseGeneral)}
                </td>
                <td className={`${tdBase} font-bold text-amber-300`}>
                  {formatCurrency(totals.expenseFood)}
                </td>
                <td className={`${tdBase} font-bold text-amber-300`}>
                  {formatCurrency(totals.expensesTotal)}
                </td>
                <td className={`${tdBase} font-bold border-l border-border ${netColor(totals.netEarning)}`}>
                  {formatCurrency(totals.netEarning)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[10px] text-text-secondary px-2 italic">
        * Note: இதர செலவுகள் (Other Expenses) are excluded from Net Earning calculations in this report.
      </p>
    </div>
  );
}
