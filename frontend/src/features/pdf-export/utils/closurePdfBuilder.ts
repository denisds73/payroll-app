import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { SalaryReportData } from '../types/pdf.types';
import { capitalize, formatCurrency, formatDate, formatDateRange } from './pdfFormatters';

export function buildClosureReportPdf(
  data: SalaryReportData,
  signatureDataUrl?: string,
): TDocumentDefinitions {
  return {
    info: {
      title: `Cycle Closure Report - ${data.worker.name}`,
      author: 'Payroll System',
      subject: `Cycle closure report for ${formatDateRange(data.salary.cycleStart, data.salary.cycleEnd)}`,
      creator: 'Payroll App',
      producer: 'PDFMake',
    },

    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],

    content: [
      buildHeader(data),
      buildWorkerInfo(data),
      buildCyclePeriod(data),
      buildAttendanceSummary(data),
      buildAttendanceTable(data),
      buildExpensesTable(data),
      buildAdvancesTable(data),
      buildWeeklyReportTable(data),
      buildBalanceBreakdown(data),
      ...(data.salary.paymentProof ? [buildNoteSection(data.salary.paymentProof)] : []),
      buildSignatureSection(data, signatureDataUrl),
      buildFooter(data),
    ],

    styles: {
      documentTitle: {
        fontSize: 24,
        bold: true,
        alignment: 'left',
        color: '#000000',
        margin: [0, 0, 0, 2],
      },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        color: '#000000',
        margin: [0, 15, 0, 0],
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: '#000000',
      },
      tableCell: {
        fontSize: 9,
        color: '#000000',
      },
      infoLabel: {
        fontSize: 9,
        color: '#000000',
        bold: false,
      },
      infoValue: {
        fontSize: 10,
        color: '#000000',
        bold: true,
      },
      subHeader: {
        fontSize: 11,
        bold: true,
        color: '#000000',
        margin: [0, 10, 0, 5],
      },
      totalRow: {
        fontSize: 10,
        bold: true,
        color: '#000000',
      },
      footer: {
        fontSize: 8,
        color: '#000000',
        italics: false,
        alignment: 'center',
      },
    },

    defaultStyle: {
      font: 'Tamil',
      fontSize: 10,
      color: '#000000',
    },
  };
}

function buildHeader(data: SalaryReportData): Content {
  return [
    {
      columns: [
        {
          text: 'கணக்கு முடிவு அறிக்கை',
          style: 'documentTitle',
          width: '*',
        },
        {
          text: `#CR-${data.salary.id}`,
          fontSize: 14,
          bold: true,
          color: '#000000',
          alignment: 'right',
          width: 'auto',
        },
      ],
    },
    {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#cccccc' }],
      margin: [0, 5, 0, 15],
    },
  ];
}

function buildWorkerInfo(data: SalaryReportData): Content {
  return {
    columns: [
      {
        width: '*',
        stack: [
          { text: 'பெயர்', style: 'infoLabel' },
          { text: data.worker.name, style: 'infoValue', fontSize: 13 },
        ],
      },
      {
        width: 'auto',
        stack: [
          { text: 'தொலைபேசி எண்', style: 'infoLabel' },
          { text: data.worker.phone || 'N/A', style: 'infoValue' },
        ],
        margin: [40, 0, 0, 0],
      },
    ],
    margin: [0, 0, 0, 20],
  };
}

function buildCyclePeriod(data: SalaryReportData): Content {
  return {
    table: {
      widths: ['*', '*'],
      body: [
        [
          {
            text: 'கணக்கு காலம்',
            colSpan: 2,
            bold: true,
            fontSize: 11,
            color: '#000000',
            margin: [8, 6, 8, 6],
          },
          {},
        ],
        [
          {
            text: [
              { text: 'காலம்: ', style: 'infoLabel' },
              {
                text: formatDateRange(data.salary.cycleStart, data.salary.cycleEnd),
                style: 'infoValue',
              },
            ],
            margin: [8, 6, 8, 6],
          },
          {
            text: [
              { text: 'நிலை: ', style: 'infoLabel' },
              { text: capitalize(data.salary.status), style: 'infoValue' },
            ],
            margin: [8, 6, 8, 6],
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#cccccc',
      vLineColor: () => '#cccccc',
    },
    margin: [0, 0, 0, 15],
  };
}

function buildAttendanceSummary(data: SalaryReportData): Content {
  const { attendance } = data;
  const { summary } = attendance;

  return {
    stack: [
      // Header
      {
        text: 'வருகை விவரம்',
        style: 'sectionHeader',
        margin: [0, 15, 0, 10],
      },

      // Two-column layout
      {
        columns: [
          // Left Column - Days
          {
            width: '48%',
            stack: [
              { text: 'நாட்கள் விவரம்', style: 'subHeader', margin: [0, 0, 0, 5] },
              {
                table: {
                  widths: ['*', 'auto'],
                  body: [
                    [
                      { text: 'முழு நாட்கள்', style: 'tableCell' },
                      {
                        text: summary.presentDays.toString(),
                        style: 'tableCell',
                        alignment: 'right',
                      },
                    ],
                    [
                      { text: 'அரை நாட்கள்', style: 'tableCell' },
                      { text: summary.halfDays.toString(), style: 'tableCell', alignment: 'right' },
                    ],
                    [
                      { text: 'வேலை செய்யாத நாட்கள்', style: 'tableCell' },
                      {
                        text: summary.absentDays.toString(),
                        style: 'tableCell',
                        alignment: 'right',
                      },
                    ],
                    [
                      { text: 'மொத்த வேலை செய்த நாட்கள்', style: 'tableCell', bold: true },
                      {
                        text: summary.totalDays.toFixed(1),
                        style: 'tableCell',
                        alignment: 'right',
                        bold: true,
                      },
                    ],
                    [
                      { text: 'மொத்த OT', style: 'tableCell', bold: true },
                      {
                        text: summary.totalOtUnits.toFixed(1),
                        style: 'tableCell',
                        alignment: 'right',
                        bold: true,
                      },
                    ],
                  ],
                },
                layout: 'lightHorizontalLines',
              },
            ],
          },

          // Gap
          { width: '4%', text: '' },

          // Right Column - Amounts
          {
            width: '48%',
            stack: [
              { text: 'சம்பள விவரம்', style: 'subHeader', margin: [0, 0, 0, 5] },
              {
                table: {
                  widths: ['*', 'auto'],
                  body: [
                    [
                      { text: 'சம்பளம்', style: 'tableCell', bold: true },
                      {
                        text: formatCurrency(summary.totalBasePay + summary.totalOtPay),
                        style: 'tableCell',
                        alignment: 'right',
                        bold: true,
                        fontSize: 11,
                        color: '#000000',
                      },
                    ],
                  ],
                },
                layout: 'lightHorizontalLines',
              },
            ],
          },
        ],
      },
    ],
  };
}

function buildAttendanceMarking(status: string, otUnits: number): any {
  let marking = '';

  switch (status.toUpperCase()) {
    case 'PRESENT':
      marking = 'x';
      break;
    case 'ABSENT':
      marking = 'a';
      break;
    case 'HALF':
      marking = '/';
      break;
    default:
      marking = '-';
      break;
  }

  const ot = otUnits ?? 0;
  if (ot > 0) {
    marking += ' ';
    if (ot === 0.5) {
      marking += '/';
    } else if (ot === 1.0) {
      marking += 'x';
    } else if (ot === 1.5) {
      marking += 'x/';
    } else if (ot >= 2.0) {
      marking += 'xx';
    } else {
      marking += `(${ot} OT)`;
    }
  }

  return { text: marking, style: 'tableCell' };
}

function buildAttendanceTable(data: SalaryReportData): Content {
  const { records } = data.attendance;

  if (records.length === 0) {
    return [
      { text: 'ஆஜர் கணக்கு', style: 'sectionHeader' },
      { text: 'இக்காலத்திற்கு வருகை பதிவுகள் இல்லை', italics: true },
    ];
  }

  const tableBody = [
    [
      { text: 'தேதி', style: 'tableHeader' },
      { text: 'குறிப்பு', style: 'tableHeader' },
      { text: 'விவரம்', style: 'tableHeader' },
    ],
    ...records.map((record) => [
      { text: formatDate(record.date), style: 'tableCell' },
      buildAttendanceMarking(record.status, record.otUnits),
      { text: record.note || '-', style: 'tableCell' },
    ]),
  ];

  return [
    {
      table: {
        widths: ['*'],
        body: [[{
          text: 'ஆஜர் கணக்கு',
          bold: true,
          fontSize: 11,
          color: '#000000',
          alignment: 'center' as const,
          margin: [0, 4, 0, 4],
        }]],
      },
      layout: {
        hLineWidth: (_i: number) => (_i === 1 ? 1 : 0),
        vLineWidth: () => 0,
        hLineColor: () => '#000000',
      },
      margin: [0, 15, 0, 0],
    },
    {
      table: {
        headerRows: 1,
        widths: ['30%', '25%', '45%'],
        body: tableBody,
      },
      layout: {
        hLineColor: () => '#cccccc',
        vLineColor: () => '#cccccc',
      },
    },
  ];
}

function getWeekDaysPdf(startDate: string, endDate: string) {
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');

  const sunday = new Date(start);
  sunday.setUTCDate(sunday.getUTCDate() - start.getUTCDay());

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const isInRange = d >= start && d <= end;
    days.push({ date: dateStr, isInRange });
  }
  return days;
}

function shortDatePdf(dateString: string) {
  const d = new Date(dateString);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function buildWeeklyReportTable(data: SalaryReportData): Content {
  const weeklyReports = data.weeklyReports;

  if (!weeklyReports || weeklyReports.length === 0) {
    return [];
  }

  const DAY_NAMES = ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'ச'];

  const FS = 7;

  const tableBody: any[][] = [
    [
      { text: 'வாரம்', style: 'tableHeader', alignment: 'center' as const, fontSize: FS },
      ...DAY_NAMES.map((d) => ({ text: d, style: 'tableHeader', alignment: 'center' as const, fontSize: FS })),
      { text: 'வேலை\nநாட்கள்', style: 'tableHeader', alignment: 'center' as const, fontSize: FS },
      { text: 'OT', style: 'tableHeader', alignment: 'center' as const, fontSize: FS },
      { text: 'சம்பளம்', style: 'tableHeader', alignment: 'center' as const, fontSize: FS },
      { text: 'செலவு', style: 'tableHeader', alignment: 'center' as const, fontSize: FS },
      { text: 'சாப்பாடு', style: 'tableHeader', alignment: 'center' as const, fontSize: FS },
      { text: 'மொத்த\nசெலவு', style: 'tableHeader', alignment: 'center' as const, fontSize: FS },
      { text: 'வரவு', style: 'tableHeader', alignment: 'center' as const, fontSize: FS },
      { text: 'சைட்\nஅட்வான்ஸ்', style: 'tableHeader', alignment: 'center' as const, fontSize: FS },
    ],
  ];

  let totalAtt = 0;
  let totalOt = 0;
  let totalEarn = 0;
  let totalFood = 0;
  let totalGen = 0;
  let totalSiteAdv = 0;
  let totalExp = 0;
  let totalNet = 0;

  for (const week of weeklyReports) {
    const weekDays = getWeekDaysPdf(week.startDate, week.endDate);
    
    // Calculate Site Advance for this specific week
    const weekSiteAdvance = week.expenses
      .filter(e => e.type === 'Site' || e.type === 'Other')
      .reduce((sum, e) => sum + e.amount, 0);

    totalAtt += week.attendanceCount;
    totalOt += week.otUnits;
    totalEarn += week.earning;
    totalFood += week.expenseFood;
    totalGen += week.expenseGeneral;
    totalSiteAdv += weekSiteAdvance;
    totalExp += week.expensesTotal;
    totalNet += week.netEarning;

    const row = [
      { text: `${shortDatePdf(week.startDate)} - ${shortDatePdf(week.endDate)}`, style: 'tableCell', alignment: 'center' as const, fontSize: FS },
      ...weekDays.map((day) => {
        const att = week.attendances.find((a) => a.date === day.date);
        const markingObj = (day.isInRange && att) ? buildAttendanceMarking(att.status, att.otUnits) : { text: '' };
        return {
          text: markingObj.text?.trim() || '',
          style: 'tableCell',
          alignment: 'center' as const,
          fontSize: FS,
          color: '#000000'
        };
      }),
      { text: week.attendanceCount.toString(), style: 'tableCell', alignment: 'center' as const, fontSize: FS, bold: true },
      { text: week.otUnits > 0 ? week.otUnits.toString() : '-', style: 'tableCell', alignment: 'center' as const, fontSize: FS },
      { text: formatCurrency(week.earning), style: 'tableCell', alignment: 'right' as const, fontSize: FS, bold: true },
      { text: week.expenseGeneral > 0 ? formatCurrency(week.expenseGeneral) : '-', style: 'tableCell', alignment: 'right' as const, fontSize: FS },
      { text: week.expenseFood > 0 ? formatCurrency(week.expenseFood) : '-', style: 'tableCell', alignment: 'right' as const, fontSize: FS },
      { text: formatCurrency(week.expensesTotal), style: 'tableCell', alignment: 'right' as const, fontSize: FS, bold: true },
      { text: formatCurrency(week.netEarning), style: 'tableCell', alignment: 'right' as const, fontSize: FS, bold: true },
      { text: weekSiteAdvance > 0 ? formatCurrency(weekSiteAdvance) : '-', style: 'tableCell', alignment: 'right' as const, fontSize: FS },
    ];
    tableBody.push(row);
  }

  // Totals Row
  tableBody.push([
    { text: 'மொத்தம்', style: 'totalRow', alignment: 'center' as const, fontSize: FS, bold: true },
    ...DAY_NAMES.map(() => ({ text: '', style: 'totalRow', fontSize: FS })),
    { text: totalAtt.toString(), style: 'totalRow', alignment: 'center' as const, fontSize: FS, bold: true },
    { text: totalOt > 0 ? totalOt.toString() : '-', style: 'totalRow', alignment: 'center' as const, fontSize: FS, bold: true },
    { text: formatCurrency(totalEarn), style: 'totalRow', alignment: 'right' as const, fontSize: FS, bold: true },
    { text: totalGen > 0 ? formatCurrency(totalGen) : '-', style: 'totalRow', alignment: 'right' as const, fontSize: FS, bold: true },
    { text: totalFood > 0 ? formatCurrency(totalFood) : '-', style: 'totalRow', alignment: 'right' as const, fontSize: FS, bold: true },
    { text: formatCurrency(totalExp), style: 'totalRow', alignment: 'right' as const, fontSize: FS, bold: true },
    { text: formatCurrency(totalNet), style: 'totalRow', alignment: 'right' as const, fontSize: FS, bold: true },
    { text: totalSiteAdv > 0 ? formatCurrency(totalSiteAdv) : '-', style: 'totalRow', alignment: 'right' as const, fontSize: FS, bold: true },
  ]);

  return [
    {
      table: {
        widths: ['*'],
        body: [[{
          text: 'வாராந்திர விவரம்',
          bold: true,
          fontSize: 11,
          color: '#000000',
          alignment: 'center' as const,
          margin: [0, 4, 0, 4],
        }]],
      },
      layout: {
        hLineWidth: (_i: number) => (_i === 1 ? 1 : 0),
        vLineWidth: () => 0,
        hLineColor: () => '#000000',
      },
      margin: [0, 15, 0, 0],
    },
    {
      table: {
        headerRows: 1,
        widths: [52, 16, 16, 16, 16, 16, 16, 16, 30, 16, 36, 30, 34, 34, 34, '*'],
        body: tableBody,
      },
      layout: {
        hLineColor: () => '#cccccc',
        vLineColor: () => '#cccccc',
        paddingLeft: () => 3,
        paddingRight: () => 3,
        paddingTop: () => 4,
        paddingBottom: () => 4,
      },
    },
  ];
}

function buildExpensesTable(data: SalaryReportData): Content {
  const allRecords = data.expenses.records;
  
  // Filter out 'Site' and 'Other' expenses as they are now in the Weekly Report
  const records = allRecords.filter(r => r.type.name !== 'Site' && r.type.name !== 'Other');
  
  // Re-calculate the filtered summary total
  const filteredTotal = records.reduce((sum, r) => sum + r.amount, 0);

  if (records.length === 0) {
    return [
      { text: 'செலவு கணக்கு', style: 'sectionHeader' },
      { text: 'இக்காலத்திற்கு செலவுகள் இல்லை', italics: true },
    ];
  }

  const expenseTypeLabels: Record<string, string> = {
    Expenses: 'செலவு',
    Food: 'சாப்பாடு',
  };

  // Fixed order for preferred types
  const preferredOrder = ['Expenses', 'Food'];
  const presentTypes = new Set(records.map((r) => r.type.name));
  const typeNames = [
    ...preferredOrder.filter((name) => presentTypes.has(name)),
    ...Array.from(presentTypes).filter((name) => !preferredOrder.includes(name)),
  ];

  // Group records by date (using date string without time)
  const dateGroups = new Map<string, typeof records>();
  for (const record of records) {
    const dateKey = record.date.split('T')[0];
    if (!dateGroups.has(dateKey)) {
      dateGroups.set(dateKey, []);
    }
    dateGroups.get(dateKey)!.push(record);
  }

  // Sort dates chronologically
  const sortedDates = Array.from(dateGroups.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  // Build header row: Date | <each type> | Total | Notes
  const headerRow = [
    { text: 'தேதி', style: 'tableHeader' },
    ...typeNames.map((name) => ({ text: expenseTypeLabels[name] || name, style: 'tableHeader', alignment: 'right' as const })),
    { text: 'மொத்தம்', style: 'tableHeader', alignment: 'right' as const },
    { text: 'குறிப்புகள்', style: 'tableHeader' },
  ];

  // Build data rows - one row per date
  const dataRows = sortedDates.map((dateKey) => {
    const dayRecords = dateGroups.get(dateKey)!;

    // Calculate amount per type for this date
    const amountByType: { [typeName: string]: number } = {};
    const notesSet = new Set<string>();

    for (const record of dayRecords) {
      const typeName = record.type.name;
      amountByType[typeName] = (amountByType[typeName] || 0) + record.amount;
      if (record.note) {
        notesSet.add(record.note);
      }
    }

    const notesList = Array.from(notesSet);

    const dayTotal = dayRecords.reduce((sum, r) => sum + r.amount, 0);

    return [
      { text: formatDate(dateKey), style: 'tableCell' },
      ...typeNames.map((name) => ({
        text: amountByType[name] ? formatCurrency(amountByType[name]) : '-',
        style: 'tableCell',
        alignment: 'right' as const,
        color: '#000000',
      })),
      {
        text: formatCurrency(dayTotal),
        style: 'tableCell',
        alignment: 'right' as const,
        bold: true,
      },
      { text: notesList.length > 0 ? notesList.join(', ') : '-', style: 'tableCell' },
    ];
  });

  // Build totals row per type using the re-calculated filtered records
  const typeTotals = typeNames.map((name) => {
    const typeTotal = records.filter(r => r.type.name === name).reduce((sum, r) => sum + r.amount, 0);
    return {
      text: typeTotal > 0 ? formatCurrency(typeTotal) : '-',
      style: 'totalRow',
      alignment: 'right' as const,
      bold: true,
    };
  });

  const totalRow = [
    { text: 'மொத்தம்', style: 'totalRow', bold: true },
    ...typeTotals,
    {
      text: formatCurrency(filteredTotal),
      style: 'totalRow',
      alignment: 'right' as const,
      bold: true,
    },
    { text: '', style: 'totalRow' },
  ];

  const tableBody = [headerRow, ...dataRows, totalRow];

  // Calculate column widths: fixed narrow widths for amounts, flexible for notes
  const dateWidth = 55;
  const totalWidth = 50;
  const notesWidth = '*';
  const typeColWidth = 45; // Fixed narrow width for amounts
  const widths: any[] = [
    dateWidth,
    ...typeNames.map(() => typeColWidth),
    totalWidth,
    notesWidth,
  ];

  return [
    {
      table: {
        widths: ['*'],
        body: [[{
          text: 'செலவு கணக்கு',
          bold: true,
          fontSize: 11,
          color: '#000000',
          alignment: 'center' as const,
          margin: [0, 4, 0, 4],
        }]],
      },
      layout: {
        hLineWidth: (_i: number) => (_i === 1 ? 1 : 0),
        vLineWidth: () => 0,
        hLineColor: () => '#000000',
      },
      margin: [0, 15, 0, 0],
    },
    {
      table: {
        headerRows: 1,
        widths,
        body: tableBody,
      },
      layout: {
        hLineColor: () => '#cccccc',
        vLineColor: () => '#cccccc',
      },
    },
  ];
}

function buildAdvancesTable(data: SalaryReportData): Content {
  const { records, summary } = data.advances;

  if (records.length === 0) {
    const siteAdvanceTotal = data.expenses.records
      .filter((r) => r.type.name === 'Site' || r.type.name === 'Other')
      .reduce((sum, r) => sum + r.amount, 0);

    if (siteAdvanceTotal > 0) {
      return [];
    }

    return [
      { text: 'அட்வான்ஸ் கணக்கு', style: 'sectionHeader' },
      { text: 'இக்காலத்திற்கு அட்வான்ஸ் இல்லை', italics: true },
    ];
  }

  const tableBody = [
    [
      { text: 'தேதி', style: 'tableHeader' },
      { text: 'தொகை', style: 'tableHeader', alignment: 'right' as const },
      { text: 'காரணம்', style: 'tableHeader' },
    ],
    ...records.map((record) => [
      { text: formatDate(record.date), style: 'tableCell' },
      {
        text: formatCurrency(record.amount),
        style: 'tableCell',
        alignment: 'right' as const,
      },
      { text: record.reason || '-', style: 'tableCell' },
    ]),
    [
      { text: 'மொத்த அட்வான்ஸ்', style: 'totalRow', bold: true },
      {
        text: formatCurrency(summary.total),
        style: 'totalRow',
        alignment: 'right' as const,
        bold: true,
      },
      { text: '', style: 'totalRow' },
    ],
  ];

  return [
    {
      table: {
        widths: ['*'],
        body: [[{
          text: 'அட்வான்ஸ் கணக்கு',
          bold: true,
          fontSize: 11,
          color: '#000000',
          alignment: 'center' as const,
          margin: [0, 4, 0, 4],
        }]],
      },
      layout: {
        hLineWidth: (_i: number) => (_i === 1 ? 1 : 0),
        vLineWidth: () => 0,
        hLineColor: () => '#000000',
      },
      margin: [0, 15, 0, 0],
    },
    {
      table: {
        headerRows: 1,
        widths: ['25%', '25%', '50%'],
        body: tableBody,
      },
      layout: {
        hLineColor: () => '#cccccc',
        vLineColor: () => '#cccccc',
      },
    },
  ];
}

function buildBalanceBreakdown(data: SalaryReportData): Content {
  const { salary, advances, expenses } = data;

  const rows: any[][] = [];

  // 1. Site advance
  const siteAdvanceTotal = expenses.records
    .filter(r => r.type.name === 'Site' || r.type.name === 'Other')
    .reduce((sum, r) => sum + r.amount, 0);

  if (siteAdvanceTotal > 0) {
    rows.push([
      { text: 'சைட் அட்வான்ஸ்', style: 'tableCell' },
      { text: formatCurrency(siteAdvanceTotal), style: 'tableCell', alignment: 'right' },
    ]);
  }

  // 2. Previous cycle balance
  const openingBalance = Number(salary.openingBalance || 0);
  if (openingBalance < 0) {
    rows.push([
      { text: `${formatDate(salary.cycleStart)} - அன்று கணக்கு பார்த்து மீதி அட்வான்ஸ்`, style: 'tableCell' },
      { text: formatCurrency(Math.abs(openingBalance)), style: 'tableCell', alignment: 'right' },
    ]);
  } else if (openingBalance > 0) {
    rows.push([
      { text: `${formatDate(salary.cycleStart)} - அன்று கணக்கு பார்த்து மீதி சம்பளம்`, style: 'tableCell' },
      { text: `-${formatCurrency(openingBalance)}`, style: 'tableCell', alignment: 'right' },
    ]);
  }

  // 3. Regular advances
  if (advances.records.length > 0) {
    advances.records.forEach((adv) => {
      rows.push([
        { text: `அட்வான்ஸ் | ${formatDate(adv.date)} - ${adv.reason || '-'}`, style: 'tableCell' },
        { text: formatCurrency(adv.amount), style: 'tableCell', alignment: 'right' },
      ]);
    });
  }

  // 4. Total advances (subtract positive openingBalance, add negative openingBalance)
  const totalAdvances = siteAdvanceTotal + advances.summary.total - openingBalance;

  rows.push([
    { text: 'மொத்த அட்வான்ஸ்', style: 'totalRow', bold: true, border: [false, true, false, false], margin: [0, 3, 0, 0] },
    { text: formatCurrency(totalAdvances), style: 'totalRow', alignment: 'right', bold: true, border: [false, true, false, false], margin: [0, 3, 0, 0] },
  ]);

  // 5. Final line: subtract varavu from total advance
  const filteredExpensesTotal = expenses.records
    .filter(r => r.type.name !== 'Site' && r.type.name !== 'Other')
    .reduce((sum, r) => sum + r.amount, 0);
  const totalVaravu = Number(salary.grossPay || 0) - filteredExpensesTotal;
  const meethiAdvance = totalAdvances - totalVaravu;

  rows.push([
    {
      text: `${formatCurrency(totalAdvances)} அட்வான்சில் ${formatCurrency(Math.abs(totalVaravu))} சம்பளத்தை கழித்து மீதி அட்வான்ஸ்`,
      style: 'totalRow',
      fontSize: 10,
      border: [false, true, false, true],
      margin: [0, 3, 0, 0],
    },
    {
      text: `${meethiAdvance < 0 ? '-' : ''}${formatCurrency(Math.abs(meethiAdvance))}`,
      style: 'totalRow',
      fontSize: 12,
      alignment: 'right',
      border: [false, true, false, true],
      margin: [0, 3, 0, 0],
    },
  ]);

  return [
    {
      table: {
        widths: ['*'],
        body: [[{
          text: 'இருப்பு விவரம்',
          bold: true,
          fontSize: 11,
          color: '#000000',
          alignment: 'center' as const,
          margin: [0, 4, 0, 4],
        }]],
      },
      layout: {
        hLineWidth: (_i: number) => (_i === 1 ? 1 : 0),
        vLineWidth: () => 0,
        hLineColor: () => '#000000',
      },
      margin: [0, 15, 0, 0],
    },
    {
      table: {
        widths: ['*', 'auto'],
        body: rows,
      },
      layout: 'noBorders',
    },
  ];
}

function buildNoteSection(note: string): Content {
  return {
    margin: [0, 15, 0, 0] as [number, number, number, number],
    table: {
      widths: ['*'],
      body: [
        [
          {
            text: 'குறிப்பு / காரணம்',
            bold: true,
            fontSize: 11,
            color: '#000000',
            margin: [8, 6, 8, 6],
          },
        ],
        [
          {
            text: note,
            margin: [8, 6, 8, 6],
            italics: true,
            color: '#000000',
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#cccccc',
      vLineColor: () => '#cccccc',
    },
  };
}

function buildSignatureSection(data: SalaryReportData, signatureDataUrl?: string): Content {
  return {
    columns: [
      { width: '*', text: '' },
      {
        width: 250,
        stack: [
          signatureDataUrl
            ? {
                image: signatureDataUrl,
                width: 200,
                height: 80,
                alignment: 'center',
                margin: [25, 40, 25, 0],
              }
            : {
                text: '[கையொப்பம் பதிவாகவில்லை]',
                alignment: 'center',
                italics: true,
                color: '#000000',
                margin: [0, 50, 0, 20],
              },
          {
            canvas: [
              {
                type: 'line',
                x1: 0,
                y1: 0,
                x2: 200,
                y2: 0,
                lineWidth: 1,
                lineColor: '#000000',
              },
            ],
            margin: [25, 5, 25, 5],
          },
          {
            text: 'கையொப்பம்',
            style: 'infoLabel',
            alignment: 'center',
            margin: [0, 5, 0, 2],
          },
          {
            text: data.worker.name,
            style: 'infoValue',
            alignment: 'center',
            fontSize: 11,
            bold: true,
          },
          signatureDataUrl
            ? {
                text: `கையொப்பமிட்ட தேதி: ${formatDate(new Date().toISOString())}`,
                fontSize: 8,
                color: '#000000',
                italics: true,
                alignment: 'center',
                margin: [0, 3, 0, 0],
              }
            : [],
        ],
      },
      { width: '*', text: '' },
    ],
    margin: [0, 20, 0, 0],
  };
}

function buildFooter(data: SalaryReportData): Content {
  return [
    {
      text: '\n\n─────────────────────────────────────────────────',
      alignment: 'center',
      color: '#cccccc',
    },
    {
      text: `This is a computer-generated document. Generated on ${data.generatedAtFormatted}`,
      style: 'footer',
      margin: [0, 10, 0, 0],
    },
  ];
}
