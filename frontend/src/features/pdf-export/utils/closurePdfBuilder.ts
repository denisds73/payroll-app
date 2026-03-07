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
        color: '#1a1a2e',
        margin: [0, 0, 0, 2],
      },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        color: '#ffffff',
        fillColor: '#1a1a2e',
        margin: [0, 15, 0, 0],
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: '#FFFFFF',
        fillColor: '#1a1a2e',
      },
      tableCell: {
        fontSize: 9,
        color: '#333333',
      },
      infoLabel: {
        fontSize: 9,
        color: '#666666',
        bold: false,
      },
      infoValue: {
        fontSize: 10,
        color: '#1a1a2e',
        bold: true,
      },
      subHeader: {
        fontSize: 11,
        bold: true,
        color: '#1a1a2e',
        margin: [0, 10, 0, 5],
      },
      totalRow: {
        fontSize: 10,
        bold: true,
        color: '#1a1a2e',
      },
      footer: {
        fontSize: 8,
        color: '#999999',
        italics: false,
        alignment: 'center',
      },
    },

    defaultStyle: {
      font: 'NotoSansTamil',
      fontSize: 10,
      color: '#18181b',
    },
  };
}

function buildHeader(data: SalaryReportData): Content {
  return [
    {
      columns: [
        {
          text: 'CYCLE CLOSURE REPORT',
          style: 'documentTitle',
          width: '*',
        },
        {
          text: `#CR-${data.salary.id}`,
          fontSize: 14,
          bold: true,
          color: '#999999',
          alignment: 'right',
          width: 'auto',
        },
      ],
    },
    {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e0e0e0' }],
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
          { text: 'Worker Name', style: 'infoLabel' },
          { text: data.worker.name, style: 'infoValue', fontSize: 13 },
        ],
      },
      {
        width: 'auto',
        stack: [
          { text: 'Phone Number', style: 'infoLabel' },
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
            text: 'CYCLE PERIOD',
            colSpan: 2,
            bold: true,
            fontSize: 11,
            color: '#ffffff',
            fillColor: '#6c5ce7',
            margin: [8, 6, 8, 6],
          },
          {},
        ],
        [
          {
            text: [
              { text: 'Period Range: ', style: 'infoLabel' },
              {
                text: formatDateRange(data.salary.cycleStart, data.salary.cycleEnd),
                style: 'infoValue',
              },
            ],
            margin: [8, 6, 8, 6],
          },
          {
            text: [
              { text: 'Status: ', style: 'infoLabel' },
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
      hLineColor: () => '#e0e0e0',
      vLineColor: () => '#e0e0e0',
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
        text: 'Attendance Summary',
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
              { text: 'Days Breakdown', style: 'subHeader', margin: [0, 0, 0, 5] },
              {
                table: {
                  widths: ['*', 'auto'],
                  body: [
                    [
                      { text: 'Present Days', style: 'tableCell' },
                      {
                        text: summary.presentDays.toString(),
                        style: 'tableCell',
                        alignment: 'right',
                      },
                    ],
                    [
                      { text: 'Half Days', style: 'tableCell' },
                      { text: summary.halfDays.toString(), style: 'tableCell', alignment: 'right' },
                    ],
                    [
                      { text: 'Absent Days', style: 'tableCell' },
                      {
                        text: summary.absentDays.toString(),
                        style: 'tableCell',
                        alignment: 'right',
                      },
                    ],
                    [
                      { text: 'Total Days Worked', style: 'tableCell', bold: true },
                      {
                        text: summary.totalDays.toFixed(1),
                        style: 'tableCell',
                        alignment: 'right',
                        bold: true,
                      },
                    ],
                    [
                      { text: 'Total OT Units', style: 'tableCell', bold: true },
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
              { text: 'Payment Breakdown', style: 'subHeader', margin: [0, 0, 0, 5] },
              {
                table: {
                  widths: ['*', 'auto'],
                  body: [
                    [
                      { text: 'Base Wage Total', style: 'tableCell' },
                      {
                        text: formatCurrency(summary.totalBasePay),
                        style: 'tableCell',
                        alignment: 'right',
                        bold: true,
                        color: '#00b894',
                      },
                    ],
                    [
                      { text: 'Overtime Total', style: 'tableCell' },
                      {
                        text: formatCurrency(summary.totalOtPay),
                        style: 'tableCell',
                        alignment: 'right',
                        bold: true,
                        color: '#00b894',
                      },
                    ],
                    [
                      { text: 'Gross Pay', style: 'tableCell', bold: true },
                      {
                        text: formatCurrency(summary.totalBasePay + summary.totalOtPay),
                        style: 'tableCell',
                        alignment: 'right',
                        bold: true,
                        fontSize: 11,
                        color: '#18181b',
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
    marking += '  ';
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
      { text: 'ATTENDANCE DETAILS', style: 'sectionHeader' },
      { text: 'No attendance records for this period', italics: true },
    ];
  }

  const tableBody = [
    [
      { text: 'Date', style: 'tableHeader' },
      { text: 'Marking', style: 'tableHeader' },
      { text: 'Note', style: 'tableHeader' },
    ],
    ...records.map((record) => [
      { text: formatDate(record.date), style: 'tableCell' },
      buildAttendanceMarking(record.status, record.otUnits),
      { text: record.note || '-', style: 'tableCell' },
    ]),
  ];

  return [
    {
      text: 'ATTENDANCE DETAILS',
      bold: true,
      fontSize: 11,
      color: '#ffffff',
      fillColor: '#6c5ce7',
      margin: [0, 15, 0, 0],
      alignment: 'center' as const,
    },
    {
      table: {
        headerRows: 1,
        widths: ['30%', '25%', '45%'],
        body: tableBody,
      },
      layout: {
        fillColor: (rowIndex: number) => {
          if (rowIndex === 0) return '#6c5ce7';
          return rowIndex % 2 === 0 ? '#f8f9fa' : null;
        },
        hLineColor: () => '#e0e0e0',
        vLineColor: () => '#e0e0e0',
      },
    },
  ];
}

function buildExpensesTable(data: SalaryReportData): Content {
  const { records, summary } = data.expenses;

  if (records.length === 0) {
    return [
      { text: 'EXPENSES', style: 'sectionHeader' },
      { text: 'No expenses for this period', italics: true },
    ];
  }

  // Fixed order for preferred types
  const preferredOrder = ['Expenses', 'Food', 'Site', 'Other'];
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
    { text: 'Date', style: 'tableHeader' },
    ...typeNames.map((name) => ({ text: name, style: 'tableHeader', alignment: 'right' as const })),
    { text: 'Total', style: 'tableHeader', alignment: 'right' as const },
    { text: 'Notes', style: 'tableHeader' },
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
        color: amountByType[name] ? '#18181b' : '#a1a1aa',
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

  // Build totals row per type
  const typeTotals = typeNames.map((name) => {
    const typeTotal = summary.byType[name]?.total ?? 0;
    return {
      text: typeTotal > 0 ? formatCurrency(typeTotal) : '-',
      style: 'totalRow',
      alignment: 'right' as const,
    };
  });

  const totalRow = [
    { text: 'TOTAL', style: 'totalRow' },
    ...typeTotals,
    {
      text: formatCurrency(summary.total),
      style: 'totalRow',
      alignment: 'right' as const,
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
      text: 'EXPENSES',
      bold: true,
      fontSize: 11,
      color: '#ffffff',
      fillColor: '#0984e3',
      margin: [0, 15, 0, 0],
      alignment: 'center' as const,
    },
    {
      table: {
        headerRows: 1,
        widths,
        body: tableBody,
      },
      layout: {
        fillColor: (rowIndex: number, node: any) => {
          if (rowIndex === 0) return '#0984e3';
          if (rowIndex === node.table.body.length - 1) return '#f8f9fa';
          return rowIndex % 2 === 0 ? '#f8f9fa' : null;
        },
        hLineColor: () => '#e0e0e0',
        vLineColor: () => '#e0e0e0',
      },
    },
  ];
}

function buildAdvancesTable(data: SalaryReportData): Content {
  const { records, summary } = data.advances;

  if (records.length === 0) {
    return [
      { text: 'ADVANCES', style: 'sectionHeader' },
      { text: 'No advances for this period', italics: true },
    ];
  }

  const tableBody = [
    [
      { text: 'Date', style: 'tableHeader' },
      { text: 'Amount', style: 'tableHeader', alignment: 'right' as const },
      { text: 'Reason', style: 'tableHeader' },
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
      { text: 'TOTAL ADVANCES', style: 'totalRow' },
      {
        text: formatCurrency(summary.total),
        style: 'totalRow',
        alignment: 'right' as const,
      },
      { text: '', style: 'totalRow' },
    ],
  ];

  return [
    {
      text: 'ADVANCES',
      bold: true,
      fontSize: 11,
      color: '#ffffff',
      fillColor: '#e17055',
      margin: [0, 15, 0, 0],
      alignment: 'center' as const,
    },
    {
      table: {
        headerRows: 1,
        widths: ['25%', '25%', '50%'],
        body: tableBody,
      },
      layout: {
        fillColor: (rowIndex: number, node: any) => {
          if (rowIndex === 0) return '#e17055';
          if (rowIndex === node.table.body.length - 1) return '#f8f9fa';
          return rowIndex % 2 === 0 ? '#f8f9fa' : null;
        },
        hLineColor: () => '#e0e0e0',
        vLineColor: () => '#e0e0e0',
      },
    },
  ];
}

function buildBalanceBreakdown(data: SalaryReportData): Content {
  const { salary, attendance, advances, expenses } = data;

  const rows: any[][] = [
    [
      {
        text: `Base Pay (${attendance.summary.totalDays.toFixed(1)} days)`,
        style: 'tableCell',
      },
      {
        text: formatCurrency(salary.basePay),
        style: 'tableCell',
        alignment: 'right',
      },
    ],
    [
      {
        text: `OT Pay (${attendance.summary.totalOtUnits.toFixed(1)} units)`,
        style: 'tableCell',
      },
      {
        text: formatCurrency(salary.otPay),
        style: 'tableCell',
        alignment: 'right',
      },
    ],
    [
      {
        text: 'Gross Pay',
        style: 'totalRow',
        border: [false, true, false, false],
      },
      {
        text: formatCurrency(salary.grossPay),
        style: 'totalRow',
        alignment: 'right',
        border: [false, true, false, false],
      },
    ],
  ];

  // Add all advances
  if (advances.records.length > 0) {
    advances.records.forEach((adv) => {
      rows.push([
        {
          text: 'Less: Advance',
          style: 'tableCell',
          color: '#d63031',
        },
        {
          text: `-${formatCurrency(adv.amount)}`,
          style: 'tableCell',
          alignment: 'right',
          color: '#d63031',
        },
      ]);
    });
  }

  // Add total expenses as a single line
  if (expenses.summary.total > 0) {
    rows.push([
      {
        text: 'Less: Total expenses',
        style: 'tableCell',
        color: '#d63031',
      },
      {
        text: `-${formatCurrency(expenses.summary.total)}`,
        style: 'tableCell',
        alignment: 'right',
        color: '#d63031',
      },
    ]);
  }

  // Current Cycle Subtotal (Gross - Advances - Expenses)
  const currentCycleTotal =
    Number(salary.grossPay || 0) - Number(salary.totalAdvance || 0) - Number(salary.totalExpense || 0);

  rows.push([
    {
      text: 'Current Cycle Total',
      style: 'totalRow',
      margin: [0, 5, 0, 0],
    },
    {
      text: formatCurrency(currentCycleTotal),
      style: 'totalRow',
      alignment: 'right',
      margin: [0, 5, 0, 0],
    },
  ]);

  // Robust Math: Calculate anything not in the current cycle as "Previous Balance"
  const totalUnpaid = Number(salary.unpaidBalance || 0);
  const finalNetPayable = Number(salary.netPay || 0) + totalUnpaid;
  const previousBalance = finalNetPayable - currentCycleTotal;

  if (Math.abs(previousBalance) > 0.01) {
    rows.push([
      {
        text: previousBalance < 0 ? 'Less: Previous Balance' : 'Add: Previous Balance',
        style: 'tableCell',
        color: previousBalance < 0 ? '#d63031' : '#00b894',
      },
      {
        text: `${previousBalance < 0 ? '-' : '+'}${formatCurrency(Math.abs(previousBalance))}`,
        style: 'tableCell',
        alignment: 'right',
        color: previousBalance < 0 ? '#d63031' : '#00b894',
      },
    ]);
  }

  rows.push(
    [
      {
        text: 'TOTAL NET PAYABLE',
        style: 'totalRow',
        fontSize: 12,
        border: [false, true, false, true],
        fillColor: '#f8f9fa',
      },
      {
        text: formatCurrency(finalNetPayable),
        style: 'totalRow',
        fontSize: 12,
        alignment: 'right',
        border: [false, true, false, true],
        fillColor: '#f8f9fa',
        color: finalNetPayable >= 0 ? '#00b894' : '#d63031',
      },
    ],
    [
      { text: 'Total Paid', style: 'tableCell' },
      {
        text: formatCurrency(salary.totalPaid),
        style: 'tableCell',
        alignment: 'right',
      },
    ],
    [
      {
        text: 'Balance',
        style: 'totalRow',
        border: [false, true, false, false],
      },
      {
        text: formatCurrency(salary.netPay - salary.totalPaid),
        style: 'totalRow',
        alignment: 'right',
        border: [false, true, false, false],
        color: salary.netPay - salary.totalPaid === 0 ? '#00b894' : '#e17055',
      },
    ],
  );

  return [
    {
      text: 'BALANCE BREAKDOWN',
      bold: true,
      fontSize: 11,
      color: '#ffffff',
      fillColor: '#636e72',
      margin: [0, 15, 0, 0],
      alignment: 'center' as const,
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
            text: 'NOTE / REASON',
            bold: true,
            fontSize: 11,
            color: '#ffffff',
            fillColor: '#636e72',
            margin: [8, 6, 8, 6],
          },
        ],
        [
          {
            text: note,
            margin: [8, 6, 8, 6],
            italics: true,
            color: '#555555',
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#e0e0e0',
      vLineColor: () => '#e0e0e0',
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
                text: '[Signature not captured]',
                alignment: 'center',
                italics: true,
                color: '#9ca3af',
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
                lineColor: '#18181b',
              },
            ],
            margin: [25, 5, 25, 5],
          },
          {
            text: 'Worker Signature',
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
                text: `Signed on: ${formatDate(new Date().toISOString())}`,
                fontSize: 8,
                color: '#6b7280',
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
      color: '#e5e7eb',
    },
    {
      text: `This is a computer-generated document. Generated on ${data.generatedAtFormatted}`,
      style: 'footer',
      margin: [0, 10, 0, 0],
    },
  ];
}
